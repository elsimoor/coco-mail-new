import { SecureNote } from '../types';
import { connectToDatabase } from '../db';
import { ObjectId } from 'mongodb';

export class NoteService {
  async createNote(
    userId: string,
    title: string,
    encryptedContent: string,
    autoDeleteAfterRead: boolean,
    expiresAt?: string
  ): Promise<SecureNote | null> {
    try {
      const db = await connectToDatabase();
      const doc: Omit<SecureNote, 'id'> = {
        user_id: userId,
        title,
        encrypted_content: encryptedContent,
        auto_delete_after_read: autoDeleteAfterRead,
        has_been_read: false,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      } as any;
      const result = await db.collection('secure_notes').insertOne(doc);
      // Cast the document to any before spreading. This prevents TypeScript
      // errors due to the ObjectId type on the `_id` field.
      const noteDoc: any = doc;
      return { id: result.insertedId.toString(), ...noteDoc } as SecureNote;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  }

  async getUserNotes(userId: string): Promise<SecureNote[]> {
    try {
      const db = await connectToDatabase();
      const notes = await db
        .collection('secure_notes')
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .toArray();
      // Cast each document to any before spreading to avoid type mismatch. The
      // MongoDB document includes an `_id` field which is an ObjectId; casting
      // suppresses related type errors.
      return notes.map((n: any) => {
        const noteDoc: any = n;
        return { id: noteDoc._id.toString(), ...noteDoc } as SecureNote;
      }) as SecureNote[];
    } catch (error) {
      console.error('Error fetching user notes:', error);
      return [];
    }
  }

  async getNote(noteId: string, userId: string): Promise<SecureNote | null> {
    try {
      const db = await connectToDatabase();
      const note = await db
        .collection('secure_notes')
        .findOne({ _id: new ObjectId(noteId), user_id: userId });
      if (!note) {
        return null;
      }
      // If auto-delete-after-read, mark as read
      if (note.auto_delete_after_read && !note.has_been_read) {
        await db
          .collection('secure_notes')
          .updateOne({ _id: note._id }, { $set: { has_been_read: true } });
      }
      // Cast the note document to any before spreading it. Without casting,
      // TypeScript will complain because the document contains an ObjectId
      // field. Assigning to a local variable typed as `any` allows us to
      // spread the properties freely. We also set the id property to the
      // stringified ObjectId.
      const noteDoc: any = note;
      return { id: noteDoc._id.toString(), ...noteDoc } as SecureNote;
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  }

  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const db = await connectToDatabase();
      const result = await db
        .collection('secure_notes')
        .deleteOne({ _id: new ObjectId(noteId), user_id: userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }
}
