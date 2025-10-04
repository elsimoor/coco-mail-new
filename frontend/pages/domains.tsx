import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useDomains } from '../hooks/useDomains';

/**
 * Page for managing SMTP domains. Only users with the 'admin' role may
 * access this page. It displays a list of the configured domains and
 * provides a form to add new domains. When a domain is added, the list
 * refreshes automatically.
 */
export default function DomainsPage() {
  const { user, loading: authLoading } = useAuth();
  const { domains, loading, error, addDomain } = useDomains();
  const router = useRouter();

  // Redirect non-admin users away from this page once authentication is known
  useEffect(() => {
    if (!authLoading && (!user || !user.roles?.includes('admin'))) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Form state for new domain
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [secure, setSecure] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [from, setFrom] = useState('');
  const [limit, setLimit] = useState('');
  const [order, setOrder] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    const parsedPort = parseInt(port, 10);
    const parsedLimit = parseInt(limit, 10);
    const parsedOrder = order ? parseInt(order, 10) : undefined;
    if (!host || !port || !username || !password || !from || !limit) {
      setSubmitError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }
    if (isNaN(parsedPort) || isNaN(parsedLimit)) {
      setSubmitError('Port and limit must be valid numbers');
      setSubmitting(false);
      return;
    }
    const result = await addDomain({
      host,
      port: parsedPort,
      secure,
      username,
      password,
      from,
      limit: parsedLimit,
      order: parsedOrder,
    });
    if (result.error) {
      setSubmitError(result.error);
    } else {
      // Clear form fields on success
      setHost('');
      setPort('');
      setSecure(false);
      setUsername('');
      setPassword('');
      setFrom('');
      setLimit('');
      setOrder('');
    }
    setSubmitting(false);
  };

  // Render loading or unauthorized states
  if (authLoading || !user) {
    return <div>Loading...</div>;
  }
  if (!user.roles?.includes('admin')) {
    return <Layout title="Manage Domains">
      <div>You are not authorized to view this page.</div>
    </Layout>;
  }

  return (
    <Layout title="Manage Domains">
      <div className="domains-page">
        <h1>SMTP Domains</h1>
        <p className="subtitle">Configure and view SMTP domains used for free tier email sending</p>

        {/* Display list of domains */}
        {loading ? (
          <div>Loading domains...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="domains-list">
            {domains.length === 0 ? (
              <p>No domains configured yet.</p>
            ) : (
              <table className="domain-table">
                <thead>
                  <tr>
                    <th>Host</th>
                    <th>Port</th>
                    <th>Secure</th>
                    <th>Username</th>
                    <th>From</th>
                    <th>Limit/hour</th>
                    <th>Order</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((d) => (
                    <tr key={d.id}>
                      <td>{d.host}</td>
                      <td>{d.port}</td>
                      <td>{d.secure ? 'Yes' : 'No'}</td>
                      <td>{d.username}</td>
                      <td>{d.from}</td>
                      <td>{d.limit}</td>
                      <td>{d.order}</td>
                      <td>{new Date(d.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Form to add domain */}
        <div className="form-section">
          <h2>Add New Domain</h2>
          {submitError && <div className="form-error">{submitError}</div>}
          <form onSubmit={handleSubmit} className="domain-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Host*</label>
                <input type="text" value={host} onChange={(e) => setHost(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Port*</label>
                <input type="number" value={port} onChange={(e) => setPort(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Secure*</label>
                <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} />
              </div>
              <div className="form-group">
                <label>Username*</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password*</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label>From Address*</label>
                <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Limit/hour*</label>
                <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Order (optional)</label>
                <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="submit-btn">
              {submitting ? 'Adding...' : 'Add Domain'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .domains-page {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          font-size: 36px;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #64748b;
          margin-bottom: 32px;
          font-size: 18px;
        }
        .domains-list {
          margin-bottom: 32px;
          overflow-x: auto;
        }
        .domain-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .domain-table th, .domain-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .domain-table th {
          text-align: left;
          color: #1e293b;
        }
        .form-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .form-section h2 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 24px;
          color: #1e293b;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-group label {
          margin-bottom: 4px;
          font-weight: 500;
          color: #334155;
        }
        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group input[type="password"] {
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
        }
        .form-group input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }
        .form-error {
          background: #fee2e2;
          color: #b91c1c;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .submit-btn {
          margin-top: 20px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </Layout>
  );
}