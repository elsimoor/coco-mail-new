import { Schema, model, Document } from 'mongoose';

interface ISecureNote extends Document {
  user_id: string;
  title: string;
  encrypted_content: string;
  auto_delete_after_read: boolean;
  has_been_read: boolean;
  expires_at?: string;
  created_at: string;
}

const secureNoteSchema = new Schema<ISecureNote>({
  user_id: { type: String, required: true },
  title: { type: String, required: true },
  encrypted_content: { type: String, required: true },
  auto_delete_after_read: { type: Boolean, default: false },
  has_been_read: { type: Boolean, default: false },
  expires_at: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const SecureNote = model<ISecureNote>('SecureNote', secureNoteSchema);

export default SecureNote;
export { ISecureNote };