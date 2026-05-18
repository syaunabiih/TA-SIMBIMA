# SUPERADMIN-SPEC.md — SIMBIMA
# Spesifikasi Role Ketua Pokja (SUPERADMIN)

> File ini adalah referensi khusus untuk semua task yang berkaitan
> dengan role SUPERADMIN (Ketua Pokja) di sistem SIMBIMA.
> Untuk konteks sistem secara keseluruhan, baca SPEC.md.

***

## 1. Identitas Role

| Atribut        | Nilai                        |
|----------------|------------------------------|
| Role di kode   | `SUPERADMIN`                 |
| Nama di sistem | Ketua Pokja                  |
| Username login | NIM                          |
| Base route     | `/superadmin/*`              |
| Akses data     | Semua blok/gedung (global)   |

***

## 2. Hak Akses

### ✅ Bisa
- Lihat dashboard statistik agregat semua blok
- Kelola master data: Gedung, Tahun Akademik, Jenis Kegiatan (CRUD)
- Kelola akun Fasilitator & Mahasiswa (CRUD)
- Monitor semua kegiatan semua fasilitator (read-only)
- Lihat rekap absensi semua blok + export Excel
- Lihat perizinan semua mahasiswa (read-only)

### ❌ Tidak Bisa
- Buat kegiatan (hanya Fasilitator)
- Validasi/setujui/tolak perizinan (hanya Fasilitator)
- Input absensi (hanya Petugas Absensi)

***

## 3. Halaman & Route

| Halaman           | Route                          | Deskripsi                                    |
|-------------------|--------------------------------|----------------------------------------------|
| Dashboard         | `/superadmin/dashboard`        | Stat cards + tabel top 5 alpha + fasilitator |
| Master Data       | `/superadmin/master-data`      | Tab: Card Gedung, Tabel Gedung, Tahun Akademik, Jenis Kegiatan |
| Kelola Akun       | `/superadmin/akun`             | Tab: Fasilitator, Mahasiswa                  |
| Monitoring        | `/superadmin/monitoring`       | Semua kegiatan semua fasilitator (read-only) |
| Rekap Absensi     | `/superadmin/rekap`            | Rekap semua blok + export Excel              |
| Perizinan         | `/superadmin/perizinan`        | Semua izin semua mahasiswa (read-only)       |

***

## 4. Rincian Halaman

### 4.1 Dashboard (`/superadmin/dashboard`)
**Stat Cards** — fetch dari `GET /api/admin/dashboard-stats`:
- Total Mahasiswa
- Total Fasilitator
- Rata-rata Kehadiran (semua blok, %)
- Total Kegiatan Bulan Ini

**Panel Bawah (2 tabel sejajar):**
- Tabel kiri: Top 5 Mahasiswa Alpha Terbanyak (Nama | Gedung | Jumlah Alpha)
- Tabel kanan: Daftar Fasilitator & Blok Tugasnya (Nama | NIM | Gedung)

***

### 4.2 Master Data (`/superadmin/master-data`)
Layout: **Tab 4 panel**, summary stat di atas sebelum tab.

**Tab 1 — Card Gedung (tampilan visual)**
- Card per gedung: Nama, Kode, Jumlah Mahasiswa, Fasilitator, Kapasitas, Lantai
- Badge status: Aktif (hijau) / Nonaktif (merah)
- Tombol edit (ikon pensil) di pojok kanan atas tiap card

**Tab 2 — Tabel Gedung (CRUD)**
- Kolom: Nama | Kode | Status | Mhs | Fasilitator | Kapasitas | Aksi
- Tombol "+ Tambah Gedung"
- Modal form: Nama, Kode (unik), Status, Kapasitas, Jumlah Lantai
- Validasi hapus: tidak bisa hapus jika ada mahasiswa/fasilitator aktif

**Tab 3 — Tahun Akademik**
- Kolom: Nama | Semester | Status | Aksi (Set Aktif / Edit / Hapus)
- Tombol "+ Tambah Tahun Akademik"
- Modal form: Tahun (misal: 2024/2025), Semester (dropdown: Ganjil/Genap)
- Hanya 1 yang bisa aktif sekaligus → badge hijau untuk yang aktif
- Tidak bisa hapus jika sedang aktif

**Tab 4 — Jenis Kegiatan**
- Kolom: Nama | Deskripsi | Status | Aksi (Edit / Hapus)
- Tombol "+ Tambah Jenis Kegiatan"
- Modal form: Nama, Deskripsi (opsional), Status (Aktif/Nonaktif)
- Tidak bisa hapus jika sudah dipakai di kegiatan manapun
- Default seed: Shalat Subuh Berjamaah, Absensi Malam,
  Kegiatan Pembinaan, Kegiatan Kebersamaan, Kegiatan AMA

***

### 4.3 Kelola Akun (`/superadmin/akun`)
Layout: **Tab 2 panel**

**Tab 1 — Fasilitator**
- Kolom: NIM | Nama | Gedung (Blok Tugas) | Aksi (Edit / Hapus)
- Tombol "+ Tambah Fasilitator"
- Modal form: NIM, Nama, Password, dropdown Gedung
- Search/filter by nama atau NIM

**Tab 2 — Mahasiswa**
- Kolom: NIM | Nama | Kamar | Aksi (Edit / Hapus)
- Kamar ditampilkan sebagai: "Nama Gedung - Lt X - Kamar Y"
- Tombol "+ Tambah Mahasiswa"
- Modal form:
  - NIM (wajib, unik)
  - Nama (wajib)
  - Password (wajib)
  - Gedung → dropdown dari `GET /api/admin/gedung`
  - Lantai → input angka manual (Int)
  - Nomor Kamar → input teks bebas (String, format bebas per gedung)
- Search/filter by nama atau NIM

> **Catatan format kamar:** Tiap gedung memiliki format nomor kamar
> yang berbeda-beda sehingga tidak bisa pakai dropdown master kamar.
> Gunakan kombinasi: dropdown Gedung (relasi) + input manual Lantai & Nomor Kamar.

***

### 4.4 Monitoring Kegiatan (`/superadmin/monitoring`)
- Read-only, tidak ada tombol edit/hapus
- Kolom: Nama Kegiatan | Fasilitator | Gedung | Tanggal | Total Hadir | Total Alpha | Status
- Filter: by Fasilitator, by Bulan, by Jenis Kegiatan
- Fetch dari `GET /api/admin/monitoring/kegiatan`

***

### 4.5 Rekap Absensi (`/superadmin/rekap`)
- Filter: by Fasilitator/Gedung, by Bulan, by Tahun Akademik
- Kolom: Nama | NIM | Kamar | Total Hadir | Total Alpha | Total Izin | % Kehadiran
- Tombol **Export Excel** (trigger download file .xlsx)
- Fetch dari `GET /api/rekap/fasilitator` & `GET /api/rekap/fasilitator/:bulan`

***

### 4.6 Perizinan (`/superadmin/perizinan`)
- Read-only, tidak ada tombol validasi
- Kolom: Nama | Kamar | Jenis Izin | Tanggal | Status | Fasilitator Validator
- Filter: by Status (pending/disetujui/ditolak), by Bulan, by Fasilitator
- Fetch dari `GET /api/izin`

***

## 5. Endpoint API (Superadmin)

### Dashboard
| Method | Endpoint                       | Keterangan                         |
|--------|--------------------------------|------------------------------------|
| GET    | /api/admin/dashboard-stats     | Stat cards + top 5 mahasiswa alpha |

### Master Data — Gedung
| Method | Endpoint                  | Keterangan                          |
|--------|---------------------------|-------------------------------------|
| GET    | /api/admin/gedung         | List semua gedung                   |
| POST   | /api/admin/gedung         | Tambah gedung baru                  |
| PUT    | /api/admin/gedung/:id     | Edit gedung                         |
| DELETE | /api/admin/gedung/:id     | Hapus (cek mahasiswa/fasilitator)   |

### Master Data — Tahun Akademik
| Method | Endpoint                               | Keterangan                    |
|--------|----------------------------------------|-------------------------------|
| GET    | /api/admin/tahun-akademik              | List semua                    |
| POST   | /api/admin/tahun-akademik              | Tambah                        |
| PUT    | /api/admin/tahun-akademik/:id          | Edit                          |
| DELETE | /api/admin/tahun-akademik/:id          | Hapus (cek isAktif)           |
| PATCH  | /api/admin/tahun-akademik/:id/aktif    | Set aktif (nonaktifkan semua) |

### Master Data — Jenis Kegiatan
| Method | Endpoint                        | Keterangan                       |
|--------|---------------------------------|----------------------------------|
| GET    | /api/admin/jenis-kegiatan       | List (bisa diakses FASILITATOR)  |
| POST   | /api/admin/jenis-kegiatan       | Tambah                           |
| PUT    | /api/admin/jenis-kegiatan/:id   | Edit                             |
| DELETE | /api/admin/jenis-kegiatan/:id   | Hapus (cek pemakaian kegiatan)   |

### Kelola Akun
| Method | Endpoint                       | Keterangan                     |
|--------|--------------------------------|--------------------------------|
| GET    | /api/admin/fasilitator         | List semua fasilitator         |
| POST   | /api/admin/fasilitator         | Tambah fasilitator             |
| PUT    | /api/admin/fasilitator/:id     | Edit fasilitator               |
| DELETE | /api/admin/fasilitator/:id     | Hapus fasilitator              |
| GET    | /api/admin/mahasiswa           | List semua mahasiswa           |
| POST   | /api/admin/mahasiswa           | Tambah mahasiswa               |
| PUT    | /api/admin/mahasiswa/:id       | Edit mahasiswa                 |
| DELETE | /api/admin/mahasiswa/:id       | Hapus mahasiswa                |

### Monitoring & Rekap
| Method | Endpoint                          | Keterangan                          |
|--------|-----------------------------------|-------------------------------------|
| GET    | /api/admin/monitoring/kegiatan    | Semua kegiatan + agregat absensi    |
| GET    | /api/rekap/fasilitator            | List periode rekap                  |
| GET    | /api/rekap/fasilitator/:bulan     | Detail rekap bulan tertentu         |
| GET    | /api/izin                         | Semua perizinan semua mahasiswa     |

***

## 6. Business Rules Superadmin

1. **Proteksi hapus Gedung:** Cek `_count.mahasiswas > 0` atau
   `_count.fasilitators > 0` → tolak dengan HTTP 409 + pesan jelas.

2. **Tahun Akademik aktif:** Hanya 1 boleh `isAktif = true`.
   Saat PATCH aktif → set semua `isAktif = false` dulu, baru set target = true.
   Tidak bisa hapus jika `isAktif = true`.

3. **Proteksi hapus Jenis Kegiatan:** Cek apakah ada `kegiatan` yang
   menggunakan `jenisKegiatanId` tersebut → tolak dengan HTTP 409.

4. **NIM unik:** Saat tambah Fasilitator/Mahasiswa, NIM tidak boleh duplikat.

5. **Format kamar:** Simpan sebagai 3 field terpisah:
   `gedungId` (Int, FK), `lantai` (Int), `noKamar` (String).
   Tampilkan di UI sebagai: "Nama Gedung - Lt X - Kamar Y".

***

## 7. Catatan untuk AI Agent

- Middleware semua `/api/admin/*`: `requireRole('SUPERADMIN')`
- Exception: `GET /api/admin/jenis-kegiatan` → `requireRole(['SUPERADMIN', 'FASILITATOR'])`
- Semua halaman superadmin dibungkus `SuperadminRoute.jsx` (redirect ke /login jika bukan SUPERADMIN)
- Gunakan komponen modal, tabel, badge yang sudah ada di proyek
- Read-only pages: tidak ada tombol edit/hapus/validasi 