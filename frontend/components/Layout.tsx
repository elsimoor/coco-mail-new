import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

type Props = {
  children: React.ReactNode;
  title?: string;
};

export default function Layout({ children, title }: Props) {
  return (
    <div className="app-root">
      <Navbar title={title || "Cocoinbox"} />
      <div className="main">
        <Sidebar />
        <main className="content">{children}</main>
      </div>
      <style jsx>{`
        .app-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .main {
          display: flex;
          flex: 1;
        }
        .content {
          flex: 1;
          padding: 24px;
          min-height: calc(100vh - 64px);
          background: #f6f8fa;
        }
      `}</style>
    </div>
  );
}