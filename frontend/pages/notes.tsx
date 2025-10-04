import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSecureNotes } from '../hooks/useSecureNotes';

export default function Notes() {
  const { user, loading: authLoading } = useAuth();
  const { notes, loading, createNote, deleteNote } = useSecureNotes();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [autoDelete, setAutoDelete] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleCreate = async () => {
    if (!title || !content) return;

    setCreating(true);
    await createNote(title, content, autoDelete);
    setTitle('');
    setContent('');
    setAutoDelete(false);
    setShowCreateForm(false);
    setCreating(false);
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout title="Secure Notes">
      <div className="notes-page">
        <div className="header">
          <div>
            <h1>Secure Notes</h1>
            <p className="subtitle">Create encrypted notes with auto-deletion options</p>
          </div>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="create-btn">
            {showCreateForm ? 'Cancel' : 'Create Note'}
          </button>
        </div>

        {showCreateForm && (
          <div className="create-form">
            <input
              type="text"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="title-input"
            />
            <textarea
              placeholder="Note content (will be encrypted)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="content-input"
              rows={6}
            />
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoDelete}
                  onChange={(e) => setAutoDelete(e.target.checked)}
                />
                Auto-delete after first read
              </label>
              <button
                onClick={handleCreate}
                disabled={creating || !title || !content}
                className="submit-btn"
              >
                {creating ? 'Creating...' : 'Create Note'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div>Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <p>No secure notes yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                <h3>{note.title}</h3>
                {note.auto_delete_after_read && (
                  <span className="badge">Auto-delete enabled</span>
                )}
                {note.has_been_read && (
                  <span className="badge read">Already read</span>
                )}
                <div className="note-footer">
                  <span className="created">
                    Created: {new Date(note.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteNote(note.id)}
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
        .notes-page {
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 20px;
        }
        h1 {
          font-size: 36px;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        .subtitle {
          color: #64748b;
          font-size: 18px;
          margin: 0;
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
        .create-btn:hover {
          background: #1d4ed8;
        }
        .create-form {
          background: white;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .title-input,
        .content-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 16px;
          margin-bottom: 16px;
          font-family: inherit;
        }
        .title-input:focus,
        .content-input:focus {
          outline: none;
          border-color: #2563eb;
        }
        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #334155;
        }
        .checkbox-label input {
          width: auto;
          cursor: pointer;
        }
        .submit-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          background: #059669;
        }
        .submit-btn:disabled {
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
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .note-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .note-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .note-card h3 {
          margin: 0 0 12px 0;
          color: #1e293b;
          font-size: 20px;
        }
        .badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
          margin-right: 8px;
        }
        .badge.read {
          background: #dbeafe;
          color: #1e40af;
        }
        .note-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .created {
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
