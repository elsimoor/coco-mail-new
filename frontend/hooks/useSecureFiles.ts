import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Base URL for the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SecureFile {
  id: string;
  user_id: string;
  filename: string;
  encrypted_file_url: string;
  file_size: number;
  password_protected: boolean;
  expires_at?: string;
  download_count: number;
  max_downloads?: number;
  watermark_enabled: boolean;
  created_at: string;
}

export const useSecureFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<SecureFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!user) {
      setFiles([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/user/${user.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await res.json();
      setFiles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  const uploadFile = async (
    file: File,
    password?: string,
    expiresAt?: string,
    maxDownloads?: number
  ) => {
    if (!user) return null;
    // For the MVP we assume the file is already encrypted and uploaded elsewhere.
    // The backend expects an encryptedFileUrl pointing to a stored file. Here we
    // cannot directly upload files without a storage service. You may implement
    // file upload to S3 or another storage provider and then pass the resulting
    // URL to the backend. For now, this function is a stub that reports an
    // error.
    setError('File upload is not implemented in this version.');
    return null;
  };

  const deleteFile = async (fileId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
      await fetchFiles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { files, loading, error, uploadFile, deleteFile, refetch: fetchFiles };
};
