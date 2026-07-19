# Arsitektur Sistem IMS

Sistem **Integrated Management System (IMS)** dibangun menggunakan arsitektur *microservices-oriented* yang di-*deploy* dalam satu lingkungan Docker untuk kemudahan manajemen, namun dirancang agar dapat diskalakan (*scalable*).

## High Level Architecture

```mermaid
graph TD
    Client[Client Browser] -->|HTTP/HTTPS| Traefik[Traefik Load Balancer :80]
    
    subgraph "Docker Network (ims-network)"
        Traefik -->|/api/* (Round Robin)| Backend1[Backend 1 :5000]
        Traefik -->|/api/* (Round Robin)| Backend2[Backend 2 :5000]
        Traefik -->|/*| Frontend[Next.js Frontend :3000]
    end

    Backend1 -->|TCP/SSL| Database[(Neon PostgreSQL Cloud)]
    Backend2 -->|TCP/SSL| Database
```

## Komponen Utama

### 1. Frontend (Next.js 15)
- **Framework**: Next.js 15 App Router
- **Styling**: Tailwind CSS + Custom CSS (Glassmorphism & Dark Mode)
- **State Management**: React Context (`AuthContext`, `ToastContext`)
- **Tugas**: Menyediakan antarmuka pengguna, routing *client-side*, dan komunikasi dengan REST API backend.

### 2. Load Balancer (Traefik)
- **Role**: Reverse Proxy & Load Balancer
- **Konfigurasi**: Mendengarkan pada port 80.
- **Routing**:
  - Request ke `localhost/api/*` akan di-*route* dan di-*load balance* ke `Backend 1` dan `Backend 2`.
  - Request ke `localhost/*` (selain `/api/`) akan diarahkan ke `Frontend`.

### 3. Backend (Node.js + Express)
- **Framework**: Express.js
- **Auth**: JWT (JSON Web Tokens) dan Bcrypt (Hashing)
- **Tugas**: Menyediakan REST API, menangani logika bisnis, validasi, otorisasi (*Role Based Access Control*), dan komunikasi dengan database.
- **Skalabilitas**: Dijalankan dalam 2 instance (atau lebih) secara paralel tanpa status sesi (*stateless*). Semua status (*state*) disimpan di Database atau Token JWT di Client.

### 4. Database (Neon Tech PostgreSQL)
- **Role**: Serverless Relational Database (di-*hosting* di cloud).
- **Tugas**: Menyimpan data persisten (Users, Items, Activity Logs).
- **Akses**: Semua instance Backend terhubung ke *connection pool* Neon secara independen.
