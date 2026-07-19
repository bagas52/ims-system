"use client";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useApi } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";

interface Stats {
  total_users: number;
  active_users: number;
  total_items: number;
  total_stok: number;
  total_value: number;
  today_activities: number;
}

interface ChartData {
  date: string;
  count: number;
}

interface PerfData {
  uptime: number;
  instance: string;
  memory: { heapUsed: number; heapTotal: number; rss: number };
  cpu: { user: number; system: number };
  timestamp: string;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: gradient }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
          {label}
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-1px" }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: ChartData[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "6px",
        height: "80px",
        padding: "8px 0",
      }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            height: "100%",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ fontSize: "9px", color: "var(--text-muted)", textAlign: "center" }}>
            {d.count}
          </div>
          <div
            style={{
              width: "100%",
              height: `${Math.max((d.count / max) * 60, 4)}px`,
              borderRadius: "4px 4px 2px 2px",
              background: i === data.length - 1
                ? "var(--gradient-primary)"
                : "rgba(99,102,241,0.3)",
              transition: "height 0.5s ease",
              minHeight: "4px",
            }}
          />
          <div style={{ fontSize: "8px", color: "var(--text-muted)", textAlign: "center", whiteSpace: "nowrap" }}>
            {new Date(d.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { request } = useApi();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chart, setChart] = useState<ChartData[]>([]);
  const [perf, setPerf] = useState<PerfData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [s, c, p] = await Promise.all([
        request("/dashboard/stats"),
        request("/dashboard/chart"),
        request("/dashboard/performance"),
      ]);
      setStats(s);
      setChart(c);
      setPerf(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const formatRp = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const formatBytes = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;
  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}j ${m}m`;
  };

  const SkeletonCard = () => (
    <div className="stat-card">
      <div className="skeleton" style={{ width: "52px", height: "52px", borderRadius: "14px" }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: "12px", width: "80px", marginBottom: "8px" }} />
        <div className="skeleton" style={{ height: "28px", width: "120px" }} />
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Dashboard">
      {/* Greeting */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>
          Selamat datang, {user?.nama?.split(" ")[0]} 👋
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Berikut ringkasan sistem Integrated Management System hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon="👥" label="Total Pengguna" value={stats?.total_users || 0}
              sub={`${stats?.active_users || 0} aktif`} gradient="rgba(99,102,241,0.2)" />
            <StatCard icon="📦" label="Total Item" value={stats?.total_items || 0}
              sub="Dalam sistem" gradient="rgba(6,182,212,0.2)" />
            <StatCard icon="🏭" label="Total Stok" value={(stats?.total_stok || 0).toLocaleString("id-ID")}
              sub="Unit tersedia" gradient="rgba(16,185,129,0.2)" />
            <StatCard icon="💰" label="Total Nilai Stok"
              value={formatRp(stats?.total_value || 0).replace("Rp", "Rp")}
              sub="Estimasi aset" gradient="rgba(245,158,11,0.2)" />
            <StatCard icon="📋" label="Aktivitas Hari Ini" value={stats?.today_activities || 0}
              sub="Log tercatat" gradient="rgba(139,92,246,0.2)" />
            <StatCard icon="🟢" label="Status Sistem"
              value="Online" sub="Semua layanan aktif" gradient="rgba(16,185,129,0.15)" />
          </>
        )}
      </div>

      {/* Charts & Performance Row */}
      <div className="content-grid">
        {/* Activity Chart */}
        <div className="chart-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>📈 Aktivitas 7 Hari Terakhir</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Log aktivitas pengguna
              </div>
            </div>
            <span className="badge badge-blue">{chart.reduce((a, c) => a + c.count, 0)} total</span>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: "100px" }} />
          ) : (
            <MiniBarChart data={chart} />
          )}
        </div>

        {/* Load Balancer / Performance */}
        <div className="chart-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>⚖️ Load Balancer Status</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Traefik — Instance aktif
              </div>
            </div>
            <div className="instance-badge">
              <div className="instance-dot" />
              {perf?.instance || "—"}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "40px" }} />
              ))}
            </div>
          ) : perf ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Uptime */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>⏱ Uptime</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-green)" }}>
                    {formatUptime(perf.uptime)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "100%", background: "var(--gradient-green)" }} />
                </div>
              </div>

              {/* Memory */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>🧠 Heap Memory</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>
                    {formatBytes(perf.memory?.heapUsed || 0)} / {formatBytes(perf.memory?.heapTotal || 1)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(((perf.memory?.heapUsed || 0) / (perf.memory?.heapTotal || 1)) * 100, 100)}%`,
                      background: "var(--gradient-cyan)",
                    }}
                  />
                </div>
              </div>

              {/* Instance Info */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Instance ID</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: "monospace", color: "#22d3ee" }}>
                    {perf.instance}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Strategy</div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>Round Robin</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Proxy</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-green)" }}>Traefik v2</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: "32px" }}>📡</div>
              <div>Data performa tidak tersedia</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: "20px" }}>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "16px", fontSize: "15px" }}>
            🚀 Akses Cepat
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            {[
              { href: "/items", icon: "📦", label: "Tambah Item", desc: "Kelola inventaris" },
              { href: "/users", icon: "👥", label: "Kelola User", desc: "Manajemen akses" },
              { href: "/activities", icon: "🕐", label: "Riwayat", desc: "Log aktivitas" },
              { href: "/items?search=", icon: "🔍", label: "Cari Data", desc: "Pencarian & filter" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.1)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.12)";
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.06)";
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.1)";
                }}
              >
                <span style={{ fontSize: "24px" }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
