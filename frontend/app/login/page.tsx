"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { Metadata } from "next";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@ims.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("warning", "Lengkapi Form", "Email dan password wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      showToast("success", "Selamat Datang!", "Login berhasil. Mengarahkan ke dashboard...");
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (err: unknown) {
      const error = err as Error;
      showToast("error", "Login Gagal", error.message || "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Animated particles */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(99,102,241,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 60%, rgba(139,92,246,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 80%, rgba(6,182,212,0.3) 0%, transparent 100%)
          `,
          pointerEvents: "none",
        }}
      />

      <div className="login-card">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              margin: "0 auto 16px",
              boxShadow: "0 8px 30px rgba(99,102,241,0.4)",
            }}
          >
            ⚡
          </div>
          <h1
            style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px" }}
            className="gradient-text"
          >
            IMS Portal
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "6px" }}>
            Integrated Management System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <div className="input-icon-wrapper">
              <span className="input-icon">📧</span>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="admin@ims.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-icon-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-login"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "15px", marginTop: "8px" }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    display: "inline-block",
                  }}
                  className="animate-spin"
                />
                Masuk...
              </>
            ) : (
              "🚀 Masuk ke Sistem"
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div
          style={{
            marginTop: "24px",
            padding: "14px",
            borderRadius: "12px",
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--accent-primary)",
              marginBottom: "10px",
            }}
          >
            🔑 Demo Credentials
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              { role: "Admin", email: "admin@ims.com", pw: "admin123", color: "#818cf8" },
              { role: "Manager", email: "manager@ims.com", pw: "manager123", color: "#34d399" },
              { role: "Staff", email: "staff1@ims.com", pw: "staff123", color: "#fbbf24" },
            ].map((cred) => (
              <button
                key={cred.role}
                type="button"
                onClick={() => { setEmail(cred.email); setPassword(cred.pw); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: cred.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "12px", fontWeight: 600, color: cred.color, width: "56px" }}>
                  {cred.role}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  {cred.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
