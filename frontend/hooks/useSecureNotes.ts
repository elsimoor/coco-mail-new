import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Base URL for the backend API. The NEXT_PUBLIC_API_URL environment variable can be set
// at build time to point to the correct backend URL (e.g. Vercel serverless function or
// local development server). If not provided it defaults to localhost:4000.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SecureNote {
  id: string;
  user_id: string;
  title: string;
  encrypted_content: string;
  auto_delete_after_read: boolean;
  has_been_read: boolean;
  expires_at?: string;
  created_at: string;
}

export const useSecureNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/user/${user.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch notes');
      }
      const data = await res.json();
      setNotes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const createNote = async (
    title: string,
    encryptedContent: string,
    autoDeleteAfterRead: boolean = false,
    expiresAt?: string
  ) => {
    if (!user) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title,
          encryptedContent,
          autoDeleteAfterRead,
          expiresAt,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create note');
      }
      const data = await res.json();
      await fetchNotes();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const getNote = async (noteId: string) => {
    if (!user) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/${noteId}?userId=${user.id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch note');
      }
      const data = await res.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }
      await fetchNotes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { notes, loading, error, createNote, getNote, deleteNote, refetch: fetchNotes };
};
