"use client";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useApi, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface User {
  id: number;
  nama: string;
  email: string;
  role: "Admin" | "Manager" | "Staff";
  is_active: boolean;
  created_at: string;
}

interface FormState {
  nama: string;
  email: string;
  password: string;
  role: string;
}

const EMPTY_FORM: FormState = { nama: "", email: "", password: "", role: "Staff" };

export default function UsersPage() {
  const { request } = useApi();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = currentUser?.role === "Admin";

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10", search });
      const data = await request(`/users?${params}`);
      setUsers(data.data || []);
      setPagination(data.pagination || { page, total: 0, totalPages: 1 });
    } catch (e: unknown) {
      const err = e as Error;
      showToast("error", "Gagal memuat user", err.message);
    } finally {
      setLoading(false);
    }
  }, [request, search, showToast]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchUsers(1); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setModal("create"); };
  const openEdit = (u: User) => {
    setSelected(u);
    setForm({ nama: u.nama, email: u.email, password: "", role: u.role });
    setModal("edit");
  };
  const openDelete = (u: User) => { setSelected(u); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal === "create") {
        const payload: Record<string, string> = { nama: form.nama, email: form.email, password: form.password, role: form.role };
        await request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
        showToast("success", "User Dibuat", `Akun ${form.nama} berhasil dibuat.`);
      } else if (modal === "edit" && selected) {
        const payload: Record<string, string> = { nama: form.nama, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await request(`/users/${selected.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("success", "User Diperbarui", `Data ${form.nama} berhasil diperbarui.`);
      }
      closeModal();
      fetchUsers(pagination.page);
    } catch (e: unknown) {
      const err = e as Error;
      showToast("error", "Gagal", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await request(`/users/${selected.id}`, { method: "DELETE" });
      showToast("success", "User Dinonaktifkan", `Akun ${selected.nama} telah dinonaktifkan.`);
      closeModal();
      fetchUsers(pagination.page);
    } catch (e: unknown) {
      const err = e as Error;
      showToast("error", "Gagal", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = { Admin: "badge-blue", Manager: "badge-green", Staff: "badge-amber" };
    return `badge ${map[role] || "badge-gray"}`;
  };

  return (
    <DashboardLayout title="Manajemen User">
      <div className="page-header">
        <div>
          <h2 className="page-title gradient-text">👥 Manajemen User</h2>
          <p className="page-subtitle">{pagination.total} akun terdaftar</p>
        </div>
        {isAdmin && (
          <button id="btn-add-user" className="btn btn-primary" onClick={openCreate}>
            ＋ Tambah User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="filters-bar">
        <div className="search-wrapper" style={{ maxWidth: "320px" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "15px" }}>
            🔍
          </span>
          <input
            id="search-users"
            type="text"
            className="search-input"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Bergabung</th>
                {isAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isAdmin ? 6 : 5 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: "16px" }} /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-title">Tidak ada user</div>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="avatar">{u.nama.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.nama}</div>
                          {u.id === currentUser?.id && (
                            <span style={{ fontSize: "10px", color: "var(--accent-primary)" }}>● Anda</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.email}</td>
                    <td><span className={getRoleBadge(u.role)}>{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}>
                        {u.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {new Date(u.created_at).toLocaleDateString("id-ID")}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-secondary btn-icon" title="Edit" onClick={() => openEdit(u)}>
                            ✏️
                          </button>
                          {u.id !== currentUser?.id && (
                            <button className="btn btn-danger btn-icon" title="Nonaktifkan" onClick={() => openDelete(u)}>
                              🚫
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: "16px" }}>
            <div className="pagination">
              <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchUsers(pagination.page - 1)}>‹</button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${p === pagination.page ? "active" : ""}`} onClick={() => fetchUsers(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchUsers(pagination.page + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {(modal === "create" || modal === "edit") && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modal === "create" ? "➕ Tambah User Baru" : "✏️ Edit User"}
              </h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="input-group">
                <label className="input-label">Nama Lengkap *</label>
                <input className="input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="John Doe" required />
              </div>
              <div className="input-group">
                <label className="input-label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@domain.com" required />
              </div>
              <div className="input-group">
                <label className="input-label">
                  {modal === "edit" ? "Password Baru (kosongkan jika tidak diubah)" : "Password *"}
                </label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required={modal === "create"}
                  minLength={6}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Role *</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Menyimpan..." : modal === "create" ? "➕ Buat User" : "💾 Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {modal === "delete" && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: "380px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: "52px", marginBottom: "16px" }}>🚫</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>Nonaktifkan User?</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
                Akun <strong style={{ color: "var(--text-primary)" }}>{selected.nama}</strong> akan dinonaktifkan.
                User tidak dapat login lagi.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Batal</button>
                <button className="btn btn-danger" style={{ flex: 1 }} disabled={submitting} onClick={handleDelete}>
                  {submitting ? "Memproses..." : "🚫 Nonaktifkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
