import { SecureNote as SecureNoteType } from '../types';
import SecureNote from '../models/SecureNote';
import { connectToDatabase } from '../db';

export class NoteService {
  async createNote(
    userId: string,
    title: string,
    encryptedContent: string,
    autoDeleteAfterRead: boolean,
    expiresAt?: string
  ): Promise<SecureNoteType | null> {
    try {
      await connectToDatabase();
      const doc = {
        user_id: userId,
        title,
        encrypted_content: encryptedContent,
        auto_delete_after_read: autoDeleteAfterRead,
        has_been_read: false,
        expires_at: expiresAt,
      };
      const createdNote = await SecureNote.create(doc);
      const { _id, __v, ...noteFields } = createdNote.toObject();
      return { id: createdNote.id, ...noteFields } as SecureNoteType;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  }

  async getUserNotes(userId: string): Promise<SecureNoteType[]> {
    try {
      await connectToDatabase();
      const notes = await SecureNote.find({ user_id: userId })
        .sort({ created_at: -1 })
        .lean();

      return notes.map((n) => {
        const { _id, __v, ...rest } = n;
        return { id: _id.toString(), ...rest };
      }) as SecureNoteType[];
    } catch (error) {
      console.error('Error fetching user notes:', error);
      return [];
    }
  }

  async getNote(noteId: string, userId: string): Promise<SecureNoteType | null> {
    try {
      await connectToDatabase();
      const note = await SecureNote.findOne({ _id: noteId, user_id: userId });
      if (!note) {
        return null;
      }
      // If auto-delete-after-read, mark as read
      if (note.auto_delete_after_read && !note.has_been_read) {
        note.has_been_read = true;
        await note.save();
      }

      const { _id, __v, ...noteFields } = note.toObject();
      return { id: note.id, ...noteFields } as SecureNoteType;
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  }

  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const result = await SecureNote.deleteOne({ _id: noteId, user_id: userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }
}