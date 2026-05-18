# SPEC.md — SIMBIMA
# Sistem Informasi Monitoring Pembinaan Karakter Mahasiswa
# Asrama Universitas Andalas

**Konteks:** Sistem informasi berbasis web untuk memonitoring kegiatan
pembinaan karakter, absensi, dan perizinan mahasiswa baru di Asrama
Universitas Andalas. Menggantikan proses manual (kertas/spreadsheet)
menjadi sistem digital terintegrasi.

***

## 1. Tech Stack & Architecture

- **Architecture:** 3-Tier (Client → Application → Data)
- **Frontend:** Web Browser, Responsive (Laptop & Smartphone)
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **ORM:** Prisma ORM
- **Language:** JavaScript (fullstack)
- **Testing:** Black Box Testing

***

## 2. Akses & Peran Pengguna (RBAC)

### A. Ketua Pokja Asrama
- Lihat dashboard statistik (grafik kehadiran & perizinan)
- Input catatan evaluasi/tindak lanjut ke Fasilitator

### B. Fasilitator Asrama
- CRUD jadwal kegiatan pembinaan
- Tunjuk mahasiswa sebagai Petugas Absensi per kegiatan
- Validasi (setujui/tolak) pengajuan izin mahasiswa
- Generate & publikasi rekap absensi bulanan
- Terima notifikasi: kepulangan mahasiswa, foto bukti, evaluasi Pokja
- Lihat foto bukti tiba di tujuan/sudah kembali ke asrama mahasiswa

### C. Mahasiswa Asrama
- Lihat histori kehadiran & status reward/punishment
- Ajukan izin keluar asrama (Pulang Kampung atau Kegiatan) + upload dokumen
- Lihat status perizinan (Menunggu / Disetujui / Ditolak)
- Konfirmasi tiba di tujuan (upload foto)
- Konfirmasi kembali ke asrama (upload foto)
- Terima notifikasi status izin & rekap absensi

### D. Petugas Absensi (sub-peran dinamis Mahasiswa)
- Ditunjuk Fasilitator per jadwal kegiatan
- Input kehadiran mahasiswa lain (Hadir/Sakit/Izin/Alpa)
- Form absensi HANYA bisa diakses oleh petugas yang ditunjuk
  pada jadwal kegiatan yang bersangkutan

***

## 3. Alur Proses Utama (Core Workflows)

### Alur 1 — Absensi
1. Fasilitator buat jadwal kegiatan & tunjuk Petugas Absensi
2. Petugas login → akses form absensi kegiatan tersebut
3. Petugas input status tiap mahasiswa (Hadir/Sakit/Izin/Alpa)
4. Semua mahasiswa wajib diisi sebelum form bisa di-submit
5. Akhir bulan: Fasilitator klik Generate Rekap untuk mendownload file rekap→ sistem hitung
   persentase kehadiran + tentukan reward/punishment otomatis
6. Fasilitator validasi & publikasi rekap
7. Sistem kirim notifikasi ke seluruh mahasiswa

### Alur 2 — Perizinan
1. Mahasiswa ajukan izin (pilih jenis: Pulkam / Kegiatan)
2. Izin Kegiatan: WAJIB upload dokumen pendukung (surat/bukti)
3. Izin Pulkam: sistem cek kuota → jika habis, otomatis tolak dengan
   pesan "Kuota izin pulang kampung Anda sudah habis"
4. Sistem kirim notifikasi ke Fasilitator
5. Fasilitator review → Setujui atau Tolak (dengan alasan)
6. Sistem kirim notifikasi hasil ke Mahasiswa
7. Jika disetujui: mahasiswa berangkat
8. Mahasiswa upload foto bukti tiba di tujuan → notif ke Fasilitator
9. Mahasiswa upload foto bukti kembali ke asrama → notif ke Fasilitator
10. Fasilitator validasi kepulangan

### Alur 3 — Evaluasi & Monitoring
1. Pokja pantau dashboard (grafik statistik kehadiran & perizinan)
2. Pokja input catatan evaluasi
3. Sistem kirim notifikasi instruksi ke Fasilitator

***

## 4. Struktur Database (12 Tabel)

| Tabel                  | Fungsi                                                  |
|------------------------|---------------------------------------------------------|
| `gedung`               | Data gedung/blok asrama                                 |
| `mahasiswa`            | Profil, NIM, kuota izin pulkam tersisa                  |
| `fasilitator_asrama`   | Akun & data fasilitator                                 |
| `ketua_pokja_asrama`   | Akun & data ketua pokja                                 |
| `kegiatan_pembinaan`   | Jadwal, nama, jenis kegiatan                            |
| `petugas_absensi`      | Mapping mahasiswa → petugas per kegiatan                |
| `kehadiran`            | Log status presensi per mahasiswa per kegiatan          |
| `rekap_absensi`        | Persentase kehadiran bulanan + status reward/punishment |
| `perizinan`            | Data pengajuan izin, tanggal, jenis, status, dokumen    |
| `konfirmasi_perizinan` | Log + foto bukti tiba & kembali                         |
| `evaluasi_pembinaan`   | Catatan evaluasi dari Pokja                             |
| `notifikasi`           | Message flow antar pengguna                             |

*tabel bisa berubah sesuai kebutuhan*
***

## 5. Non-Functional Requirements

- **Portability:** Responsive di HP (utama untuk Mahasiswa & Petugas)
  dan PC (utama untuk Pokja & Fasilitator)
- **Security:** Prisma ORM mencegah SQL Injection; validasi hak akses
  dinamis khusus form absensi (cek apakah user adalah petugas
  yang ditunjuk untuk jadwal tersebut)
- **Performance:** Response time halaman < 5 detik
- **Storage:** Mendukung upload file foto & dokumen (JPG, PNG, PDF)

***

## 6. Daftar Halaman & Route per Role

### Semua Aktor (Shared)
- `/login`           — Form username + password, link "Lupa Password"
- `/lupa-password`   — Input email/nomor telepon terdaftar
- `/reset-password`  — Form password baru (via link token)
- `/profil`          — Lihat & ubah data profil, ganti password

### Ketua Pokja Asrama
- `/pokja/dashboard`          — Grafik statistik kehadiran & perizinan
                                (bar chart bulanan, pie chart status),
                                daftar catatan evaluasi terbaru
- `/pokja/evaluasi`           — Form input catatan evaluasi baru
- `/pokja/evaluasi/riwayat`   — List semua catatan evaluasi yang dikirim

### Fasilitator Asrama
- `/fasilitator/dashboard`            — KPI card: total kegiatan bulan ini,
                                        izin pending, mahasiswa aktif;
                                        tabel kegiatan hari ini;
                                        inbox notifikasi
- `/fasilitator/kegiatan`             — List jadwal kegiatan (tabel + filter bulan)
- `/fasilitator/kegiatan/tambah`      — Form buat jadwal baru +
                                        dropdown tunjuk Petugas Absensi
- `/fasilitator/kegiatan/:id/edit`    — Edit jadwal & ganti petugas
- `/fasilitator/perizinan`            — List pengajuan izin + filter status
                                        (Semua / Menunggu / Disetujui / Ditolak)
- `/fasilitator/perizinan/:id`        — Detail izin: data mahasiswa, alasan,
                                        dokumen (preview/download),
                                        tombol Setujui / Tolak + alasan
- `/fasilitator/kepulangan`           — List mahasiswa izin disetujui +
                                        status konfirmasi foto tiba/kembali;
                                        lihat foto bukti
- `/fasilitator/rekap`                — List rekap bulanan +
                                        status (Draft / Terpublikasi)
- `/fasilitator/rekap/generate`       — Form pilih bulan → generate otomatis
- `/fasilitator/rekap/:id`            — Preview rekap: tabel mahasiswa,
                                        persentase kehadiran,
                                        status reward/punishment;
                                        tombol Publikasi

### Mahasiswa Asrama
- `/mahasiswa/dashboard`              — Card persentase kehadiran bulan ini,
                                        status reward/punishment,
                                        izin aktif (jika ada),
                                        kuota pulkam tersisa,
                                        daftar kegiatan mendatang
- `/mahasiswa/kehadiran`              — Histori kehadiran per kegiatan
                                        (tabel + filter bulan)
- `/mahasiswa/izin`                   — List riwayat izin + badge status
- `/mahasiswa/izin/ajukan`            — Form ajukan izin: jenis, tanggal,
                                        alasan, upload dokumen
- `/mahasiswa/konfirmasi/:id/tiba`    — Form upload foto tiba di tujuan
- `/mahasiswa/konfirmasi/:id/kembali` — Form upload foto kembali ke asrama
- `/mahasiswa/notifikasi`             — List semua notifikasi masuk

### Petugas Absensi (sub-role Mahasiswa)
- `/absensi/:kegiatan_id`  — Form input kehadiran: tabel daftar mahasiswa
                              + dropdown status tiap baris;
                              hanya bisa diakses petugas yang ditunjuk;
                              tombol Submit (semua baris wajib diisi)

***

## 7. Status & Enum Values

```
Status Kehadiran  : Hadir | Sakit | Izin | Alpa
Status Perizinan  : Menunggu Verifikasi | Disetujui | Ditolak
Jenis Izin        : Izin Pulang Kampung | Izin Kegiatan
Status Rekap      : Draft | Terpublikasi
Jenis Kegiatan    : Shalat Subuh Berjamaah | Absensi Malam |
                    Kegiatan Pembinaan | Kegiatan Kebersamaan |
                    Kegiatan AMA
```

***

## 8. Business Rules (Aturan Bisnis)

1. **Kuota Pulkam:**
   Setiap mahasiswa punya jatah terbatas izin pulang kampung
   (field `jatah_pulang_kampung` di tabel `mahasiswa`).
   Jika kuota = 0 → tampilkan pesan "Kuota pulkam habis", form tidak bisa di-submit.
   Kuota otomatis berkurang 1 saat Fasilitator klik "Setujui".

2. **Wajib Dokumen untuk Izin Kegiatan:**
   Tombol Submit disabled sampai file dokumen diupload.
   Upload area hanya muncul jika jenis izin = "Izin Kegiatan".

3. **Form Absensi Wajib Lengkap:**
   Semua mahasiswa dalam kegiatan harus diisi statusnya.
   Jika ada yang kosong → validasi error, Submit tidak bisa diklik.

4. **Akses Form Absensi Dinamis:**
   Route `/absensi/:kegiatan_id` hanya bisa diakses mahasiswa yang
   terdaftar sebagai petugas pada kegiatan tersebut di tabel
   `petugas_absensi`. Selain itu → redirect 403 Forbidden.

5. **Rumus Generate Rekap:**
   % kehadiran = (jumlah Hadir + jumlah Izin) / Total Kegiatan × 100
   Hasil menentukan status reward atau punishment secara otomatis.

6. **Publikasi Rekap:**
   Setelah Fasilitator klik Publikasi:
   - Status rekap: Draft → Terpublikasi
   - Sistem otomatis kirim notifikasi ke semua mahasiswa asrama

***

## 9. Notification Triggers

| Event                         | Pengirim | Penerima           |
|-------------------------------|----------|--------------------|
| Mahasiswa ajukan izin         | Sistem   | Fasilitator        |
| Fasilitator setujui izin      | Sistem   | Mahasiswa          |
| Fasilitator tolak izin        | Sistem   | Mahasiswa + alasan |
| Mahasiswa upload foto tiba    | Sistem   | Fasilitator        |
| Mahasiswa upload foto kembali | Sistem   | Fasilitator        |
| Fasilitator publikasi rekap   | Sistem   | Semua Mahasiswa    |
| Pokja input catatan evaluasi  | Sistem   | Fasilitator        |

***

## 10. Auth & Keamanan

- Login: username + password (hashed bcrypt)
- Session: JWT atau Express Session
- Reset password: via email atau nomor telepon terdaftar →
  sistem kirim link/token → user isi password baru → redirect login
- Middleware RBAC: setiap route dicek role sebelum diproses
- Validasi hak akses dinamis untuk form absensi
  (query ke tabel `petugas_absensi`)

***

## 11. Panduan Layout & Wireframe

### Layout Umum per Role
- **Pokja & Fasilitator (Desktop):**
  Sidebar kiri fixed (logo + menu navigasi vertikal) +
  area konten kanan + header bar (judul halaman, nama user,
  ikon notifikasi bell)
- **Mahasiswa (Mobile-first):**
  Bottom navigation bar (Home | Kehadiran | Izin | Notifikasi | Profil)
  + header minimal (judul + ikon notifikasi)

### Halaman Login
- Layout: card terpusat di tengah layar
- Konten: logo SIMBIMA di atas, field Username, field Password
  (dengan toggle show/hide), tombol Login,
  link "Lupa Password?" di bawah tombol

### Dashboard Fasilitator
- Baris 1: 3 KPI card
  (Total Kegiatan Bulan Ini | Izin Menunggu Verifikasi | Mahasiswa Aktif)
- Baris 2: Tabel kegiatan hari ini
  (Nama Kegiatan | Waktu | Petugas | Status Absensi)
- Baris 3: Daftar notifikasi terbaru (max 5 item)

### Dashboard Monitoring Pokja
- Baris 1: Bar chart kehadiran bulanan (12 bulan terakhir)
- Baris 2: Pie chart distribusi status kehadiran bulan ini
  (Hadir / Sakit / Izin / Alpa)
- Baris 3: Tabel catatan evaluasi terbaru

### Dashboard Mahasiswa
- Card 1: Progress ring % kehadiran bulan ini +
  label status (Reward / Punishment / Normal)
- Card 2: Kuota pulkam tersisa (angka besar + label)
- Card 3: Status izin aktif (tampil jika ada izin berjalan)
- Section: Daftar kegiatan mendatang (list sederhana)

### Halaman List Perizinan (Fasilitator)
- Tab filter: Semua | Menunggu | Disetujui | Ditolak
- Tiap row: Nama Mahasiswa | Jenis Izin | Tanggal |
  Badge Status (kuning=Menunggu, hijau=Disetujui, merah=Ditolak) |
  Tombol "Detail"

### Halaman Detail Perizinan (Fasilitator)
- Info mahasiswa (nama, NIM, gedung)
- Jenis izin, tanggal mulai–selesai, alasan
- Preview/download dokumen (khusus Izin Kegiatan)
- Tombol: "Setujui" (hijau) | "Tolak" (merah, modal isi alasan)

### Form Ajukan Izin (Mahasiswa)
- Dropdown: Jenis Izin (Pulkam / Kegiatan)
- Date picker: Tanggal Mulai & Tanggal Selesai
- Textarea: Alasan
- Upload area: muncul & wajib HANYA jika pilih Izin Kegiatan
- Info banner kuota: "Kuota pulkam tersisa: X kali"
  (merah & disabled jika kuota = 0)
- Tombol Submit (disabled jika syarat belum terpenuhi)

### Form Absensi Kegiatan (Petugas)
- Header: Nama Kegiatan + Tanggal + Nama Petugas yang login
- Tabel: No | Nama Mahasiswa | NIM | Status (dropdown per baris)
- Progress bar: "X dari Y mahasiswa sudah diisi"
- Tombol Submit di bawah (disabled sampai semua baris terisi)

### Halaman Rekap Absensi (Fasilitator)
- Filter: pilih bulan & tahun
- Tabel: Nama Mahasiswa | Total Hadir | Total Sakit |
  Total Izin | Total Alpa | % Kehadiran | Status Reward/Punishment
- Tombol: "Generate Rekap" (jika belum ada) |
  "Publikasi" (jika status masih Draft)
- Badge status: Draft (abu-abu) | Terpublikasi (hijau)

***

## 12. Catatan untuk AI Agent

- Baca SPEC.md ini sebelum memulai setiap task baru
- Ikuti nama route yang sudah didefinisikan di Section 6
- Ikuti enum values yang sudah didefinisikan di Section 7
- Terapkan business rules dari Section 8 pada setiap fitur terkait
- Prioritas responsif:
  - Mobile-first → role Mahasiswa & Petugas Absensi
  - Desktop-first → role Fasilitator & Pokja