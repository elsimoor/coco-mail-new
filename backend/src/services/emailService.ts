import { EphemeralEmail as EphemeralEmailType } from '../types';
import EphemeralEmail from '../models/EphemeralEmail';
import { connectToDatabase } from '../db';

export class EmailService {
  async createEphemeralEmail(userId: string, aliasName?: string): Promise<EphemeralEmailType | null> {
    try {
      await connectToDatabase();
      const emailAddress = `${Math.random().toString(36).substring(7)}@ephemeral.cocoinbox.app`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const doc = {
        user_id: userId,
        email_address: emailAddress,
        alias_name: aliasName,
        expires_at: expiresAt,
      };
      const createdEmail = await EphemeralEmail.create(doc);
      const { _id, __v, ...emailFields } = createdEmail.toObject();
      return { id: createdEmail.id, ...emailFields } as EphemeralEmailType;
    } catch (error) {
      console.error('Error creating ephemeral email:', error);
      return null;
    }
  }

  async getUserEmails(userId: string): Promise<EphemeralEmailType[]> {
    try {
      await connectToDatabase();
      const emails = await EphemeralEmail.find({ user_id: userId, is_active: true })
        .sort({ created_at: -1 })
        .lean();

      return emails.map((e) => {
        const { _id, __v, ...rest } = e;
        return { id: _id.toString(), ...rest };
      }) as EphemeralEmailType[];
    } catch (error) {
      console.error('Error fetching user emails:', error);
      return [];
    }
  }

  async deactivateEmail(emailId: string, userId: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const result = await EphemeralEmail.updateOne({ _id: emailId, user_id: userId }, { $set: { is_active: false } });
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error deactivating email:', error);
      return false;
    }
  }

  async deleteExpiredEmails(): Promise<void> {
    try {
      await connectToDatabase();
      const now = new Date().toISOString();
      await EphemeralEmail.updateMany({ expires_at: { $lt: now } }, { $set: { is_active: false } });
    } catch (error) {
      console.error('Error deleting expired emails:', error);
    }
  }
}