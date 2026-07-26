# TA-SIMBIMA: Sistem Informasi Monitoring Pembinaan Mahasiswa Asrama

Sistem informasi terintegrasi untuk monitoring, absensi kegiatan pembinaan, dan pengelolaan perizinan kepulangan mahasiswa asrama di Universitas Andalas. Proyek ini dibangun menggunakan arsitektur **Modern Web Application** (Frontend React/Vite + Backend Node.js/Express/Prisma + Database MySQL 8.0).

---

## 🚀 Cara Menjalankan secara Lokal (Local Development)

Proyek ini telah dikonfigurasi penuh untuk dijalankan di lingkungan kontainer menggunakan **Docker Compose**. Anda tidak perlu menginstal Node.js atau MySQL di mesin lokal Anda, cukup Docker dan Docker Compose.

1. **Salin file konfigurasi environment:**
   ```bash
   cp .env.example .env
   ```
   *(Secara opsional, Anda dapat mengubah nilai di dalam `.env` sesuai kebutuhan lokal Anda).*

2. **Jalankan aplikasi dengan Docker Compose:**
   ```bash
   docker compose up -d --build
   ```

3. **Akses Aplikasi:**
   * **Frontend Web App (Main Service):** [http://localhost:8080](http://localhost:8080)
   * **Backend API Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

4. **Melihat Log atau Menghentikan Layanan:**
   ```bash
   # Melihat log secara real-time
   docker compose logs -f

   # Menghentikan seluruh container
   docker compose down
   ```

---

## ☁️ Setting Deployment di MyPaas (Self-Hosted PaaS)

Repositori ini telah dioptimalkan untuk deployment pada platform **MyPaas** (berbasis Docker Compose) dengan kepatuhan penuh terhadap standar *non-root container*, *healthchecks*, dan komunikasi antar-layanan melalui DNS internal Docker.

Gunakan parameter berikut saat melakukan konfigurasi deployment di dasbor MyPaas:

| Parameter | Nilai / Konfigurasi | Keterangan |
| :--- | :--- | :--- |
| **Deploy Mode** | `Docker Compose` (atau `Compose`) | Menggunakan file `compose.yml` di root repositori. |
| **Main Service** | `app` | Layanan Nginx unprivileged yang menyajikan statis Vite & reverse proxy API. |
| **App Port** | `8080` | Port container eksternal untuk layanan utama (`app`). |

### Required Environment Keys (Variabel Lingkungan)
Pastikan Anda menambahkan seluruh *key* berikut ke dalam pengaturan *Environment Variables* di MyPaas (silakan merujuk ke file [.env.example](file:///d:/Vs%20code/TA%20%28simbima%29/.env.example) untuk placeholder aman):

* `MYSQL_ROOT_PASSWORD`: Password root MySQL (contoh: `super_secure_root_pass_2026`).
* `MYSQL_DATABASE`: Nama database (default: `simbima_db`).
* `MYSQL_USER`: User database aplikasi (default: `simbima_user`).
* `MYSQL_PASSWORD`: Password user database (contoh: `super_secure_user_pass_2026`).
* `DATABASE_URL`: URL koneksi Prisma. **PENTING:** Harus mengacu ke service name `db` (contoh: `mysql://simbima_user:super_secure_user_pass_2026@db:3306/simbima_db`).
* `JWT_SECRET`: Kunci rahasia untuk penandatanganan token JWT autentikasi.
* `PORT`: Port backend server (default: `5000`).
* `FRONTEND_URL`: URL aplikasi frontend (default: `http://app`).
* `VITE_API_URL`: Biarkan **kosong** (`""`) saat di MyPaas/Docker Compose agar frontend menggunakan routing relatif (`/api`) via reverse proxy Nginx.

---

## 🏗️ Arsitektur Layanan (Services Architecture)

Di dalam file `compose.yml`, terdapat 3 layanan utama yang saling terhubung:

1. **`db` (MySQL 8.0):**
   * Menggunakan image resmi `mysql:8.0`.
   * Dilengkapi dengan volume persisten `db_data` dan healthcheck cerdas (`start_period: 60s`, `retries: 10`) untuk mengakomodasi inisialisasi pertama kali (*first-time init*).
2. **`server` (Backend Express + Prisma):**
   * Dibuat dari [server/Dockerfile](file:///d:/Vs%20code/TA%20%28simbima%29/server/Dockerfile) menggunakan `node:20-alpine`.
   * Berjalan sebagai user non-root (`node`).
   * Secara otomatis menjalankan migrasi skema database (`npx prisma migrate deploy || npx prisma db push --accept-data-loss`) sebelum memulai server.
   * Menggunakan volume persisten `uploads_data` untuk menyimpan bukti foto/dokumen perizinan mahasiswa.
   * Menunggu layanan `db` sehat (`condition: service_healthy`) sebelum berjalan.
3. **`app` (Frontend SPA React/Vite + Nginx):**
   * Dibuat dari [client/Dockerfile](file:///d:/Vs%20code/TA%20%28simbima%29/client/Dockerfile) dengan *multi-stage build*.
   * Menggunakan image aman non-root `nginxinc/nginx-unprivileged:alpine` pada port `8080`.
   * Bertindak sebagai pintu gerbang (*gateway* / HTTP entrypoint) publik tunggal. Nginx menangani routing *Single Page Application* sekaligus memproses reverse proxy ke `http://server:5000` untuk endpoint `/api/`, `/socket.io/`, dan `/uploads/`.

---
*Dikembangkan untuk Tugas Akhir Universitas Andalas — 2026.*
