"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface User {
  id: number;
  nama: string;
  email: string;
  role: "Admin" | "Manager" | "Staff";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("ims_token");
    const savedUser = localStorage.getItem("ims_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Login gagal");
    }
    const data = await res.json();
    localStorage.setItem("ims_token", data.token);
    localStorage.setItem("ims_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ims_token");
    localStorage.removeItem("ims_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useApi() {
  const { token, logout } = useAuth();

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        throw new Error("Session berakhir. Silakan login kembali.");
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Terjadi kesalahan");
      return data;
    },
    [token, logout]
  );

  return { request };
}
