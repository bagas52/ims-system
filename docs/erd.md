# Entity Relationship Diagram (ERD)

Sistem IMS menggunakan PostgreSQL dengan skema rasional sederhana namun kokoh, dirancang untuk mendukung fitur CRUD dan pencatatan aktivitas terpusat.

## Diagram ERD

```mermaid
erDiagram
    USERS {
        int id PK
        varchar nama
        varchar email "UNIQUE"
        text password
        varchar role "Admin/Manager/Staff"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ITEMS {
        int id PK
        varchar nama
        varchar kategori
        text deskripsi
        decimal harga
        int stok
        varchar status "active/inactive"
        int created_by FK "-> USERS.id"
        timestamp created_at
        timestamp updated_at
    }

    ACTIVITY_LOGS {
        int id PK
        int user_id FK "-> USERS.id"
        varchar action
        varchar target_table
        int target_id
        text detail
        varchar ip_address
        timestamp created_at
    }

    USERS ||--o{ ITEMS : "creates"
    USERS ||--o{ ACTIVITY_LOGS : "performs"
```

## Deskripsi Tabel

### 1. Tabel `users`
Menyimpan informasi autentikasi dan profil pengguna.
- `role` digunakan untuk otorisasi akses (Admin memiliki hak hapus, Manager memiliki hak edit/tambah, Staff hak baca).
- `is_active` digunakan untuk *soft-delete*.

### 2. Tabel `items`
Menyimpan data master inventaris/produk.
- Terhubung dengan `users` melalui kolom `created_by` untuk *tracking* siapa yang menambahkan item tersebut.
- `status` ('active' / 'inactive') digunakan untuk filter *soft-delete*.

### 3. Tabel `activity_logs`
Tabel riwayat untuk audit trail (Sistem Notifikasi/Riwayat Aktivitas).
- Mencatat aksi (`LOGIN`, `CREATE`, `UPDATE`, `DELETE`) dan merujuk ke tabel lain (`target_table` dan `target_id`).
- Digunakan untuk analitik di halaman Dashboard dan tabel timeline di halaman Riwayat Aktivitas.
