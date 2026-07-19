"use client";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useApi } from "@/context/AuthContext";

interface Activity {
  id: number;
  user_id: number;
  user_nama?: string;
  action: string;
  target_table?: string;
  target_id?: number;
  detail?: string;
  ip_address?: string;
  created_at: string;
}

interface Pagination {
  page: number;
  total: number;
  totalPages: number;
}

interface ChartStat {
  action: string;
  count: number;
}

const ACTION_LABELS: Record<string, { label: string; icon: string; badge: string }> = {
  LOGIN: { label: "Login", icon: "🔐", badge: "badge-blue" },
  LOGOUT: { label: "Logout", icon: "🚪", badge: "badge-gray" },
  CREATE: { label: "Buat Data", icon: "➕", badge: "badge-green" },
  UPDATE: { label: "Edit Data", icon: "✏️", badge: "badge-amber" },
  DELETE: { label: "Hapus Data", icon: "🗑️", badge: "badge-red" },
  EXPORT: { label: "Export", icon: "📤", badge: "badge-cyan" },
};

export default function ActivitiesPage() {
  const { request } = useApi();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, total: 0, totalPages: 1 });
  const [stats, setStats] = useState<ChartStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        action: filterAction,
        start_date: startDate,
        end_date: endDate,
      });
      const [actData, statData] = await Promise.all([
        request(`/activities?${params}`),
        request("/activities/stats"),
      ]);
      setActivities(actData.data || []);
      setPagination(actData.pagination || { page, total: 0, totalPages: 1 });
      setStats(statData || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [request, filterAction, startDate, endDate]);

  useEffect(() => { fetchData(1); }, [filterAction, startDate, endDate]);

  const totalStats = stats.reduce((a, s) => a + Number(s.count), 0);
  const maxStat = Math.max(...stats.map((s) => Number(s.count)), 1);

  const getActionInfo = (action: string) => ACTION_LABELS[action] || { label: action, icon: "📋", badge: "badge-gray" };

  const timeSince = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}d lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return d.toLocaleDateString("id-ID");
  };

  return (
    <DashboardLayout title="Riwayat Aktivitas">
      <div className="page-header">
        <div>
          <h2 className="page-title gradient-text">🕐 Riwayat Aktivitas</h2>
          <p className="page-subtitle">{pagination.total} log tercatat</p>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchData(pagination.page)}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "16px", fontSize: "14px", color: "var(--text-secondary)" }}>
            📊 DISTRIBUSI AKSI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "32px" }} />
              ))
            ) : stats.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px" }}>
                Belum ada data statistik
              </div>
            ) : (
              stats.map((s) => {
                const info = getActionInfo(s.action);
                const pct = Math.round((Number(s.count) / maxStat) * 100);
                return (
                  <div key={s.action} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{info.icon}</span>
                    <div style={{ width: "80px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {info.label}
                    </div>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: "var(--gradient-primary)",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        width: "32px",
                        textAlign: "right",
                      }}
                    >
                      {s.count}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          {totalStats > 0 && (
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border-glass)",
                fontSize: "13px",
                color: "var(--text-muted)",
                textAlign: "right",
              }}
            >
              Total: <strong style={{ color: "var(--text-primary)" }}>{totalStats}</strong> aktivitas
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select
          id="filter-action"
          className="input"
          style={{ width: "auto", minWidth: "160px" }}
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="">Semua Aksi</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Dari:</span>
          <input
            id="filter-start-date"
            type="date"
            className="input"
            style={{ width: "auto" }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Hingga:</span>
          <input
            id="filter-end-date"
            type="date"
            className="input"
            style={{ width: "auto" }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {(filterAction || startDate || endDate) && (
          <button className="btn btn-secondary" onClick={() => { setFilterAction(""); setStartDate(""); setEndDate(""); }}>
            ✕ Reset
          </button>
        )}
      </div>

      {/* Activity Feed */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "64px", borderRadius: "10px" }} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🕐</div>
            <div className="empty-state-title">Tidak ada aktivitas</div>
            <div className="empty-state-desc">Coba ubah filter atau rentang tanggal.</div>
          </div>
        ) : (
          <div style={{ padding: "8px" }}>
            {activities.map((activity, idx) => {
              const info = getActionInfo(activity.action);
              return (
                <div
                  key={activity.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    padding: "14px",
                    borderRadius: "12px",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.05)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Timeline line */}
                  {idx < activities.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "25px",
                        top: "46px",
                        bottom: "-14px",
                        width: "1px",
                        background: "var(--border-glass)",
                      }}
                    />
                  )}

                  {/* Action Icon */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    {info.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span className={`badge ${info.badge}`}>{info.label}</span>
                      {activity.target_table && (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {activity.target_table}
                          {activity.target_id ? `#${activity.target_id}` : ""}
                        </span>
                      )}
                    </div>
                    {activity.detail && (
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {activity.detail}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                      {activity.user_nama && (
                        <span style={{ fontSize: "12px", color: "var(--accent-primary)", fontWeight: 500 }}>
                          👤 {activity.user_nama}
                        </span>
                      )}
                      {activity.ip_address && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          📍 {activity.ip_address}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      flexShrink: 0,
                      textAlign: "right",
                    }}
                  >
                    <div>{timeSince(activity.created_at)}</div>
                    <div style={{ marginTop: "2px" }}>
                      {new Date(activity.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: "16px", borderTop: "1px solid var(--border-glass)" }}>
            <div className="pagination">
              <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)}>‹</button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${p === pagination.page ? "active" : ""}`} onClick={() => fetchData(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchData(pagination.page + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
