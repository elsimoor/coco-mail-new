import { SecureFile } from '../types';
import * as bcrypt from 'bcrypt';
import { connectToDatabase } from '../db';
import { ObjectId } from 'mongodb';

export class FileService {
  /**
   * Create a new secure file record in MongoDB. Passwords will be hashed with
   * bcrypt if provided and the document will include a created timestamp.
   */
  async createFile(
    userId: string,
    filename: string,
    encryptedFileUrl: string,
    fileSize: number,
    passwordProtected: boolean,
    password?: string,
    expiresAt?: string,
    maxDownloads?: number,
    watermarkEnabled: boolean = true
  ): Promise<SecureFile | null> {
    try {
      const db = await connectToDatabase();
      let passwordHash: string | undefined;
      if (passwordProtected && password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      const doc: Omit<SecureFile, 'id'> = {
        user_id: userId,
        filename,
        encrypted_file_url: encryptedFileUrl,
        file_size: fileSize,
        password_protected: passwordProtected,
        password_hash: passwordHash,
        expires_at: expiresAt,
        max_downloads: maxDownloads,
        watermark_enabled: watermarkEnabled,
        download_count: 0,
        created_at: new Date().toISOString(),
      } as any;

      const result = await db.collection('secure_files').insertOne(doc);
      // Cast the document to any before spreading. This prevents TypeScript
      // errors related to the ObjectId type on the _id field. After
      // insertion the original document does not include an id field, so
      // we explicitly set it here.
      const fileDoc: any = doc;
      return {
        id: result.insertedId.toString(),
        ...fileDoc,
      } as SecureFile;
    } catch (error) {
      console.error('Error creating file:', error);
      return null;
    }
  }

  /**
   * Retrieve all secure files belonging to a given user sorted by most recent.
   */
  async getUserFiles(userId: string): Promise<SecureFile[]> {
    try {
      const db = await connectToDatabase();
      const files = await db
        .collection('secure_files')
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .toArray();
      // Cast each document to any before spreading it into the returned object.
      // Without casting, TypeScript may complain because the MongoDB document
      // includes an `_id` field with type ObjectId rather than a string. Casting
      // to any satisfies the type system and prevents compilation errors.
      return files.map((f: any) => {
        const fileDoc: any = f;
        return { id: fileDoc._id.toString(), ...fileDoc } as SecureFile;
      }) as SecureFile[];
    } catch (error) {
      console.error('Error fetching user files:', error);
      return [];
    }
  }

  /**
   * Retrieve a single secure file by its ID. Optionally validate a password if
   * the file is password protected. Returns null if not found or password is
   * invalid.
   */
  async getFile(fileId: string, password?: string): Promise<SecureFile | null> {
    try {
      const db = await connectToDatabase();
      const file = await db
        .collection('secure_files')
        .findOne({ _id: new ObjectId(fileId) });
      if (!file) {
        return null;
      }
      // password validation
      if (file.password_protected) {
        if (!password || !file.password_hash) {
          return null;
        }
        const isValid = await bcrypt.compare(password, file.password_hash);
        if (!isValid) {
          return null;
        }
      }
      // Cast file to any before spreading to avoid type mismatch between
      // ObjectId and string fields. Without casting, TypeScript complains
      // about spreading an object that contains an ObjectId. By assigning
      // the document to a local variable typed as `any`, we can spread it
      // safely. Then we explicitly set the id field as a string.
      const fileDoc: any = file;
      return { id: fileDoc._id.toString(), ...fileDoc } as SecureFile;
    } catch (error) {
      console.error('Error fetching file:', error);
      return null;
    }
  }

  /**
   * Increment the download count for a file. Returns false if the file does
   * not exist or the update fails.
   */
  async incrementDownloadCount(fileId: string): Promise<boolean> {
    try {
      const db = await connectToDatabase();
      const collection = db.collection('secure_files');
      const file = await collection.findOne({ _id: new ObjectId(fileId) }, { projection: { download_count: 1, max_downloads: 1 } });
      if (!file) {
        return false;
      }
      const newCount = (file.download_count || 0) + 1;
      const result = await collection.updateOne({ _id: file._id }, { $set: { download_count: newCount } });
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
  }

  /**
   * Delete a secure file if it belongs to the specified user.
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const db = await connectToDatabase();
      const result = await db
        .collection('secure_files')
        .deleteOne({ _id: new ObjectId(fileId), user_id: userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}
