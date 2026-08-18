# ROLE-REALIGNMENT.md — SIMBIMA
# Penyesuaian Peran Ketua Pokja dan Fasilitator

Dokumen ini menjadi acuan prompt untuk perubahan pembagian tugas pada sistem SIMBIMA.
Fokus utama: memindahkan tugas operasional input mahasiswa dari Ketua Pokja ke Fasilitator per asrama/gedung.

***

## 1. Tujuan Perubahan

Penyesuaian dilakukan agar pembagian tugas lebih realistis secara organisasi:
- Ketua Pokja berperan sebagai pengawas, evaluator, dan pengelola monitoring global.
- Fasilitator berperan sebagai operator lapangan pada gedung/asrama masing-masing.
- Input data mahasiswa baru dan pembuatan akun tidak lagi menjadi tugas utama Ketua Pokja.

***

## 2. Pembagian Peran Baru

### 2.1 Ketua Pokja (`SUPERADMIN`)

#### Tugas utama
- Melihat dashboard global semua gedung.
- Melihat monitoring kegiatan semua fasilitator.
- Melihat rekap absensi semua gedung.
- Melihat seluruh data perizinan mahasiswa.
- Mengelola master data strategis:
  - Gedung
  - Tahun Akademik
  - Pengaturan sistem yang bersifat global
- Memberikan evaluasi atau arahan umum kepada fasilitator.

#### Bukan tugas utama Ketua Pokja
- Input mahasiswa baru satu per satu.
- Membuat akun mahasiswa.
- Menempatkan mahasiswa ke kamar secara operasional.
- Mengubah data mahasiswa harian.
- Membuat kegiatan harian.
- Memvalidasi izin mahasiswa.

***

### 2.2 Fasilitator (`FASILITATOR`)

#### Tugas utama
- Mengelola kegiatan pembinaan pada gedung yang menjadi tanggung jawabnya.
- Memvalidasi izin mahasiswa pada gedungnya.
- Mengelola rekap absensi gedungnya.
- Menginput mahasiswa baru untuk gedungnya.
- Membuat akun mahasiswa untuk gedungnya.
- Mengatur penempatan mahasiswa ke kamar pada gedungnya.
- Mengedit data mahasiswa pada gedungnya.
- Menonaktifkan mahasiswa lama pada gedungnya jika masa tinggal selesai.

#### Batasan akses
- Fasilitator hanya boleh mengelola mahasiswa yang berada pada gedung yang sama dengan gedung tugasnya.
- Fasilitator tidak boleh melihat atau mengubah data mahasiswa dari gedung lain.
- Fasilitator tidak boleh mengubah master data global.

***

## 3. Dampak ke Fitur Sistem

### 3.1 Ketua Pokja
Halaman yang tetap dimiliki:
- `/superadmin/dashboard`
- `/superadmin/master-data`
- `/superadmin/monitoring`
- `/superadmin/rekap`
- `/superadmin/perizinan`

Halaman yang sebaiknya dihapus/dikurangi dari Ketua Pokja:
- `/superadmin/akun` untuk CRUD mahasiswa
- Jika tetap ada, halaman ini hanya boleh untuk:
  - melihat data pengguna,
  - reset password,
  - koreksi tertentu,
  - bukan input operasional harian.

***

### 3.2 Fasilitator
Tambahkan/ubah fitur fasilitator:
- Halaman kelola mahasiswa gedungnya sendiri.
- Tambah mahasiswa baru.
- Edit mahasiswa.
- Nonaktifkan mahasiswa lama.
- Reset password mahasiswa jika diperlukan.

Contoh route yang dapat digunakan:
- `/fasilitator/mahasiswa`
- `/fasilitator/mahasiswa/tambah`
- `/fasilitator/mahasiswa/:id/edit`

***

## 4. Aturan Data Mahasiswa

### 4.1 Tidak ada registrasi mandiri
Mahasiswa tidak mendaftar sendiri.
Akun dibuat oleh fasilitator gedung/asrama masing-masing.

### 4.2 Siklus akun mahasiswa
- Mahasiswa baru ditambahkan ke tahun akademik aktif.
- Mahasiswa lama tidak dihapus dari database.
- Mahasiswa lama diubah statusnya menjadi nonaktif setelah masa tinggal selesai.
- Histori data tetap tersimpan untuk kebutuhan rekap dan pelacakan.

### 4.3 Password awal
- Akun mahasiswa dibuat dengan password awal/default.
- Saat login pertama, mahasiswa wajib mengganti password.
- Gunakan field seperti:
  - `mustChangePassword: Boolean @default(true)`
  - atau `isFirstLogin: Boolean @default(true)`

### 4.4 Pencegahan duplikasi
- NIM harus unik.
- Saat input mahasiswa baru, sistem wajib cek NIM terlebih dahulu.
- Jika NIM sudah ada, sistem menolak input duplikat.

***

## 5. Perubahan RBAC yang Disarankan

### 5.1 Ketua Pokja (`SUPERADMIN`)
Akses:
- read global dashboard
- read monitoring global
- read rekap global
- read perizinan global
- CRUD master data global
- optional limited user management

### 5.2 Fasilitator (`FASILITATOR`)
Akses:
- CRUD kegiatan pada gedungnya
- CRUD mahasiswa pada gedungnya
- validasi izin pada gedungnya
- generate rekap pada gedungnya
- lihat data mahasiswa pada gedungnya

### 5.3 Scope data fasilitator
Semua query mahasiswa oleh fasilitator harus difilter dengan `gedungId` sesuai gedung tugas fasilitator.

Contoh konsep:
- fasilitator gedung A → hanya akses mahasiswa gedung A
- fasilitator gedung B → hanya akses mahasiswa gedung B

***

## 6. Perubahan Backend yang Diarahkan

### Endpoint yang perlu ada untuk fasilitator
- `GET /api/fasilitator/mahasiswa`
- `POST /api/fasilitator/mahasiswa`
- `PUT /api/fasilitator/mahasiswa/:id`
- `PATCH /api/fasilitator/mahasiswa/:id/nonaktif`
- `PATCH /api/fasilitator/mahasiswa/:id/reset-password`

### Aturan backend
- Semua endpoint di atas hanya untuk role `FASILITATOR`.
- Backend wajib validasi bahwa mahasiswa yang diakses berada di gedung fasilitator.
- Saat create mahasiswa:
  - set `gedungId` otomatis dari fasilitator atau validasi agar hanya boleh memilih gedung sendiri.
  - set `mustChangePassword = true`.
  - set `statusAsrama = AKTIF`.
  - set `tahunAkademikId` ke tahun akademik aktif.

***

## 7. Perubahan Frontend yang Diarahkan

### Fasilitator
Tambahkan halaman kelola mahasiswa:
- tabel daftar mahasiswa gedungnya
- search by nama/NIM
- filter by status asrama
- tombol tambah mahasiswa
- tombol edit
- tombol nonaktifkan
- tombol reset password

Field form mahasiswa:
- NIM
- Nama
- Password awal
- Gedung (readonly / otomatis sesuai fasilitator)
- Lantai
- Nomor kamar

### Ketua Pokja
Jika halaman `/superadmin/akun` tetap dipertahankan, ubah tujuannya menjadi:
- monitoring data user,
- koreksi jika diperlukan,
- bukan operator utama input mahasiswa.

***

## 8. Narasi untuk Skripsi / Sidang

Jika ditanya mengapa mahasiswa tidak dikelola langsung oleh Ketua Pokja:

> Secara organisasi, Ketua Pokja berperan sebagai pengawas dan evaluator pembinaan asrama, sedangkan fasilitator merupakan pelaksana operasional pada masing-masing gedung. Oleh karena itu, input data mahasiswa baru dan pembuatan akun lebih tepat dilakukan oleh fasilitator agar sesuai dengan pembagian tugas yang realistis dan prinsip role-based access control.

***

## 9. Instruksi untuk AI Agent

Gunakan dokumen ini sebagai acuan ketika diminta:
- memindahkan CRUD mahasiswa dari Ketua Pokja ke Fasilitator,
- menambahkan fitur akun mahasiswa berbasis gedung,
- menerapkan first login wajib ganti password,
- menerapkan status mahasiswa aktif/nonaktif per tahun akademik.