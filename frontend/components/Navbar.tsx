import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";

type Props = {
  title?: string;
};

export default function Navbar({ title }: Props) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="navbar">
      <div className="left">
        <button className="hamburger" aria-label="Open Menu">☰</button>
        <div className="title">{title || "Cocoinbox"}</div>
      </div>
      <div className="right">
        {user && (
          <>
            <span className="user-email">{user.email}</span>
            <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
          </>
        )}
      </div>
      <style jsx>{`
        .navbar {
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .title {
          font-weight: 600;
          font-size: 18px;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .user-email {
          color: #64748b;
          font-size: 14px;
        }
        .sign-out-btn {
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
        .sign-out-btn:hover {
          background: #dc2626;
        }
        .hamburger {
          display: none;
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }
        @media (max-width: 900px) {
          .hamburger { display: inline-block; }
          .user-email { display: none; }
        }
      `}</style>
    </header>
  );
}