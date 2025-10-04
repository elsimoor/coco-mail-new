import { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  roles: string[];
  is_pro: boolean;
  created_at: string;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  roles: { type: [String], default: ['user'] },
  is_pro: { type: Boolean, default: false },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const User = model<IUser>('User', userSchema);

export default User;
export { IUser };