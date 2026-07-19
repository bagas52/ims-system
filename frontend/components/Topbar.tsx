"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface PerformanceData {
  uptime: number;
  instance: string;
  memory?: { heapUsed: number; heapTotal: number };
}

export default function Topbar({ title }: { title: string }) {
  const { user } = useAuth();
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [notifCount] = useState(3);

  useEffect(() => {
    const token = localStorage.getItem("ims_token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/dashboard/performance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setPerf(d))
      .catch(() => {});
  }, []);

  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}j ${m}m`;
  };

  const initial = user?.nama?.charAt(0)?.toUpperCase() || "U";
  const now = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="topbar">
      {/* Page Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>
          {title}
        </h1>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{now}</div>
      </div>

      {/* Load Balancer Instance Badge */}
      {perf && (
        <div className="instance-badge" title="Backend Instance (Load Balanced)">
          <div className="instance-dot" />
          {perf.instance}
          <span style={{ opacity: 0.6 }}>• up {formatUptime(perf.uptime)}</span>
        </div>
      )}

      {/* Notification Bell */}
      <button
        style={{
          position: "relative",
          background: "rgba(99,102,241,0.08)",
          border: "1px solid var(--border-glass)",
          borderRadius: "10px",
          padding: "8px",
          cursor: "pointer",
          color: "var(--text-secondary)",
          fontSize: "18px",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        🔔
        {notifCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "var(--accent-red)",
              color: "white",
              fontSize: "9px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {notifCount}
          </span>
        )}
      </button>

      {/* User Avatar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 12px",
          borderRadius: "12px",
          background: "rgba(99,102,241,0.08)",
          border: "1px solid var(--border-glass)",
          cursor: "default",
        }}
      >
        <div className="avatar">{initial}</div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.2 }}>
            {user?.nama}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {user?.role}
          </div>
        </div>
      </div>
    </header>
  );
}
