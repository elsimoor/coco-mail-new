import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useEphemeralEmails } from '../hooks/useEphemeralEmails';

export default function Emails() {
  const { user, loading: authLoading } = useAuth();
  const { emails, loading, createEmail, deactivateEmail } = useEphemeralEmails();
  const [aliasName, setAliasName] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleCreate = async () => {
    setCreating(true);
    await createEmail(aliasName || undefined);
    setAliasName('');
    setCreating(false);
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout title="Ephemeral Emails">
      <div className="emails-page">
        <h1>Ephemeral Email Addresses</h1>
        <p className="subtitle">Create temporary email addresses that auto-delete after 24 hours</p>

        <div className="create-section">
          <input
            type="text"
            placeholder="Optional alias name"
            value={aliasName}
            onChange={(e) => setAliasName(e.target.value)}
            className="alias-input"
          />
          <button onClick={handleCreate} disabled={creating} className="create-btn">
            {creating ? 'Creating...' : 'Create New Email'}
          </button>
        </div>

        {loading ? (
          <div>Loading emails...</div>
        ) : emails.length === 0 ? (
          <div className="empty-state">
            <p>No active ephemeral emails. Create one to get started!</p>
          </div>
        ) : (
          <div className="emails-grid">
            {emails.map((email) => (
              <div key={email.id} className="email-card">
                <div className="email-header">
                  {email.alias_name && <h3>{email.alias_name}</h3>}
                  <span className="email-address">{email.email_address}</span>
                </div>
                <div className="email-footer">
                  <span className="expires">
                    Expires: {new Date(email.expires_at).toLocaleString()}
                  </span>
                  <button
                    onClick={() => deactivateEmail(email.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .emails-page {
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
        .create-section {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .alias-input {
          flex: 1;
          min-width: 250px;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 16px;
        }
        .alias-input:focus {
          outline: none;
          border-color: #2563eb;
        }
        .create-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .create-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .create-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
          background: white;
          border-radius: 12px;
        }
        .emails-grid {
          display: grid;
          gap: 20px;
        }
        .email-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .email-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .email-header h3 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 18px;
        }
        .email-address {
          font-family: monospace;
          color: #2563eb;
          font-size: 16px;
          font-weight: 600;
        }
        .email-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .expires {
          color: #64748b;
          font-size: 14px;
        }
        .delete-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .delete-btn:hover {
          background: #dc2626;
        }
      `}</style>
    </Layout>
  );
}
