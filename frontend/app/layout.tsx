import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "IMS — Integrated Management System",
    template: "%s | IMS",
  },
  description:
    "Platform manajemen terpadu dengan fitur CRUD, dashboard interaktif, pencarian data, notifikasi real-time, dan load balancing enterprise-grade.",
  keywords: ["IMS", "manajemen", "sistem integrasi", "dashboard", "CRUD"],
  authors: [{ name: "IMS Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
