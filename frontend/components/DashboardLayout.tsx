"use client";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(99,102,241,0.2)",
            borderTop: "3px solid var(--accent-primary)",
            borderRadius: "50%",
          }}
          className="animate-spin"
        />
        <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Memuat sistem...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="app-container">
      <Sidebar />
      <div
        className="main-content"
        style={{ marginLeft: "260px", transition: "margin-left 0.3s" }}
      >
        <Topbar title={title} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
