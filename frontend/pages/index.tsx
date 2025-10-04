import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

/**
 * The home page for Cocoinbox displays a simple landing section. If the user
 * is authenticated, a button linking to the dashboard is shown. Otherwise
 * the user can navigate to the login or signup pages. This page avoids
 * importing any unused context or GraphQL code and relies solely on the
 * AuthContext from the `contexts` directory.
 */
const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="logo">Cocoinbox</div>
        <div className="nav-links">
          {user ? (
            <Link href="/dashboard">
              <button className="btn-primary">Dashboard</button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <button className="btn-secondary">Login</button>
              </Link>
              <Link href="/signup">
                <button className="btn-primary">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="hero">
        <h1>Privacy‑Focused Super Application</h1>
        <p className="subtitle">
          Secure temporary emails, encrypted notes and protected file sharing — all in one place.
        </p>
        <div className="features">
          <div className="feature-card">
            <h3>Ephemeral Emails</h3>
            <p>Temporary email addresses that auto‑delete after use.</p>
          </div>
          <div className="feature-card">
            <h3>Secure Notes</h3>
            <p>AES‑256 encrypted notes with auto‑deletion options.</p>
          </div>
          <div className="feature-card">
            <h3>File Sharing</h3>
            <p>Password‑protected, watermarked file uploads with expiration.</p>
          </div>
        </div>
      </main>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
          color: white;
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
        }
        .nav-links {
          display: flex;
          gap: 12px;
        }
        .btn-primary {
          background: white;
          color: #2563eb;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
        }
        .btn-secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: white;
          color: #2563eb;
        }
        .hero {
          text-align: center;
          padding: 80px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          font-size: 56px;
          margin-bottom: 20px;
          font-weight: 700;
        }
        .subtitle {
          font-size: 20px;
          margin-bottom: 60px;
          opacity: 0.9;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
          margin-top: 60px;
        }
        .feature-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 16px;
          transition: transform 0.3s;
        }
        .feature-card:hover {
          transform: translateY(-8px);
        }
        .feature-card h3 {
          font-size: 24px;
          margin-bottom: 12px;
        }
        .feature-card p {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default HomePage;