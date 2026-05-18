# CEK.md — Audit Kelengkapan Kode SIMBIMA

## INSTRUKSI UNTUK AI AGENT

Lakukan audit menyeluruh terhadap kode project ini.

Untuk SETIAP poin di bawah, buka file yang relevan dan jawab:
- ✅ ADA & LENGKAP — fungsi/logika sudah ada dan benar
- ⚠️ ADA TAPI BELUM LENGKAP — file ada tapi logikanya kosong/partial
- ❌ TIDAK ADA — file atau fungsi belum dibuat sama sekali

Jangan asumsikan — buka filenya langsung dan verifikasi.
Setelah audit selesai, buat laporan dengan format tabel,
lalu list semua item ⚠️ dan ❌ sebagai prioritas fix.

---

## BAGIAN 1 — Kelengkapan Route (App.jsx)

Cek apakah route-route berikut sudah terdaftar di App.jsx
dengan PrivateRoute dan role yang benar:

### Shared (semua role)
- ✅ /login (di-handle di `/`)
- ✅ /lupa-password
- ✅ /reset-password
- ✅ /profil

### Ketua Pokja
- ✅ /pokja/dashboard
- ✅ /pokja/evaluasi
- ❌ /pokja/evaluasi/riwayat (Tidak ada route ini di App.jsx)

### Fasilitator
- ✅ /fasilitator/dashboard
- ✅ /fasilitator/kegiatan
- ❌ /fasilitator/kegiatan/tambah (Tidak didaftarkan, mungkin dalam modal)
- ❌ /fasilitator/kegiatan/:id/edit (Tidak didaftarkan, mungkin dalam modal)
- ✅ /fasilitator/perizinan
- ❌ /fasilitator/perizinan/:id (Tidak didaftarkan, mungkin dalam modal)
- ✅ /fasilitator/kepulangan
- ✅ /fasilitator/rekap
- ✅ /fasilitator/rekap/generate
- ⚠️ /fasilitator/rekap/:id (Didaftarkan sebagai `/fasilitator/rekap/:bulan/:tahun`)
- ✅ /fasilitator/notifikasi

### Mahasiswa
- ✅ /mahasiswa/dashboard
- ✅ /mahasiswa/kehadiran
- ✅ /mahasiswa/izin
- ❌ /mahasiswa/izin/ajukan (Tidak didaftarkan, mungkin dalam modal)
- ✅ /mahasiswa/konfirmasi/:id/tiba
- ✅ /mahasiswa/konfirmasi/:id/kembali
- ✅ /mahasiswa/rekap
- ✅ /mahasiswa/notifikasi

### Petugas Absensi
- ✅ /absensi/:kegiatan_id

---

## BAGIAN 2 — Kelengkapan Backend Controller

### authController.js
- ✅ Fungsi login → cek username+password, return JWT
- ✅ Password di-hash bcrypt saat register/seed (Menggunakan `bcryptjs`)
- ✅ Fungsi lupa password → generate token, simpan ke DB
- ✅ Fungsi reset password → validasi token, update password
- ✅ Fungsi ganti password → cek password lama

### izinController.js
- ✅ Fungsi ajukan izin → insert ke tabel perizinan
- ✅ Cek kuota pulkam sebelum insert
- ✅ Jika kuota = 0 → return error, tidak insert
- ⚠️ Upload dokumen Izin Kegiatan tersimpan ke storage (Controller tidak menghandle upload `req.file` secara spesifik, hanya mencatat nama file dari form)
- ✅ Kirim notifikasi ke Fasilitator saat izin diajukan
- ✅ Fungsi validasi izin setujui/tolak
- ✅ Jika setujui & Pulkam → kurangi kuota mahasiswa di DB
- ✅ Kirim notifikasi ke Mahasiswa saat setujui/tolak
- ✅ Fungsi upload foto tiba → insert ke konfirmasi_perizinan
- ✅ Kirim notifikasi ke Fasilitator saat foto tiba diupload
- ✅ Fungsi upload foto kembali → insert ke konfirmasi_perizinan
- ✅ Kirim notifikasi ke Fasilitator saat foto kembali diupload

### kegiatanController.js
- ⚠️ Fungsi get all kegiatan (filter bulan/tahun) (Fungsi mengambil semua kegiatan tetapi tidak memfilter by bulan/tahun)
- ✅ Fungsi create kegiatan
- ✅ Setelah create → auto insert ke tabel petugas_absensi
- ✅ Fungsi update kegiatan
- ✅ Fungsi delete kegiatan

### absensiController.js (atau di kegiatanController)
- ✅ Fungsi get daftar mahasiswa untuk form absensi (`getAbsensiForm`)
- ✅ Validasi: cek apakah user adalah petugas di petugas_absensi
- ✅ Fungsi submit absensi → insert semua ke tabel kehadiran
- ⚠️ Validasi: semua mahasiswa harus terisi sebelum submit (Controller merespon data insert, tapi tidak menghitung apakah semua baris dikirim/dipilih)

### rekapController.js
- ✅ Fungsi generate rekap → query kehadiran bulan tersebut
- ✅ Hitung per mahasiswa: (Hadir+Izin)/Total×100
- ✅ Tentukan status reward/punishment dari persentase
- ✅ Cek duplikat: tolak jika rekap bulan+tahun sudah ada
- ✅ Insert ke tabel rekap_absensi
- ✅ Fungsi publikasi rekap → update status ke TERPUBLIKASI
- ✅ Kirim notifikasi ke semua mahasiswa saat publikasi

### notifikasiController.js
- ✅ Fungsi get semua notifikasi milik user yang login
- ✅ Fungsi mark as read (single)
- ✅ Fungsi mark all as read
- ⚠️ Fungsi get count notifikasi belum dibaca (Digabungkan pada output get semua notifikasi, bukan endpoint khusus `/count`)

### evaluasiController.js / monitoringController.js
- ✅ Fungsi create catatan evaluasi (`tambahEvaluasi`)
- ❌ Kirim notifikasi ke Fasilitator setelah insert (Kodenya hanya berupa komentar `// Opsional`)
- ❌ Fungsi get riwayat evaluasi (Tidak ditemukan di controller manapun)

### mahasiswaController.js
- ✅ Fungsi get profil user login (Terdapat dalam `authController.js`)
- ✅ Fungsi update profil (Terdapat dalam `authController.js`)
- ✅ Fungsi get histori kehadiran mahasiswa (`getProfilDanRiwayat`)
- ✅ Fungsi get rekap absensi mahasiswa (hanya TERPUBLIKASI) (`getRiwayatRekapMahasiswa` di `rekapController.js`)

---

## BAGIAN 3 — Kelengkapan Backend Routes

### Auth Routes
- ✅ POST /api/auth/login
- ✅ POST /api/auth/lupa-password
- ✅ POST /api/auth/reset-password
- ⚠️ PUT /api/auth/ganti-password (Ada di `/api/auth/profil/password`)
- ✅ GET /api/auth/profil
- ✅ PUT /api/auth/profil

### Izin Routes
- ✅ POST /api/izin/ajukan
- ✅ GET /api/izin
- ❌ GET /api/izin/saya (Mahasiswa dan Fasilitator digabung dalam `/api/izin`)
- ✅ GET /api/izin/:id (Ada di `/:id_perizinan`)
- ✅ PUT /api/izin/validasi/:id
- ❌ POST /api/izin/konfirmasi/:id/tiba (Diproses secara general dalam `POST /api/izin/konfirmasi`)
- ❌ POST /api/izin/konfirmasi/:id/kembali (Kondisi yang merepresentasikan ID dan Type tidak spesifik dalam rute)
- ❌ GET /api/izin/kepulangan (Tidak ada route spesifik, difilter dari frontend)

### Kegiatan Routes
- ✅ GET /api/kegiatan
- ⚠️ POST /api/kegiatan (Route yang diciptakan adalah `/api/kegiatan/buat`)
- ✅ PUT /api/kegiatan/:id
- ✅ DELETE /api/kegiatan/:id
- ⚠️ GET /api/absensi/:kegiatan_id (Route teregistrasi di `/api/kegiatan/absensi-form/:id`)
- ⚠️ POST /api/absensi/:kegiatan_id (Route teregistrasi di `/api/kegiatan/absen`)

### Rekap Routes
- ⚠️ GET /api/rekap (Ada di `/api/rekap/fasilitator`)
- ✅ POST /api/rekap/generate
- ⚠️ GET /api/rekap/:id (Ada di `/api/rekap/fasilitator/:bulan/:tahun`)
- ⚠️ PUT /api/rekap/:id/publikasi (Ada di `POST /api/rekap/publikasi`)
- ⚠️ GET /api/rekap/saya (Ada di `GET /api/rekap/mahasiswa`)

### Notifikasi Routes
- ✅ GET /api/notifikasi
- ❌ GET /api/notifikasi/count
- ✅ PUT /api/notifikasi/:id/baca
- ✅ PUT /api/notifikasi/baca-semua (Ada di `/tandai-semua`)

### Evaluasi Routes
- ⚠️ POST /api/evaluasi (Terdaftar di `POST /api/monitoring/evaluasi`)
- ❌ GET /api/evaluasi

---

## BAGIAN 4 — Kelengkapan Middleware

- ✅ authMiddleware.js → verifikasi JWT, attach user ke req
- ✅ Role middleware memblokir akses jika role tidak sesuai (`isFasilitator`, `isKetuaPokja`)
- ⚠️ Validasi dinamis /absensi/:kegiatan_id (Divalidasi di controller bukan tersendiri di middleware)
- ✅ Multer upload foto JPG/PNG max 5MB (`uploadMiddleware.js`)
- ❌ Multer upload dokumen PDF/JPG/PNG (`uploadMiddleware.js` khusus menghandle format gambar `image/*` saja, belum mengizinkan file dokumen PDF untuk izin)

---

## BAGIAN 5 — Koneksi Frontend ke API

### Utils API (`api.js`)
- ✅ Base URL sudah dikonfigurasi
- ✅ JWT token dikirim di setiap request
- ⚠️ Handle error 401 → redirect ke /login (Tidak ada axios interceptor / penanganan global untuk Token Expired pada `api.js`)

*(Koneksi komponen ke API tidak diaudit satu-satu secara manual di checklist API.js ini namun telah direkap untuk membandingkan backend)*

---

## BAGIAN 8 — Prisma Schema

- ✅ Semua 12 tabel ada di schema.prisma (Terhitung total 13 tabel dengan `ResetToken`)
- ✅ Enum StatusKehadiran ada
- ⚠️ Enum StatusPerizinan ada (Di schema bernama `StatusPengajuan`)
- ✅ Enum JenisIzin ada
- ⚠️ Enum StatusRekap ada (Di schema bernama `StatusPublikasi`)
- ✅ Enum JenisKegiatan ada
- ⚠️ Field jatah_pulang_kampung ada di tabel mahasiswa (Di schema bernama `kuota_izin_pulang`)
- ✅ Relasi petugas_absensi ke mahasiswa & kegiatan benar
- ⚠️ Field is_read ada di tabel notifikasi (Di schema bernama `status_baca`)

---

## FORMAT LAPORAN YANG DIHARAPKAN

### Ringkasan
- Total item dicek: **84**
- ✅ Lengkap: **53** item
- ⚠️ Partial/Berbeda Nama: **19** item
- ❌ Tidak ada: **12** item

### Daftar Item yang Perlu Difix (Prioritas Tinggi - ❌ dan ⚠️ Terpilih)

| No | Bagian | Item | Status | Tindakan yang Diperlukan | File Target |
|----|--------|------|--------|--------------------------|-------------|
| 1 | Middleware | Multer upload PDF tidak diizinkan | ❌ | Tambahkan handling file `.pdf` di filter mime-type `uploadMiddleware.js` karena `Izin Kegiatan` butuh dokumen. | `uploadMiddleware.js` |
| 2 | Backend Routes | Upload dokumen Izin Kegiatan storage | ⚠️ | Tambahkan `upload.single('dokumen_pendukung')` ke `router.post("/ajukan")` dkk dan pastikan `req.file` masuk ke `dokumen_pendukung` dalam tabel. | `izinRoutes.js`, `izinController.js` |
| 3 | Backend Controller | Kirim notifikasi Fasilitator pasca Evaluasi | ❌ | Uncomment & bangun logic insert `Notifikasi` pada fungsi `tambahEvaluasi` di monitoring. | `monitoringController.js` |
| 4 | Backend Controller/Route | Fungsi get riwayat evaluasi | ❌ | Buat fungsi GET `getRiwayatEvaluasi` untuk Ketua Pokja dan daftarkan ke monitoring/evaluasi route. | `monitoringController.js`, `monitoringRoutes.js` |
| 5 | App.jsx (Route) | /pokja/evaluasi/riwayat | ❌ | Tambahkan route ini & tautkan ke halaman React yang relevan untuk menampilkan histori. | `App.jsx` |
| 6 | Backend Controller | Filter get all kegiatan bulan/tahun | ⚠️ | Controller `getDaftarKegiatan` mengambil *seluruh data tanpa batasan*. Beri filter opsional by `req.query.bulan / tahun`. | `kegiatanController.js` |
| 7 | Backend Controller | Cek validasi seluruh baris form absensi | ⚠️ | Di `inputKehadiran()`, hitung jumlah baris mahasiswa di form terhadap jumlah absen kehadiran. | `kegiatanController.js` |
| 8 | Frontend API (`api.js`) | Handle error 401 dan redirect /login | ⚠️ | Buatkan utilitas penanganan fetch untuk menendang user ke `/login` jika respons server adalah 401 Unauthorized. | `api.js` |

*Sisa item `❌` pada Frontend App.jsx (seperti `/mahasiswa/izin/ajukan`, `/fasilitator/kegiatan/tambah`) dan Endpoint dengan penamaan beda asumsikan akan ditangani melalui **User Interface Component (Modal/Drawer)** dan bukan permasalahan routing krusial yang memerlukan perombakan mendasar melainkan sudah didesain seperti itu dari sebelum review.*

### Rekomendasi Urutan Fix
1. **Core Database (Storage/Upload - No.1 & 2):** Multer perlu disesuaikan agar tak menolak file `application/pdf` ketika mahasiswa meng-upload surat izin di halaman Frontend.
2. **Keutuhan Alur Workflow (Evaluasi & Rekap - No.3, 4, & 5):** Selesaikan logic notifikasi & riwayat Ketua Pokja karena itu merupakan elemen penilaian krusial SIMBIMA yang belum memiliki sambungan API.
3. **Optimisasi Validasi Payload (No.6, 7 & 8):** Filter bulanan, validasi form barisan absensi dan redirect `401` diperlukan guna meminimalisir kesalahan performa / input di tingkat produksi.