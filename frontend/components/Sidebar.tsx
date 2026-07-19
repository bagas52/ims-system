"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/items", icon: "📦", label: "Manajemen Item" },
  { href: "/users", icon: "👥", label: "Manajemen User", roles: ["Admin"] },
  { href: "/activities", icon: "🕐", label: "Riwayat Aktivitas" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const initial = user?.nama?.charAt(0)?.toUpperCase() || "U";

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div className="sidebar-logo-text">
          <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.5px", color: "var(--text-primary)" }}>
            IMS
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>
            Integrated System
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu Utama</div>
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-text">{item.label}</span>
          </Link>
        ))}

        <div className="nav-section-label" style={{ marginTop: "16px" }}>Sistem</div>
        <div
          className="nav-item"
          onClick={() => setCollapsed(!collapsed)}
          style={{ cursor: "pointer" }}
        >
          <span className="nav-item-icon">{collapsed ? "→" : "←"}</span>
          <span className="nav-item-text">Perkecil Menu</span>
        </div>
      </nav>

      {/* Footer / User Info */}
      <div className="sidebar-footer">
        <div
          className="nav-item"
          style={{
            background: "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
          }}
        >
          <div className="avatar" style={{ width: "28px", height: "28px", fontSize: "11px", borderRadius: "8px" }}>
            {initial}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.nama}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {user?.role}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-red)",
                cursor: "pointer",
                fontSize: "16px",
                padding: "2px",
                opacity: 0.7,
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
              title="Logout"
            >
              🚪
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
