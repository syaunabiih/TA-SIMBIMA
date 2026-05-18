# PROMPT TEMPLATES — SIMBIMA Build Guide
# Gunakan prompt-prompt ini secara berurutan di Antigravity

***

## PROMPT 0 — Pembuka Wajib (Jalankan Pertama Kali di Setiap Sesi)

Sebelum mulai, lakukan 2 hal ini dulu:

1. Baca file SPEC.md di root project ini — ini adalah 
   spesifikasi lengkap sistem SIMBIMA.

2. Scan seluruh struktur file & folder yang sudah ada di 
   project ini, lalu buat ringkasan:
   - Fitur / halaman apa yang sudah diimplementasi
   - File apa yang sudah ada (routes, controllers, views, 
     middleware, prisma schema, dll.)
   - Fitur apa yang ada di SPEC.md tapi belum ada di kode

Setelah itu, konfirmasi hasilnya ke saya sebelum mulai 
coding apapun.

***

## PROMPT 1 — Auth & Middleware RBAC

Berdasarkan SPEC.md Section 10 (Auth & Keamanan) dan 
Section 2 (RBAC), kerjakan fitur Auth berikut:

1. Halaman Login (/login)
   - Form username + password dengan toggle show/hide password
   - Validasi input sisi client (field tidak boleh kosong)
   - Handle error: "Username atau password salah"
   - Redirect setelah login berdasarkan role:
     * ketua_pokja   -> /pokja/dashboard
     * fasilitator   -> /fasilitator/dashboard
     * mahasiswa     -> /mahasiswa/dashboard

2. Middleware RBAC
   - Cek session/JWT di setiap request
   - Redirect ke /login jika belum login
   - Return 403 jika role tidak sesuai dengan route yang diakses
   - Validasi dinamis untuk route /absensi/:kegiatan_id:
     cek tabel petugas_absensi apakah user adalah petugas 
     yang ditunjuk untuk kegiatan tersebut

3. Halaman Lupa Password (/lupa-password)
   - Form input email atau nomor telepon
   - Kirim link/token reset ke email/nomor terdaftar

4. Halaman Reset Password (/reset-password)
   - Form password baru + konfirmasi password
   - Validasi token dari link
   - Redirect ke /login setelah berhasil

5. Halaman Profil (/profil)
   - Lihat & ubah data profil
   - Form ganti password: password lama, baru, konfirmasi baru

Jangan ubah file yang sudah ada kecuali perlu integrasi.
Konfirmasi setiap file yang dibuat/diubah.

***

## PROMPT 2A — Dashboard Fasilitator

Berdasarkan SPEC.md Section 6 dan Section 11 (Wireframe), 
buat halaman Dashboard Fasilitator (/fasilitator/dashboard).

Layout:
- Sidebar kiri fixed: logo SIMBIMA + menu navigasi vertikal
  (Dashboard, Kegiatan, Perizinan, Kepulangan, Rekap, Profil)
- Header bar: judul halaman + nama user yang login + ikon notifikasi
- Konten utama 3 bagian:

  Bagian 1 — KPI Cards (3 card sejajar):
  - "Total Kegiatan Bulan Ini" -> query dari tabel kegiatan_pembinaan
  - "Izin Menunggu Verifikasi" -> query dari tabel perizinan 
    WHERE status = Menunggu Verifikasi
  - "Mahasiswa Aktif" -> query dari tabel mahasiswa

  Bagian 2 — Tabel Kegiatan Hari Ini:
  Kolom: Nama Kegiatan | Waktu | Petugas yang Ditunjuk | 
         Status Absensi (Sudah/Belum)

  Bagian 3 — Notifikasi Terbaru:
  List 5 notifikasi terbaru dari tabel notifikasi
  WHERE penerima = fasilitator yang login

Gunakan data dummy/seed jika belum ada data real.
Responsive: sidebar collapse menjadi hamburger di layar < 768px.

***

## PROMPT 2B — Dashboard Mahasiswa

Berdasarkan SPEC.md Section 6 dan Section 11 (Wireframe),
buat halaman Dashboard Mahasiswa (/mahasiswa/dashboard).

Layout Mobile-first:
- Bottom navigation bar:
  Home | Kehadiran | Izin | Notifikasi | Profil
- Header: nama SIMBIMA + ikon notifikasi (badge count)

Konten utama (urut dari atas):

  Card 1 — Kehadiran Bulan Ini:
  - Progress ring/bar persentase kehadiran
  - Rumus: (Hadir + Izin) / Total Kegiatan x 100
  - Label status: Reward / Punishment / Normal
  - Warna: hijau=Reward, merah=Punishment, abu=Normal

  Card 2 — Kuota Pulkam:
  - Angka besar kuota tersisa
  - Label: "Sisa Izin Pulang Kampung"
  - Warna merah jika kuota = 0

  Card 3 — Izin Aktif (tampil HANYA jika ada izin berjalan):
  - Jenis izin + tanggal + status badge
  - Tombol "Upload Bukti Tiba" / "Upload Bukti Kembali" 
    sesuai kondisi konfirmasi

  Section — Kegiatan Mendatang:
  - List 3 kegiatan berikutnya dari tabel kegiatan_pembinaan
  - Tampilkan: nama kegiatan + tanggal + waktu

Gunakan data dummy/seed jika belum ada data real.

***

## PROMPT 2C — Dashboard Pokja

Berdasarkan SPEC.md Section 6 dan Section 11 (Wireframe),
buat halaman Dashboard Ketua Pokja (/pokja/dashboard).

Layout sama dengan Fasilitator (sidebar + header), 
tapi menu sidebar: Dashboard, Evaluasi, Riwayat Evaluasi, Profil

Konten utama:

  Bagian 1 — Bar Chart Kehadiran Bulanan:
  - Sumbu X: 12 bulan terakhir
  - Sumbu Y: persentase rata-rata kehadiran
  - Data dari tabel rekap_absensi

  Bagian 2 — Pie Chart Distribusi Kehadiran Bulan Ini:
  - 4 slice: Hadir | Sakit | Izin | Alpa
  - Data dari tabel kehadiran bulan berjalan

  Bagian 3 — Tabel Catatan Evaluasi Terbaru:
  Kolom: Tanggal | Isi Catatan (truncate 100 char) | Status Baca
  Tombol "Tambah Evaluasi Baru" di pojok kanan atas tabel

Gunakan library chart yang sudah ada di project, 
atau Chart.js jika belum ada.
Gunakan data dummy/seed jika belum ada data real.

***

## PROMPT 3 — Manajemen Kegiatan (Fasilitator)

Berdasarkan SPEC.md Section 6, buat modul Manajemen Kegiatan
untuk Fasilitator. Terdiri dari 3 halaman:

1. List Kegiatan (/fasilitator/kegiatan)
   - Tabel: Nama Kegiatan | Jenis | Tanggal | Waktu | 
     Petugas | Aksi (Edit | Hapus)
   - Filter dropdown: bulan & tahun
   - Tombol "+ Tambah Kegiatan" di atas tabel
   - Konfirmasi dialog sebelum hapus

2. Form Tambah Kegiatan (/fasilitator/kegiatan/tambah)
   Field:
   - Nama Kegiatan (text)
   - Jenis Kegiatan (dropdown: lihat enum Section 7 SPEC.md)
   - Tanggal (date picker)
   - Waktu Mulai & Waktu Selesai (time picker)
   - Petugas Absensi (dropdown multiselect dari tabel mahasiswa)
   - Tombol Simpan & Batal

3. Form Edit Kegiatan (/fasilitator/kegiatan/:id/edit)
   - Sama dengan form tambah, tapi pre-filled data existing
   - Tombol Simpan Perubahan & Batal

Business rule: saat kegiatan disimpan, otomatis insert ke tabel
petugas_absensi untuk mahasiswa yang ditunjuk.
Jangan ubah file yang sudah ada kecuali perlu integrasi.

***

## PROMPT 4 — Form Absensi (Petugas)

Berdasarkan SPEC.md Section 6, Section 8 (Business Rules 3 & 4),
buat halaman Form Absensi Kegiatan (/absensi/:kegiatan_id).

Middleware wajib:
- Cek apakah user yang login terdaftar di tabel petugas_absensi
  untuk kegiatan_id tersebut
- Jika bukan petugas -> redirect ke halaman 403 Forbidden
- Jika kegiatan tidak ditemukan -> redirect 404

Layout halaman:
- Header card: Nama Kegiatan + Tanggal + Waktu + 
  label "Petugas: [nama user login]"
- Progress bar: "X dari Y mahasiswa sudah diisi" 
  (update real-time saat dropdown diubah)
- Tabel absensi:
  Kolom: No | Nama Mahasiswa | NIM | 
         Status (dropdown: Hadir/Sakit/Izin/Alpa)
  Semua dropdown default kosong / placeholder "-- Pilih --"
- Tombol Submit di bawah tabel:
  DISABLED sampai semua baris sudah dipilih statusnya
  Saat diklik: konfirmasi dialog "Yakin ingin submit absensi?
  Data tidak bisa diubah setelah submit."

Setelah submit berhasil:
- Insert semua data ke tabel kehadiran
- Tampilkan halaman sukses: "Absensi berhasil dicatat!"
- Tombol kembali ke dashboard mahasiswa

Jangan ubah file yang sudah ada kecuali perlu integrasi.
Konfirmasi setiap file yang dibuat/diubah.

***

## PROMPT 5 — Modul Perizinan (Full Flow)

Berdasarkan SPEC.md Section 6, Section 8 (Business Rules 1 & 2),
dan Section 9 (Notifications), buat modul Perizinan lengkap:

--- SISI MAHASISWA ---

1. List Riwayat Izin (/mahasiswa/izin)
   - Tabel: Jenis Izin | Tanggal Mulai | Tanggal Selesai | 
     Status (badge warna) | Aksi
   - Badge: kuning=Menunggu, hijau=Disetujui, merah=Ditolak
   - Tombol "+ Ajukan Izin Baru"

2. Form Ajukan Izin (/mahasiswa/izin/ajukan)
   Field:
   - Dropdown Jenis Izin: Izin Pulang Kampung | Izin Kegiatan
   - Date picker: Tanggal Mulai & Tanggal Selesai
   - Textarea: Alasan
   - Upload dokumen: HANYA muncul jika pilih Izin Kegiatan,
     wajib diisi, accept: .pdf/.jpg/.png
   - Info banner: "Sisa kuota pulkam: X kali"
     Muncul jika pilih Izin Pulang Kampung
     Merah + disabled jika kuota = 0
   - Tombol Submit: disabled jika syarat belum terpenuhi

   Business rule saat submit:
   - Cek kuota pulkam jika jenis = Pulkam, tolak jika 0
   - Insert ke tabel perizinan status: Menunggu Verifikasi
   - Kirim notifikasi ke Fasilitator

3. Form Upload Bukti Tiba (/mahasiswa/konfirmasi/:id/tiba)
   - Info izin (jenis, tanggal, tujuan)
   - Upload area foto (wajib, accept: .jpg/.png)
   - Tombol Kirim Bukti
   - Setelah submit: insert ke tabel konfirmasi_perizinan,
     kirim notifikasi ke Fasilitator

4. Form Upload Bukti Kembali (/mahasiswa/konfirmasi/:id/kembali)
   - Sama dengan form tiba, untuk konfirmasi kembali ke asrama

--- SISI FASILITATOR ---

5. List Perizinan (/fasilitator/perizinan)
   - Tab filter: Semua | Menunggu | Disetujui | Ditolak
   - Tabel: Nama Mahasiswa | NIM | Jenis Izin | 
     Tanggal | Badge Status | Tombol Detail

6. Detail & Validasi Izin (/fasilitator/perizinan/:id)
   - Info lengkap mahasiswa dan izin
   - Preview dokumen jika Izin Kegiatan (bisa download)
   - Tombol Setujui (hijau):
     * Update status -> Disetujui
     * Jika Pulkam: kurangi kuota di tabel mahasiswa
     * Kirim notifikasi ke mahasiswa
   - Tombol Tolak (merah):
     * Modal isi alasan penolakan
     * Update status -> Ditolak + simpan alasan
     * Kirim notifikasi ke mahasiswa + alasan

7. Halaman Kepulangan (/fasilitator/kepulangan)
   - List mahasiswa dengan izin disetujui
   - Status: Belum Berangkat | Sudah Tiba | Sudah Kembali
   - Tombol Lihat Foto untuk preview bukti tiba/kembali

***

## PROMPT 6 — Modul Rekap Absensi (Fasilitator)

Berdasarkan SPEC.md Section 6, Section 8 (Business Rules 5 & 6),
buat modul Rekap Absensi lengkap:

1. List Rekap (/fasilitator/rekap)
   - Tabel: Bulan | Tahun | Status | Tanggal Generate | Aksi
   - Badge: abu-abu=Draft, hijau=Terpublikasi
   - Tombol "+ Generate Rekap Baru"

2. Generate Rekap (/fasilitator/rekap/generate)
   - Dropdown pilih Bulan & Tahun
   - Validasi: tidak bisa generate jika rekap bulan itu sudah ada
   - Proses generate:
     * Hitung per mahasiswa:
       % kehadiran = (Hadir + Izin) / Total Kegiatan x 100
     * Tentukan status reward/punishment dari persentase
     * Insert ke tabel rekap_absensi
   - Redirect ke halaman preview setelah selesai

3. Preview & Publikasi Rekap (/fasilitator/rekap/:id)
   - Header: "Rekap Absensi [Bulan] [Tahun]" + badge status
   - Tabel: Nama | NIM | Hadir | Sakit | Izin | Alpa |
            % Kehadiran | Status Reward/Punishment
   - Tombol Publikasi (hanya jika status = Draft):
     * Konfirmasi dialog: "Rekap yang sudah dipublikasi tidak 
       bisa diubah. Lanjutkan?"
     * Update status -> Terpublikasi
     * Kirim notifikasi ke semua mahasiswa asrama
   - Setelah terpublikasi: tabel read-only

***

## PROMPT 7 — Modul Evaluasi (Pokja)

Berdasarkan SPEC.md Section 6 dan Section 9 (Notifications),
buat modul Evaluasi untuk Pokja:

1. Form Evaluasi Baru (/pokja/evaluasi)
   Field:
   - Textarea: Isi catatan evaluasi (wajib, min 20 karakter)
   - Dropdown: Pilih Fasilitator tujuan (dari tabel fasilitator_asrama)
   - Tombol Kirim Evaluasi
   Setelah submit:
   - Insert ke tabel evaluasi_pembinaan
   - Kirim notifikasi ke fasilitator yang dipilih
   - Redirect ke riwayat evaluasi

2. Riwayat Evaluasi (/pokja/evaluasi/riwayat)
   - Tabel: Tanggal | Ditujukan ke | 
     Isi (truncate 100 char, klik untuk lihat full) | Status Baca
   - Filter: dropdown pilih Fasilitator

--- SISI FASILITATOR ---

3. Notifikasi evaluasi masuk di dashboard fasilitator:
   - Tampil di inbox notifikasi
   - Klik notifikasi -> buka detail catatan evaluasi
   - Status otomatis Sudah Dibaca saat dibuka

***

## PROMPT 8 — Notifikasi Global

Berdasarkan SPEC.md Section 9 (Notification Triggers),
implementasikan sistem notifikasi:

1. Pastikan struktur tabel notifikasi:
   id, penerima_id, penerima_role, judul, isi, 
   is_read (boolean), created_at

2. Buat helper function sendNotification(penerimaId, role, judul, isi):
   - Insert ke tabel notifikasi
   - Pasang di semua trigger sesuai SPEC.md Section 9

3. Halaman Notifikasi Mahasiswa (/mahasiswa/notifikasi)
   - List notifikasi: judul, isi, waktu, badge Baru
   - Klik -> mark as read (is_read = true)
   - Tombol "Tandai Semua Dibaca"

4. Badge count di header/bottom nav:
   - Tampilkan jumlah notifikasi is_read = false
   - Update saat page refresh

5. Pastikan semua trigger terpasang (SPEC.md Section 9):
   - Mahasiswa ajukan izin -> notif ke Fasilitator
   - Fasilitator setujui/tolak izin -> notif ke Mahasiswa
   - Upload foto tiba/kembali -> notif ke Fasilitator
   - Publikasi rekap -> notif ke semua Mahasiswa
   - Pokja input evaluasi -> notif ke Fasilitator

***

## Tips Penggunaan

- Jalankan PROMPT 0 sekali di awal setiap sesi baru
- Setelah tiap prompt selesai, minta agent:
  "Tampilkan semua file yang baru dibuat atau dimodifikasi"
- Jika ada error, paste pesan error langsung di chat yang sama
- Jangan skip urutan — Auth (1) harus selesai sebelum Dashboard (2)