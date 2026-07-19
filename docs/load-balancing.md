# Implementasi Load Balancing

Proyek IMS mengimplementasikan arsitektur Load Balancing menggunakan **Traefik v2** sebagai Reverse Proxy dan Load Balancer dinamis. Arsitektur ini dipilih karena integrasi bawaannya (*native*) yang sangat baik dengan Docker.

## Konsep Load Balancing

Load balancing bertujuan untuk mendistribusikan lalu lintas jaringan (HTTP requests) secara seimbang melintasi beberapa server *backend* (instances). Tujuannya adalah untuk:
1. **Meningkatkan Kapasitas / Skalabilitas**: Beban tidak ditumpukan ke satu server.
2. **Ketersediaan Tinggi (High Availability)**: Jika satu *instance backend* mati atau mengalami gangguan, Traefik otomatis akan mengalihkan *traffic* ke instance yang masih sehat.

## Konfigurasi Traefik di IMS

Dalam file `docker-compose.yml`, Traefik diatur untuk menangani semua request yang masuk ke `port 80` (HTTP standard). 

Terdapat 2 instance backend yang berjalan secara bersamaan: `backend1` dan `backend2`. Keduanya memiliki *image* Docker dan konfigurasi *environment* yang sama persis, perbedaannya hanya pada variabel `INSTANCE_ID`.

### Traefik Labels (Docker Auto-Discovery)

Alih-alih menulis file konfigurasi Nginx/Traefik statis yang panjang, Traefik mendeteksi *backend* secara otomatis melalui label Docker:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.backend.rule=Host(`localhost`) && PathPrefix(`/api`)"
  - "traefik.http.services.backend-lb.loadbalancer.server.port=5000"
  - "traefik.http.routers.backend.service=backend-lb"
```

Karena `backend1` dan `backend2` menggunakan nama *router* (`backend`) dan nama *service* (`backend-lb`) yang sama, Traefik akan secara otomatis mengelompokkan kedua *container* tersebut ke dalam satu *pool load balancer*.

### Strategi Load Balancing

Traefik secara default menggunakan strategi **Weighted Round Robin (WRR)**. 
Strategi ini bekerja dengan membagikan request pertama ke `backend1`, request kedua ke `backend2`, request ketiga kembali ke `backend1`, dan seterusnya.

### Pembuktian Load Balancing di Aplikasi

Di dalam aplikasi, pembuktian bahwa load balancing berfungsi dapat dilihat pada halaman **Dashboard**.
Terdapat kotak informasi **Load Balancer Status** di bagian atas (Topbar) dan di tabel performa Dashboard.
- Status akan menampilkan ID Instance (contoh: `backend-instance-1` atau `backend-instance-2`).
- Saat Anda me-*refresh* halaman secara berkala, Anda akan melihat ID Instance tersebut berganti secara bergantian, menandakan bahwa request Anda didistribusikan secara *Round Robin* oleh Traefik ke dua server yang berbeda.
