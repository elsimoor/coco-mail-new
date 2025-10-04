import { EphemeralEmail } from '../types';
import { connectToDatabase } from '../db';
import { ObjectId } from 'mongodb';

export class EmailService {
  async createEphemeralEmail(userId: string, aliasName?: string): Promise<EphemeralEmail | null> {
    try {
      const db = await connectToDatabase();
      const emailAddress = `${Math.random().toString(36).substring(7)}@ephemeral.cocoinbox.app`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const doc: Omit<EphemeralEmail, 'id'> = {
        user_id: userId,
        email_address: emailAddress,
        alias_name: aliasName,
        expires_at: expiresAt,
        is_active: true,
        created_at: new Date().toISOString(),
      } as any;
      const result = await db.collection('ephemeral_emails').insertOne(doc);
      // Cast the document to any before spreading. This ensures TypeScript
      // doesn't complain about the ObjectId type and missing id field.
      const emailDoc: any = doc;
      return { id: result.insertedId.toString(), ...emailDoc } as EphemeralEmail;
    } catch (error) {
      console.error('Error creating ephemeral email:', error);
      return null;
    }
  }

  async getUserEmails(userId: string): Promise<EphemeralEmail[]> {
    try {
      const db = await connectToDatabase();
      const emails = await db
        .collection('ephemeral_emails')
        .find({ user_id: userId, is_active: true })
        .sort({ created_at: -1 })
        .toArray();
      // Cast each document to any before spreading. The `_id` field is an
      // ObjectId and will be converted to string for the id field. Casting
      // prevents TypeScript errors regarding incompatible types.
      return emails.map((e: any) => {
        const emailDoc: any = e;
        return { id: emailDoc._id.toString(), ...emailDoc } as EphemeralEmail;
      }) as EphemeralEmail[];
    } catch (error) {
      console.error('Error fetching user emails:', error);
      return [];
    }
  }

  async deactivateEmail(emailId: string, userId: string): Promise<boolean> {
    try {
      const db = await connectToDatabase();
      const result = await db
        .collection('ephemeral_emails')
        .updateOne({ _id: new ObjectId(emailId), user_id: userId }, { $set: { is_active: false } });
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error deactivating email:', error);
      return false;
    }
  }

  async deleteExpiredEmails(): Promise<void> {
    try {
      const db = await connectToDatabase();
      const now = new Date().toISOString();
      await db
        .collection('ephemeral_emails')
        .updateMany({ expires_at: { $lt: now } }, { $set: { is_active: false } });
    } catch (error) {
      console.error('Error deleting expired emails:', error);
    }
  }
}
