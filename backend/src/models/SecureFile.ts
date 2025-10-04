import { Schema, model, Document } from 'mongoose';

interface ISecureFile extends Document {
  user_id: string;
  filename: string;
  encrypted_file_url: string;
  file_size: number;
  password_protected: boolean;
  password_hash?: string;
  expires_at?: string;
  max_downloads?: number;
  watermark_enabled: boolean;
  download_count: number;
  created_at: string;
}

const secureFileSchema = new Schema<ISecureFile>({
  user_id: { type: String, required: true },
  filename: { type: String, required: true },
  encrypted_file_url: { type: String, required: true },
  file_size: { type: Number, required: true },
  password_protected: { type: Boolean, default: false },
  password_hash: { type: String },
  expires_at: { type: String },
  max_downloads: { type: Number },
  watermark_enabled: { type: Boolean, default: true },
  download_count: { type: Number, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const SecureFile = model<ISecureFile>('SecureFile', secureFileSchema);

export default SecureFile;
export { ISecureFile };