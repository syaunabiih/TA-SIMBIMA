Baca SUPERADMIN-SPEC.md.

Kembalikan fitur Jenis Kegiatan ke sistem, tapi dengan 
struktur baru yang lebih sesuai kebutuhan asrama.

=== KONTEKS ===
Asrama Unand punya 7 gedung. Ada 2 tipe kegiatan:
- Wajib semua gedung: Shalat Subuh Berjamaah, Absen Malam
- Mandiri per gedung: kegiatan masing-masing fasilitator

=== BACKEND ===
Buat model baru di schema.prisma:

  model JenisKegiatan {
    id        Int        @id @default(autoincrement())
    nama      String     @unique
    isWajib   Boolean    @default(false)
    isAktif   Boolean    @default(true)
    kegiatan  KegiatanPembinaan[]
  }

Tambahkan relasi di model KegiatanPembinaan:
  jenisKegiatanId  Int?
  jenisKegiatan    JenisKegiatan? @relation(...)

Jalankan prisma migrate.

Seed default jenis kegiatan:
  - Shalat Subuh Berjamaah  (isWajib: true)
  - Absen Malam             (isWajib: true)
  - Kegiatan Pembinaan      (isWajib: false)
  - Kegiatan Kebersamaan    (isWajib: false)
  - Kegiatan AMA            (isWajib: false)

Endpoint:
  GET    /api/admin/jenis-kegiatan       → list semua
    (middleware: SUPERADMIN & FASILITATOR)
  POST   /api/admin/jenis-kegiatan       → tambah (SUPERADMIN)
  PUT    /api/admin/jenis-kegiatan/:id   → edit (SUPERADMIN)
  DELETE /api/admin/jenis-kegiatan/:id   → hapus (SUPERADMIN)
    (tolak jika sudah dipakai di kegiatan manapun → HTTP 409)

=== FRONTEND SUPERADMIN ===
1. MasterDataPage.jsx — Tambah kembali Tab 4: "Jenis Kegiatan"
   - Tabel: Nama | Wajib? | Status | Aksi (Edit/Hapus)
   - Badge khusus: "Wajib" (merah) untuk isWajib=true
   - Tombol "+ Tambah Jenis Kegiatan"
   - Modal form: Nama, Wajib? (toggle/checkbox), Status
   - Tidak bisa hapus jika sudah dipakai di kegiatan

=== FRONTEND FASILITATOR ===
2. TambahKegiatanPage.jsx & EditKegiatanPage.jsx
   - Tambah dropdown "Jenis Kegiatan" (fetch dari 
     GET /api/admin/jenis-kegiatan, tampilkan yang isAktif=true)
   - Tampilkan badge "Wajib" jika jenis yang dipilih isWajib=true

3. KelolaKegiatanFasilitator.jsx
   - Tambah kolom "Jenis" di tabel kegiatan
   - Tambah filter by jenis kegiatan

=== FRONTEND SUPERADMIN MONITORING ===
4. MonitoringPage.jsx
   - Tambah kembali kolom "Jenis Kegiatan" di tabel
   - Tambah filter by jenis kegiatan
   - Tambahkan filter tambahan: "Wajib / Mandiri"

Gunakan komponen modal, tabel, badge yang sudah ada.