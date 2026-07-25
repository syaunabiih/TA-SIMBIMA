# Acuan Context Diagram & DFD — Sistem SIMBIMA
> **SIMBIMA** = Sistem Informasi Manajemen Bimbingan Asrama  
> Stack: React (Vite) + Node.js/Express + MySQL (Prisma ORM)

---

## 1. Identifikasi Entitas Eksternal

Entitas eksternal adalah pihak yang berinteraksi dengan sistem dari luar, tidak termasuk bagian dalam sistem.

| ID | Entitas Eksternal | Peran |
|----|-------------------|-------|
| E1 | **Mahasiswa** | Penghuni asrama yang menggunakan sistem |
| E2 | **Fasilitator** | Pembina/pengelola asrama per gedung |
| E3 | **Ketua Pokja (Superadmin)** | Administrator pusat seluruh sistem |
| E4 | **Sistem Cron (Scheduler)** | Proses otomatis berbasis waktu (internal timer, diperlakukan sebagai entitas pemicu) |
| E5 | **Web Push Notification Service** | Layanan eksternal untuk mengirim notifikasi push ke browser |

---

## 2. Context Diagram (Level 0 / DFD Level 0)

Context Diagram menampilkan sistem sebagai satu proses tunggal (*"black box"*) dengan seluruh aliran data masuk dan keluar.

```
                         ┌─────────────────────────────────────┐
                         │                                     │
  [E1 Mahasiswa] ──────► │                                     │ ──────► [E1 Mahasiswa]
  - Data login           │                                     │   - Token JWT
  - Data pengajuan izin  │                                     │   - Status izin
  - Foto bukti           │                                     │   - Notifikasi
  - Scan QR Absensi      │                                     │   - Rekap kehadiran
  - Data konfirmasi      │                                     │   - Info kegiatan
    kepulangan           │                                     │   - Dashboard stat
                         │                                     │
  [E2 Fasilitator] ────► │     SISTEM SIMBIMA                  │ ──────► [E2 Fasilitator]
  - Data login           │   (Sistem Informasi Manajemen       │   - Token JWT
  - Keputusan validasi   │    Bimbingan Asrama)                │   - Daftar izin & status
  - Data kegiatan baru   │                                     │   - Daftar mahasiswa
  - Penugasan petugas    │                                     │   - Rekap absensi
  - Input absensi manual │                                     │   - Notifikasi
  - Konfirmasi kembali   │                                     │   - Laporan & export
  - Data mahasiswa baru  │                                     │   - Dashboard stat
  - Import mahasiswa     │                                     │
                         │                                     │
  [E3 Superadmin] ─────► │                                     │ ──────► [E3 Superadmin]
  - Data login           │                                     │   - Token JWT
  - Data master (gedung, │                                     │   - Data monitoring
    fasilitator,         │                                     │     seluruh gedung
    tahun akademik,      │                                     │   - Laporan ekspor
    fakultas, jurusan,   │                                     │   - Data statistik
    jenis kegiatan)      │                                     │   - Semua rekap
                         │                                     │
  [E4 Cron Scheduler] ─► │                                     │ ──────► [E4 Cron Scheduler]
  - Trigger waktu        │                                     │   - (hasil proses otomatis
    (setiap menit,       │                                     │     tersimpan ke DB)
    setiap jam 08.00)    │                                     │
                         │                                     │
                         └─────────────────────────────────────┘
                                          │
                                          │ Push Notification Request
                                          ▼
                              [E5 Web Push Service]
                                          │
                                          │ Notifikasi Push
                                          ▼
                          (ke browser Mahasiswa / Fasilitator)
```

---

## 3. Aliran Data Utama (Ringkasan per Entitas)

### 3.1 Aliran dari/ke Mahasiswa (E1)

| Arah | Data |
|------|------|
| **Masuk** (input ke sistem) | Kredensial login (NIM/email + password), Data pengajuan izin (jenis, tanggal, alasan, dokumen), Foto bukti berangkat, Foto bukti kepulangan, Scan QR absensi, Konfirmasi kepulangan (tiba di tujuan / kembali asrama), Data ganti password |
| **Keluar** (output dari sistem) | JWT Token (sesi), Status pengajuan izin, Detail izin, Notifikasi in-app, Push notification, Rekap kehadiran per periode, Info daftar kegiatan, Status kehadiran per kegiatan, Dashboard statistik (kehadiran %, alfa, izin) |

### 3.2 Aliran dari/ke Fasilitator (E2)

| Arah | Data |
|------|------|
| **Masuk** | Kredensial login, Keputusan validasi izin (setuju/tolak + catatan), Data kegiatan baru (nama, tanggal, waktu, lokasi, jenis), Penugasan petugas absensi, Input absensi manual, Konfirmasi mahasiswa kembali asrama, Data tambah/edit/nonaktif mahasiswa, Import data mahasiswa (bulk), Data ganti password |
| **Keluar** | JWT Token, Daftar & status pengajuan izin gedungnya, Daftar mahasiswa gedungnya, Data monitoring kepulangan (foto bukti), Rekap absensi (generate & publikasi), Detail kegiatan & kehadiran per blok, Notifikasi (izin masuk, mahasiswa terlambat, konfirmasi kepulangan), Push notification, Export laporan Excel, Dashboard fasilitator (tren, stat, perlu perhatian) |

### 3.3 Aliran dari/ke Superadmin/Ketua Pokja (E3)

| Arah | Data |
|------|------|
| **Masuk** | Kredensial login, Data master (CRUD Gedung, Fasilitator, Tahun Akademik, Fakultas, Jurusan, Jenis Kegiatan), Request laporan ekspor |
| **Keluar** | JWT Token, Data statistik seluruh gedung, Data perizinan semua gedung (read-only), Data rekap semua gedung, Monitoring kehadiran per gedung, Export laporan PDF/Excel, Dashboard superadmin |

### 3.4 Aliran dari/ke Cron Scheduler (E4)

| Arah | Data |
|------|------|
| **Masuk** | Trigger waktu setiap menit dan jam 08:00 setiap hari |
| **Keluar** (ke DB) | Update status kegiatan → SELESAI (auto), Rekaman ALPHA otomatis (mahasiswa yang tidak absen), Update status petugas → TIDAK_MENGERJAKAN, Pemicu kirim push notifikasi untuk mahasiswa terlambat izin |

---

## 4. Proses-Proses Utama Sistem (untuk DFD Level 1)

Dalam DFD Level 1, sistem SIMBIMA dipecah menjadi **7 proses utama**:

| No | Nama Proses | Kode Proses |
|----|-------------|-------------|
| 1 | Manajemen Autentikasi | P1 |
| 2 | Manajemen Perizinan | P2 |
| 3 | Manajemen Kegiatan & Kehadiran | P3 |
| 4 | Manajemen Rekap Absensi | P4 |
| 5 | Manajemen Notifikasi & Push | P5 |
| 6 | Monitoring & Dashboard | P6 |
| 7 | Manajemen Data Master (Admin) | P7 |

---

## 5. Data Store (Penyimpanan Data)

Berdasarkan schema database Prisma:

| ID | Nama Data Store | Tabel di DB |
|----|-----------------|-------------|
| D1 | Data Mahasiswa | `mahasiswa` |
| D2 | Data Fasilitator | `fasilitator_asrama` |
| D3 | Data Ketua Pokja | `ketua_pokja_asrama` |
| D4 | Data Gedung | `gedung` |
| D5 | Data Kegiatan Pembinaan | `kegiatan_pembinaan` |
| D6 | Data Kehadiran | `kehadiran` |
| D7 | Data Petugas Absensi | `petugas_absensi` |
| D8 | Data Perizinan | `perizinan` |
| D9 | Data Konfirmasi Perizinan | `konfirmasi_perizinan` |
| D10 | Data Rekap Absensi | `rekap_absensi` |
| D11 | Data Notifikasi | `notifikasi` |
| D12 | Data Push Subscription | `push_subscription` |
| D13 | Data Tahun Akademik | `tahun_akademik` |
| D14 | Data Fakultas | `fakultas` |
| D15 | Data Jurusan | `jurusan` |
| D16 | Data Jenis Kegiatan | `jenis_kegiatan` |
| D17 | Token Reset Password | `reset_token` |

---

## 6. DFD Level 1 — Rincian per Proses

### P1 — Manajemen Autentikasi

```
Mahasiswa ─── [login/NIM+password] ───► P1.1 Verifikasi ──► D1 (Mahasiswa)
Fasilitator ─ [login/NIP+password] ───► P1.1 Identitas  ──► D2 (Fasilitator)
Superadmin ── [login/NIP+password] ───► P1.1 dan Role   ──► D3 (Ketua Pokja)
                                            │
                                            ▼ JWT Token
                                    (dikembalikan ke user)

Mahasiswa ─── [data baru password] ──► P1.2 Ganti Password ──► D1
Mahasiswa ─── [email+token] ─────────► P1.3 Reset Password ──► D17 (Reset Token)
```

**Proses detail:**
- `P1.1` Verifikasi Login → cek user di D1/D2/D3, bandingkan password (bcrypt), hasilkan JWT 24 jam
- `P1.2` Ganti Password (dari profil) → validasi password lama, simpan hash baru
- `P1.3` Reset Password (lupa password) → buat token ke D17, proses token → update password

---

### P2 — Manajemen Perizinan

```
Mahasiswa ────[data izin + dokumen]────► P2.1 Ajukan Izin ────► D8 (Perizinan)
                                              │                       │
                                              ▼                       │
                                        P5 (Notifikasi ke Fasilitator)│
                                                                       │
Fasilitator ──[keputusan validasi]────► P2.2 Validasi Izin ──────────┘──► D8
                                              │
                                              ▼ (jika DISETUJUI & PULANG_KAMPUNG)
                                        Potong kuota D1.kuota_izin_pulang
                                              │
                                              ▼
                                        P5 (Notifikasi ke Mahasiswa)

Mahasiswa ────[foto berangkat]─────────► P2.3 Upload Foto Bukti ──► D8
Mahasiswa ────[foto kepulangan]────────► P2.3                   ──► D8
                                              │ (jika kedua foto ada)
                                              ▼
                                        Update status → SELESAI

Mahasiswa ────[konfirmasi lokasi]──────► P2.4 Konfirmasi Perjalanan ──► D9 (KonfirmasiPerizinan)

Fasilitator ──[konfirmasi manual]──────► P2.5 Konfirmasi Kembali ──► D8.returned_at

E4 Cron ──────[trigger H+1]────────────► P2.6 Auto-Reject Izin ──► D8 (DITOLAK otomatis)
```

---

### P3 — Manajemen Kegiatan & Kehadiran

```
Fasilitator ──[data kegiatan]──────────► P3.1 Buat Kegiatan ──────► D5 (KegiatanPembinaan)
                                              │
                                              ▼
                                        Generate QR Token

Fasilitator ──[pilih mahasiswa]────────► P3.2 Penugasan Petugas ──► D7 (PetugasAbsensi)

Mahasiswa ────[scan QR]────────────────► P3.3 Absensi via QR ──────► D6 (Kehadiran)
Mahasiswa ────[form absensi petugas]───► P3.4 Input Absensi Manual ► D6

Fasilitator ──[edit kehadiran]─────────► P3.5 Edit Kehadiran ──────► D6

E4 Cron ──────[trigger tiap menit]─────► P3.6 Auto Close Kegiatan:
                                              │ - Cek waktu selesai / QR expire
                                              │ - Buat ALPHA untuk yang belum absen
                                              │ - Update status D5 → SELESAI
                                              │ - Update D7 → TIDAK_MENGERJAKAN
                                              └──────────────────────► D5, D6, D7
```

---

### P4 — Manajemen Rekap Absensi

```
Fasilitator ──[pilih periode]──────────► P4.1 Generate Rekap:
                                              │ - Hitung hadir/alpha/izin
                                              │ - Hitung % kehadiran
                                              │ - Tentukan reward/iqab
                                              └──────────────────────► D10 (RekapAbsensi)

Fasilitator ──[publikasi rekap]────────► P4.2 Publikasi Rekap ──────► D10.status_publikasi = PUBLISHED
                                              │
                                              ▼
                                        P5 (Notifikasi ke Mahasiswa bersangkutan)

Mahasiswa ────[request lihat rekap]────► P4.3 Lihat Rekap ──────────◄── D10 (filter PUBLISHED)
Fasilitator ──[request export]─────────► P4.4 Export Excel ──────────◄── D10 + D6
Superadmin ───[request export]─────────► P4.5 Export Laporan ─────────◄── D10 + D8 + D6
```

---

### P5 — Manajemen Notifikasi & Push

```
P2/P3/P4 ─────[event sistem]──────────► P5.1 Buat Notifikasi In-App ──► D11 (Notifikasi)

User ──────────[buka app]──────────────► P5.2 Baca Notifikasi ──────────◄── D11
                                              │ update status_baca = true

User ──────────[subscribe push]────────► P5.3 Simpan Subscription ──────► D12 (PushSubscription)

P2/P3/Cron ───[event penting]──────────► P5.4 Kirim Push Notification:
                                              │ - Ambil endpoint dari D12
                                              │ - Kirim via Web Push API
                                              └──────────────────────► [E5 Web Push Service]
                                                                             │
                                                                             ▼
                                                                    Browser User
```

---

### P6 — Monitoring & Dashboard

```
Fasilitator ──[request dashboard]──────► P6.1 Dashboard Fasilitator:
                                              │ - Baca D5, D6, D8, D10
                                              │ - Hitung stat, tren, top mahasiswa
                                              └──────────────────────► Data dashboard

Mahasiswa ────[request dashboard]──────► P6.2 Dashboard Mahasiswa:
                                              │ - Baca D5, D6, D8, D10
                                              │ - Stat kehadiran & izin aktif
                                              └──────────────────────► Data dashboard

Superadmin ───[request monitoring]─────► P6.3 Dashboard Superadmin:
                                              │ - Baca D1-D10 (semua gedung)
                                              │ - Kehadiran per gedung
                                              └──────────────────────► Data monitoring

Fasilitator ──[request perlu perhatian]► P6.4 Mahasiswa Perlu Perhatian:
                                              │ - Cari alfa 3x berturut (D6)
                                              │ - Cari izin terlambat (D8)
                                              └──────────────────────► Daftar mahasiswa

E4 Cron ──────[trigger jam 08:00]──────► P6.5 Alert Terlambat Izin:
                                              │ - Cari D8 melewati tanggal selesai
                                              │ - Kirim push ke Fasilitator (P5.4)
```

---

### P7 — Manajemen Data Master

```
Superadmin ───[data gedung]────────────► P7.1 CRUD Gedung ──────────► D4 (Gedung)
Superadmin ───[data fasilitator]───────► P7.2 CRUD Fasilitator ──────► D2 (Fasilitator)
Superadmin ───[data tahun akademik]────► P7.3 CRUD Tahun Akademik ───► D13 (TahunAkademik)
Superadmin ───[data fakultas]──────────► P7.4 CRUD Fakultas ─────────► D14 (Fakultas)
Superadmin ───[data jurusan]───────────► P7.5 CRUD Jurusan ──────────► D15 (Jurusan)
Superadmin ───[data jenis kegiatan]────► P7.6 CRUD Jenis Kegiatan ───► D16 (JenisKegiatan)

Fasilitator ──[data mahasiswa]─────────► P7.7 Kelola Mahasiswa:
                                              │ - Tambah, edit, nonaktif/aktif
                                              │ - Import bulk (CSV/Excel)
                                              │ - Reset password mahasiswa
                                              └──────────────────────► D1 (Mahasiswa)
```

---

## 7. Rangkuman Aliran Data untuk Context Diagram (Untuk Digambar)

Berikut adalah poin-poin yang perlu digambar pada **Context Diagram**:

### Dari Mahasiswa → Sistem
- Data Autentikasi (NIM/Email + Password)
- Data Pengajuan Izin (jenis, tanggal, alasan, dokumen)
- Foto Bukti Perjalanan (berangkat & pulang)
- Konfirmasi Kepulangan (tiba / kembali)
- Kode QR Scan Absensi
- Request Ganti / Reset Password

### Dari Sistem → Mahasiswa
- Token Akses (JWT)
- Status & Detail Perizinan
- Notifikasi In-App
- Push Notification
- Rekap Kehadiran & Statistik
- Info Kegiatan & Status Kehadiran
- Data Dashboard

### Dari Fasilitator → Sistem
- Data Autentikasi (NIP/Email + Password)
- Keputusan Validasi Izin (ACC/Tolak + Catatan)
- Data Kegiatan Baru (nama, waktu, lokasi, jenis)
- Penugasan Petugas Absensi
- Input/Edit Absensi Manual
- Konfirmasi Mahasiswa Kembali Asrama
- Data Tambah/Edit/Nonaktif Mahasiswa
- File Import Mahasiswa

### Dari Sistem → Fasilitator
- Token Akses (JWT)
- Daftar Pengajuan Izin (gedung)
- Data Monitoring Kepulangan
- Rekap Absensi (Generate, Publikasi, Export)
- Notifikasi In-App
- Push Notification (izin baru, terlambat, foto bukti)
- Data Kehadiran per Blok
- QR Code Absensi
- Data Dashboard

### Dari Superadmin → Sistem
- Data Autentikasi (NIP/Email + Password)
- Data Master (Gedung, Fasilitator, Tahun Akademik, Fakultas, Jurusan, Jenis Kegiatan)
- Request Laporan

### Dari Sistem → Superadmin
- Token Akses (JWT)
- Data Statistik Semua Gedung
- Data Perizinan Semua Gedung
- Data Rekap Semua Gedung
- Laporan Ekspor (Excel/PDF)
- Data Dashboard Superadmin

### Dari Cron Scheduler → Sistem
- Trigger Periodik (tiap menit, jam 08.00)

### Dari Sistem → Web Push Service → User
- Request Push Notifikasi (payload: judul, isi, URL)
- Push Notification Browser (ke Mahasiswa / Fasilitator)

---

## 8. Catatan Penting untuk Gambar DFD

> [!IMPORTANT]
> - **Context Diagram (Level 0)**: Sistem = 1 kotak/oval, semua entitas di luar, hanya gambarkan aliran data utama (bukan detail teknis seperti JWT).
> - **DFD Level 1**: Pecah sistem menjadi 7 proses (P1–P7), tampilkan data store sebagai garis ganda, entitas tetap sama.
> - **Notasi**: Gunakan notasi **Yourdon-DeMarco** (lingkaran/oval untuk proses, kotak untuk entitas eksternal, garis ganda untuk data store, panah berlabel untuk aliran data).
> - **Cron Scheduler** bisa digambarkan sebagai entitas eksternal atau sebagai proses otomatis internal — tergantung konvensi yang digunakan dosen/pembimbing.
> - **Tidak perlu mencantumkan detail teknis** (nama tabel DB, nama fungsi, nama file) pada DFD — cukup nama data yang mengalir.
