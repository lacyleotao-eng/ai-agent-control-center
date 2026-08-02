import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Agent Control Center",
  description: "A local-first control plane for human-approved and auditable AI agent collaboration.",
};

const navigation = [
  { href: "/", label: "Dashboard", icon: "◫" },
  { href: "/workflow", label: "Workflow", icon: "↗" },
  { href: "/audit", label: "Audit Trail", icon: "◎" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link className="brand" href="/">
              <span className="brand-mark">AC</span>
              <span>
                <span className="brand-name">Agent Control Center</span>
                <span className="brand-subtitle">Community Edition</span>
              </span>
            </Link>
            <p className="nav-label">Workspace</p>
            <nav className="nav-list" aria-label="Primary navigation">
              {navigation.map((item) => (
                <Link className="nav-link" href={item.href} key={item.href}>
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="sidebar-note">
              <strong>Human-approved by design</strong>
              <p>Every workflow state change is explicit, local, and written to the audit trail.</p>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <span className="topbar-context">Local workspace / <strong>Demo Project</strong></span>
              <div className="topbar-meta">
                <span className="mode-pill">● Local-first</span>
                <span className="version-pill">v0.1.0-alpha</span>
              </div>
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
