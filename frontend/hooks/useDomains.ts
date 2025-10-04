import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Base URL for the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Domain configuration returned by the backend. The password field is
 * intentionally omitted for security reasons; administrators only need to
 * view non‑sensitive details such as host, port and limits.
 */
export interface Domain {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  from: string;
  limit: number;
  order: number;
  created_at: string;
}

/**
 * React hook for managing SMTP domains. Provides functionality to fetch the
 * current list of configured domains and to add new domains (admin only).
 * The hook automatically fetches domains when the authentication token
 * becomes available.
 */
export const useDomains = () => {
  const { token } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the list of domains from the backend. Requires an auth token.
   */
  const fetchDomains = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/domains`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch domains');
      }
      const data = await res.json();
      setDomains(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new domain via POST to the backend. Returns an object with
   * optional error information. On success, the domains list is refreshed.
   */
  const addDomain = async (params: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    from: string;
    limit: number;
    order?: number;
  }): Promise<{ error: string | null }> => {
    if (!token) {
      return { error: 'User is not authenticated' };
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error((errorData && errorData.error) || 'Failed to add domain');
      }
      await res.json();
      // Refresh list after successful creation
      await fetchDomains();
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch domains whenever the token changes (i.e., on login)
  useEffect(() => {
    if (token) {
      fetchDomains();
    }
  }, [token]);

  return { domains, loading, error, fetchDomains, addDomain };
};