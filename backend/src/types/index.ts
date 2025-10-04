export interface EphemeralEmail {
  id: string;
  user_id: string;
  email_address: string;
  alias_name?: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface SecureNote {
  id: string;
  user_id: string;
  title: string;
  encrypted_content: string;
  auto_delete_after_read: boolean;
  has_been_read: boolean;
  expires_at?: string;
  created_at: string;
}

export interface SecureFile {
  id: string;
  user_id: string;
  filename: string;
  encrypted_file_url: string;
  file_size: number;
  password_protected: boolean;
  password_hash?: string;
  expires_at?: string;
  download_count: number;
  max_downloads?: number;
  watermark_enabled: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  is_pro: boolean;
  created_at: string;
}
