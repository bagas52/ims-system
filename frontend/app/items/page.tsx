"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useApi, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface Item {
  id: number;
  nama: string;
  kategori: string;
  deskripsi: string;
  harga: number;
  stok: number;
  status: "active" | "inactive";
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FormState {
  nama: string;
  kategori: string;
  deskripsi: string;
  harga: string;
  stok: string;
  status: string;
}

const EMPTY_FORM: FormState = {
  nama: "",
  kategori: "",
  deskripsi: "",
  harga: "",
  stok: "",
  status: "active",
};

const CATEGORIES = ["Elektronik", "Pakaian", "Makanan", "Peralatan", "Furniture", "Lainnya"];

export default function ItemsPage() {
  const { request } = useApi();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 10, total: 0, totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const canManage = user?.role === "Admin" || user?.role === "Manager";
  const canDelete = user?.role === "Admin";

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
        kategori: filterKategori,
        status: filterStatus,
        sort: sortField,
        order: sortOrder,
      });
      const data = await request(`/items?${params}`);
      setItems(data.data || []);
      setPagination(data.pagination || { page, limit: 10, total: 0, totalPages: 1 });
    } catch (e: unknown) {
      const err = e as Error;
      showToast("error", "Gagal memuat data", err.message);
    } finally {
      setLoading(false);
    }
  }, [request, search, filterKategori, filterStatus, sortField, sortOrder, showToast]);

  useEffect(() => {
    fetchItems(1);
  }, [filterKategori, filterStatus, sortField, sortOrder]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchItems(1), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    else { setSortField(field); setSortOrder("DESC"); }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setModal("create"); };
  const openEdit = (item: Item) => {
    setSelected(item);
    setForm({
      nama: item.nama,
      kategori: item.kategori,
      deskripsi: item.deskripsi || "",
      harga: String(item.harga),
      stok: String(item.stok),
      status: item.status,
    });
    setModal("edit");
  };
  const openDelete = (item: Item) => { setSelected(item); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        harga: parseFloat(form.harga) || 0,
        stok: parseInt(form.stok) || 0,
      };
      if (modal === "create") {
        await request("/items", { method: "POST", body: JSON.stringify(payload) });
        showToast("success", "Item Ditambahkan", `"${form.nama}" berhasil ditambahkan.`);
      } else if (modal === "edit" && selected) {
        await request(`/items/${selected.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("success", "Item Diperbarui", `"${form.nama}" berhasil diperbarui.`);
      }
      closeModal();
      fetchItems(pagination.page);
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
      await request(`/items/${selected.id}`, { method: "DELETE" });
      showToast("success", "Item Dihapus", `"${selected.nama}" telah dihapus.`);
      closeModal();
      fetchItems(pagination.page);
    } catch (e: unknown) {
      const err = e as Error;
      showToast("error", "Gagal", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("ims_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/items/export/csv`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `items-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      showToast("success", "Export Berhasil", "File CSV telah diunduh.");
    } catch {
      showToast("error", "Export Gagal", "Coba lagi nanti.");
    }
  };

  const formatRp = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const SortIcon = ({ field }: { field: string }) => (
    <span style={{ marginLeft: "4px", opacity: sortField === field ? 1 : 0.3 }}>
      {sortField === field ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <DashboardLayout title="Manajemen Item">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title gradient-text">📦 Manajemen Item</h2>
          <p className="page-subtitle">
            {pagination.total} item ditemukan
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button id="btn-export-csv" className="btn btn-secondary" onClick={handleExportCSV}>
            📤 Export CSV
          </button>
          {canManage && (
            <button id="btn-add-item" className="btn btn-primary" onClick={openCreate}>
              ＋ Tambah Item
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper" style={{ maxWidth: "320px" }}>
          <span
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              fontSize: "15px",
            }}
          >
            🔍
          </span>
          <input
            id="search-items"
            type="text"
            className="search-input"
            placeholder="Cari nama atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="filter-kategori"
          className="input"
          style={{ width: "auto", minWidth: "150px" }}
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          id="filter-status"
          className="input"
          style={{ width: "auto", minWidth: "140px" }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>

        {(search || filterKategori || filterStatus) && (
          <button
            className="btn btn-secondary"
            onClick={() => { setSearch(""); setFilterKategori(""); setFilterStatus(""); }}
          >
            ✕ Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("nama")}>
                  Nama Item <SortIcon field="nama" />
                </th>
                <th>Kategori</th>
                <th className="sortable" onClick={() => handleSort("harga")}>
                  Harga <SortIcon field="harga" />
                </th>
                <th className="sortable" onClick={() => handleSort("stok")}>
                  Stok <SortIcon field="stok" />
                </th>
                <th>Status</th>
                <th className="sortable" onClick={() => handleSort("created_at")}>
                  Dibuat <SortIcon field="created_at" />
                </th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton" style={{ height: "16px", borderRadius: "4px" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <div className="empty-state-title">Belum ada item</div>
                      <div className="empty-state-desc">
                        {search ? "Tidak ada item yang cocok dengan pencarian." : "Tambahkan item pertama Anda."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.nama}</div>
                      {item.deskripsi && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.deskripsi}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-cyan">{item.kategori || "—"}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatRp(Number(item.harga))}</td>
                    <td>
                      <span
                        className={`badge ${item.stok > 50 ? "badge-green" : item.stok > 10 ? "badge-amber" : "badge-red"}`}
                      >
                        {item.stok} unit
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.status === "active" ? "badge-green" : "badge-gray"}`}>
                        {item.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {canManage && (
                          <button
                            className="btn btn-secondary btn-icon"
                            title="Edit"
                            onClick={() => openEdit(item)}
                          >
                            ✏️
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-icon"
                            title="Hapus"
                            onClick={() => openDelete(item)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
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
              <button
                className="page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchItems(pagination.page - 1)}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`page-btn ${p === pagination.page ? "active" : ""}`}
                    onClick={() => fetchItems(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchItems(pagination.page + 1)}
              >
                ›
              </button>
            </div>
            <div style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
              Menampilkan {items.length} dari {pagination.total} item
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
                {modal === "create" ? "➕ Tambah Item Baru" : "✏️ Edit Item"}
              </h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="input-group">
                <label className="input-label">Nama Item *</label>
                <input
                  className="input"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama item"
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label">Kategori</label>
                  <select
                    className="input"
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  >
                    <option value="">Pilih kategori</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Status</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label">Harga (Rp)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.harga}
                    onChange={(e) => setForm({ ...form, harga: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Stok</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.stok}
                    onChange={(e) => setForm({ ...form, stok: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Deskripsi</label>
                <textarea
                  className="input"
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Deskripsi item (opsional)"
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Menyimpan..." : modal === "create" ? "➕ Tambah" : "💾 Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {modal === "delete" && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🗑️</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
                Hapus Item?
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
                Item <strong style={{ color: "var(--text-primary)" }}>{selected.nama}</strong> akan
                dinonaktifkan dari sistem.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>
                  Batal
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={submitting}
                  onClick={handleDelete}
                >
                  {submitting ? "Menghapus..." : "🗑️ Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
