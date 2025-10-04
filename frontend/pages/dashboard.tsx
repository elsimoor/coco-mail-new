import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout title="Dashboard">
      <div className="dashboard">
        <h1>Welcome to Cocoinbox</h1>
        <p className="welcome-text">Manage your privacy tools from one secure location</p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <h3>Ephemeral Emails</h3>
              <p className="stat-number">0</p>
              <p className="stat-label">Active addresses</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Secure Notes</h3>
              <p className="stat-number">0</p>
              <p className="stat-label">Encrypted notes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <h3>Secure Files</h3>
              <p className="stat-number">0</p>
              <p className="stat-label">Protected files</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => router.push('/emails')}>
              Create Ephemeral Email
            </button>
            <button className="action-btn" onClick={() => router.push('/notes')}>
              Create Secure Note
            </button>
            <button className="action-btn" onClick={() => router.push('/files')}>
              Upload Secure File
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          font-size: 36px;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .welcome-text {
          color: #64748b;
          margin-bottom: 40px;
          font-size: 18px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .stat-icon {
          font-size: 40px;
        }
        .stat-content h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #64748b;
          font-weight: 600;
        }
        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: #2563eb;
          margin: 0;
        }
        .stat-label {
          margin: 4px 0 0 0;
          color: #94a3b8;
          font-size: 14px;
        }
        .quick-actions h2 {
          font-size: 24px;
          color: #1e293b;
          margin-bottom: 20px;
        }
        .action-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .action-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
        }
      `}</style>
    </Layout>
  );
}
