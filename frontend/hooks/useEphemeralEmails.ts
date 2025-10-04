import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Base URL for the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface EphemeralEmail {
  id: string;
  user_id: string;
  email_address: string;
  alias_name?: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export const useEphemeralEmails = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<EphemeralEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    if (!user) {
      setEmails([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/emails/user/${user.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch emails');
      }
      const data = await res.json();
      setEmails(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [user]);

  const createEmail = async (aliasName?: string) => {
    if (!user) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/emails/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, aliasName }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create email');
      }
      const data = await res.json();
      await fetchEmails();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const deactivateEmail = async (emailId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/emails/${emailId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to deactivate email');
      }
      await fetchEmails();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { emails, loading, error, createEmail, deactivateEmail, refetch: fetchEmails };
};
