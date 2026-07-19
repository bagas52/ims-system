# IMS - Integrated Management System

Platform web modern untuk manajemen data terpadu dengan arsitektur skalabel. 
Dibangun menggunakan **Next.js 15**, **Express.js**, **Neon PostgreSQL**, dan Load Balancing dengan **Traefik**.

## 🚀 Fitur Utama
1. **Autentikasi & Otorisasi**: Login dengan JWT dan hak akses peran (Admin, Manager, Staff).
2. **Dashboard Interaktif**: Statistik real-time, grafik aktivitas 7 hari terakhir, dan monitoring server.
3. **Manajemen Item**: CRUD penuh, filter, pencarian *debounced*, *sorting*, dan export CSV.
4. **Manajemen User**: Pengelolaan akun oleh Admin.
5. **Riwayat Aktivitas (Log)**: Pencatatan otomatis setiap aksi yang dilakukan oleh pengguna (Login, Tambah Data, Edit, Hapus).

## 🛠️ Stack Teknologi
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Custom UI (Glassmorphism, Dark Theme).
- **Backend**: Node.js, Express.js, JWT, bcrypt.
- **Database**: PostgreSQL (Serverless via Neon.tech), pg.
- **Infrastruktur**: Docker, Docker Compose, Traefik (Reverse Proxy & Load Balancer).

---

## 💻 Panduan Instalasi & Menjalankan Aplikasi

Aplikasi ini disiapkan agar dapat dijalankan secara terintegrasi menggunakan **Docker Compose**.

### Prasyarat
- Docker dan Docker Desktop / Docker Compose terinstall.
- Koneksi Internet (untuk akses database Neon Cloud).

### Langkah Menjalankan Aplikasi

**1. Clone atau masuk ke direktori proyek**
```bash
cd /path/to/ims-system
```

**2. Jalankan Docker Compose**
Perintah ini akan mem-build *image* frontend dan backend, serta menjalankan 1 container Traefik, 1 container Frontend, dan 2 container Backend (untuk load balancing).
```bash
docker-compose up -d --build
```

**3. Akses Aplikasi**
Buka browser dan akses alamat berikut:
- **Aplikasi Web**: [http://localhost](http://localhost)
- **Traefik Dashboard** (Monitoring): [http://localhost:8080](http://localhost:8080)
- **API Health Check**: [http://localhost/api/dashboard/stats](http://localhost/api/dashboard/stats)

---

## 🔑 Akun Demo (Credentials)

Sistem telah di-*seed* dengan data awal dan akun demo berikut:

| Role | Email | Password | Hak Akses |
|------|-------|----------|-----------|
| **Admin** | `admin@ims.com` | `admin123` | Akses penuh (CRUD Item & User, Export, Hapus) |
| **Manager**| `manager@ims.com` | `manager123` | Akses Dashboard, Manajemen Item (Kecuali Hapus) |
| **Staff** | `staff1@ims.com` | `staff123` | Akses Dashboard, Hanya bisa melihat Item (Read) |

## 📚 Dokumentasi Lebih Lanjut
Silakan merujuk ke folder `/docs/` untuk melihat detail arsitektur:
- [Arsitektur Sistem](docs/architecture.md)
- [Diagram ERD Database](docs/erd.md)
- [Implementasi Load Balancing](docs/load-balancing.md)
