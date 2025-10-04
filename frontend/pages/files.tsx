import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSecureFiles } from '../hooks/useSecureFiles';

export default function Files() {
  const { user, loading: authLoading } = useAuth();
  const { files, loading, uploadFile, deleteFile } = useSecureFiles();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    await uploadFile(selectedFile);
    setSelectedFile(null);
    setUploading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout title="Secure Files">
      <div className="files-page">
        <h1>Secure File Sharing</h1>
        <p className="subtitle">Upload encrypted files with password protection and watermarking</p>

        <div className="upload-section">
          <div className="file-input-wrapper">
            <input
              type="file"
              onChange={handleFileChange}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {selectedFile ? selectedFile.name : 'Choose a file'}
            </label>
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="upload-btn"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {loading ? (
          <div>Loading files...</div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <p>No secure files yet. Upload one to get started!</p>
          </div>
        ) : (
          <div className="files-grid">
            {files.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-icon">📁</div>
                <div className="file-info">
                  <h3>{file.filename}</h3>
                  <div className="file-meta">
                    <span>{formatFileSize(file.file_size)}</span>
                    {file.watermark_enabled && (
                      <span className="badge">Watermarked</span>
                    )}
                    {file.password_protected && (
                      <span className="badge">Password Protected</span>
                    )}
                  </div>
                  <div className="file-stats">
                    <span>Downloads: {file.download_count}</span>
                    {file.max_downloads && (
                      <span> / {file.max_downloads}</span>
                    )}
                  </div>
                  <div className="file-footer">
                    <span className="created">
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .files-page {
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
        .upload-section {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .file-input-wrapper {
          flex: 1;
          min-width: 250px;
        }
        .file-input {
          display: none;
        }
        .file-label {
          display: block;
          padding: 12px 16px;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          color: #64748b;
        }
        .file-label:hover {
          border-color: #2563eb;
          color: #2563eb;
        }
        .upload-btn {
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
        .upload-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .upload-btn:disabled {
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
        .files-grid {
          display: grid;
          gap: 20px;
        }
        .file-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .file-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .file-icon {
          font-size: 48px;
        }
        .file-info {
          flex: 1;
        }
        .file-info h3 {
          margin: 0 0 12px 0;
          color: #1e293b;
          font-size: 18px;
          word-break: break-all;
        }
        .file-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 8px;
        }
        .file-meta span {
          color: #64748b;
          font-size: 14px;
        }
        .badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .file-stats {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .file-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
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
