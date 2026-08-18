# Task: Implementasi Kombinasi QR Code + Geofencing pada SIMBIMA

## Konteks Project

SIMBIMA adalah sistem informasi monitoring pembinaan karakter mahasiswa berbasis web
untuk Asrama Universitas Andalas. Sistem saat ini sudah memiliki fitur:
- Absensi kegiatan pembinaan menggunakan QR Code
- Perizinan keluar asrama (izin kegiatan & pulang kampung)
- Monitoring kepulangan mahasiswa
- Dashboard monitoring untuk Ketua Pokja Asrama
- Export laporan (Excel/PDF)

## Tujuan

Tambahkan validasi lokasi berbasis **geofencing** pada fitur absensi QR yang sudah ada,
sehingga presensi mahasiswa hanya dianggap sah jika QR valid **dan** mahasiswa berada
dalam radius lokasi kegiatan yang telah ditentukan. Ini untuk mencegah kecurangan
"titip absen" dari luar lokasi asrama/kegiatan.

## Langkah yang Harus Dikerjakan

### 1. Eksplorasi Codebase Terlebih Dahulu
- Cari file controller, model/schema, dan route yang menangani fitur absensi QR saat ini
- Cari file controller yang menangani CRUD kegiatan pembinaan
- Identifikasi ORM/query builder yang dipakai (Prisma, Sequelize, Knex, Mongoose, dsb)
- Identifikasi struktur frontend untuk halaman scan QR mahasiswa dan halaman kelola
  kegiatan oleh fasilitator
- Tampilkan ringkasan temuan sebelum melakukan perubahan apa pun

### 2. Migrasi Database
Tambahkan kolom berikut sesuai ORM yang dipakai:
- Pada tabel/model kegiatan: `latitude`, `longitude`, `radius_meter` (default 50)
- Pada tabel/model absensi: `lokasi_valid` (boolean), `jarak_meter` (decimal),
  `latitude_scan`, `longitude_scan`
- (Opsional) buat tabel baru `absensi_log_gagal` untuk mencatat percobaan presensi
  yang ditolak karena di luar radius, sebagai bahan audit fasilitator

### 3. Utility Geofencing
Buat fungsi reusable untuk:
- Menghitung jarak antara dua koordinat GPS menggunakan Haversine Formula
- Memvalidasi apakah suatu titik berada dalam radius geofence, dengan toleransi
  tambahan ±15 meter untuk mengakomodasi ketidakakuratan GPS indoor

### 4. Backend - Endpoint Set Lokasi Kegiatan
Tambahkan endpoint (misalnya `PUT /kegiatan/:id/lokasi`) yang memungkinkan
fasilitator/pokja menetapkan titik lokasi dan radius valid untuk sebuah kegiatan.

### 5. Backend - Modifikasi Endpoint Scan Absensi
Modifikasi endpoint scan QR yang sudah ada agar menerima `latitude` dan `longitude`
tambahan dari body request, lalu:
1. Validasi QR token seperti biasa (ambil data kegiatan terkait)
2. Jika kegiatan belum punya lokasi geofence dikonfigurasi, tolak dengan pesan jelas
3. Hitung jarak mahasiswa ke titik kegiatan menggunakan utility geofencing
4. Jika di luar radius (+ toleransi) -> tolak presensi dengan pesan jarak,
   simpan log percobaan gagal
5. Jika dalam radius -> lanjutkan proses absensi seperti biasa, simpan juga
   `jarak_meter` dan koordinat scan untuk audit
6. Cegah duplikasi absensi pada kegiatan yang sama seperti logika yang sudah ada

### 6. Frontend - Halaman Scan QR Mahasiswa
Modifikasi halaman/komponen scan QR yang sudah ada agar:
- Setelah QR berhasil dibaca, minta izin lokasi via HTML5 Geolocation API
  (`navigator.geolocation.getCurrentPosition`)
- Jika akurasi GPS lebih buruk dari 50 meter, tampilkan pesan agar user pindah
  ke area dengan sinyal lebih baik, sebelum mengirim request
- Kirim qrToken + latitude + longitude ke backend
- Tampilkan pesan error yang jelas jika lokasi ditolak (di luar radius, GPS mati,
  izin lokasi ditolak browser, dsb)

### 7. Frontend - Halaman Kelola Kegiatan (Fasilitator/Pokja)
Tambahkan form/input baru pada halaman buat/edit kegiatan untuk:
- Tombol "Gunakan Lokasi Saat Ini" (ambil koordinat otomatis dari perangkat)
- Input manual latitude & longitude sebagai fallback
- Input radius valid (meter), default 50

### 8. Testing
Setelah implementasi selesai, tolong test skenario berikut dan laporkan hasilnya:
1. Presensi dari dalam radius -> harus berhasil
2. Presensi dari luar radius -> harus ditolak dengan pesan jarak
3. Presensi tanpa izin lokasi aktif -> harus menampilkan pesan error yang jelas
4. Presensi duplikat pada kegiatan yang sama -> harus ditolak
5. QR kadaluarsa -> harus ditolak seperti perilaku sebelumnya (tidak berubah)

## Batasan Penting

- **Jangan mengubah logika bisnis QR Code yang sudah berjalan** — geofencing adalah
  lapisan validasi TAMBAHAN, bukan pengganti QR.
- **Ikuti konvensi penamaan, struktur folder, dan gaya kode yang sudah ada** di project ini.
- **Jangan hardcode koordinat atau radius** — semua harus dikonfigurasi oleh
  fasilitator/pokja melalui UI.
- Tunjukkan diff/preview perubahan pada file inti (controller absensi, controller
  kegiatan) sebelum menerapkan perubahan, karena ini menyentuh fitur yang sudah
  berjalan di production/skripsi.
- Pastikan tidak ada breaking change pada endpoint yang sudah dipakai fitur lain
  (misalnya dashboard monitoring atau export laporan yang bergantung pada tabel absensi).

## Referensi Formula (jika dibutuhkan)

Haversine Formula untuk jarak dua koordinat (dalam meter):

\`\`\`
R = 6371000 (radius bumi dalam meter)
dLat = radians(lat2 - lat1)
dLon = radians(lon2 - lon1)
a = sin(dLat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2)^2
c = 2 * atan2(sqrt(a), sqrt(1-a))
distance = R * c
\`\`\`