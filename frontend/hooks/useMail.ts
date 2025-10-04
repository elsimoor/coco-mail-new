import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Base URL for the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * React hook for sending and receiving emails via the backend mail endpoints.
 *
 * The backend provides two endpoints under `/api/mail`:
 *   - POST `/send` to send an email on behalf of the authenticated user.
 *   - GET `/inbox` to fetch received messages (for free tier using smtp.dev).
 *
 * This hook exposes `sendEmail` and `fetchInbox` functions along with loading
 * and error state. The `sendEmail` function accepts an object with `to`,
 * `subject`, and optional `text` and `html` properties. It returns the
 * backend response on success or `null` on failure.
 */
export const useMail = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send an email using the backend. Requires the user to be authenticated
   * (token must be present). If the token is missing, this function will
   * return `null` and set an error message.
   */
  const sendEmail = async (params: { to: string; subject: string; text?: string; html?: string }) => {
    const { to, subject, text, html } = params;
    if (!token) {
      setError('User is not authenticated');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mail/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to, subject, text, html }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      const data = await res.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch inbox messages from the backend. For free-tier users this calls
   * smtp.dev via the backend; premium inbound email is not implemented and
   * will return an empty array. Requires authentication.
   */
  const fetchInbox = async () => {
    if (!token) {
      setError('User is not authenticated');
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mail/inbox`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch inbox');
      }
      const data = await res.json();
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { sendEmail, fetchInbox, loading, error };
};