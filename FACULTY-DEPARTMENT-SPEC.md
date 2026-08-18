# FACULTY-DEPARTMENT-SPEC.md — SIMBIMA
# Master Data Fakultas dan Departemen/Jurusan

Dokumen ini menjadi acuan prompt untuk menambahkan master data Fakultas dan Departemen/Jurusan ke sistem SIMBIMA.

---

## 1. Tujuan

Tambahkan master data baru agar data mahasiswa tidak diinput manual berulang kali dan agar relasi akademik tersimpan rapi di database.

Master data yang dibutuhkan:
- Fakultas
- Departemen/Jurusan

---

## 2. Konsep Data

### 2.1 Fakultas
Daftar fakultas Universitas Andalas disimpan sebagai master data terpisah.

Contoh data:
- Teknik
- Hukum
- Pertanian
- Kedokteran
- MIPA
- Ekonomi dan Bisnis
- Peternakan
- Ilmu Budaya
- ISIP
- Farmasi
- Teknologi Pertanian
- Kesehatan Masyarakat
- Keperawatan
- Teknologi Informasi
- Kedokteran Gigi

### 2.2 Departemen/Jurusan
Departemen/Jurusan disimpan sebagai master data terpisah dan memiliki relasi ke fakultas.

Contoh:
- Teknik Sipil → Teknik
- Teknik Mesin → Teknik
- Hukum → Hukum
- Agribisnis → Pertanian
- Sistem Informasi → Teknologi Informasi
- Ilmu Gizi → Kesehatan Masyarakat

---

## 3. Struktur Database yang Disarankan

### 3.1 Model Fakultas
```prisma
model Fakultas {
  id          Int           @id @default(autoincrement())
  nama        String        @unique
  departemen  Departemen[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

### 3.2 Model Departemen
```prisma
model Departemen {
  id          Int       @id @default(autoincrement())
  nama        String
  fakultasId  Int
  fakultas    Fakultas  @relation(fields: [fakultasId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([nama, fakultasId])
}
```

### 3.3 Relasi Mahasiswa
Jika diperlukan, tambahkan relasi ke tabel mahasiswa:
```prisma
model Mahasiswa {
  id            Int         @id @default(autoincrement())
  ...
  fakultasId     Int?
  fakultas      Fakultas?   @relation(fields: [fakultasId], references: [id])
  departemenId   Int?
  departemen    Departemen? @relation(fields: [departemenId], references: [id])
}
```

---

## 4. Endpoint API yang Dibutuhkan

### 4.1 Fakultas
- `GET /api/admin/fakultas`
- `POST /api/admin/fakultas`
- `PUT /api/admin/fakultas/:id`
- `DELETE /api/admin/fakultas/:id`

### 4.2 Departemen/Jurusan
- `GET /api/admin/departemen`
- `POST /api/admin/departemen`
- `PUT /api/admin/departemen/:id`
- `DELETE /api/admin/departemen/:id`

### 4.3 Relasi data
- `GET /api/admin/departemen/by-fakultas/:fakultasId`
  - untuk dropdown departemen yang mengikuti fakultas yang dipilih

---

## 5. Validasi

### Fakultas
- Nama fakultas wajib unik.
- Nama tidak boleh kosong.
- Tidak bisa dihapus jika masih digunakan mahasiswa atau departemen.

### Departemen/Jurusan
- Nama departemen wajib diisi.
- Harus terhubung ke satu fakultas.
- Tidak bisa duplikat pada fakultas yang sama.
- Tidak bisa dihapus jika masih digunakan mahasiswa.

---

## 6. Frontend

### 6.1 Master Data Page
Tambahkan tab baru:
- Tab Fakultas
- Tab Departemen/Jurusan

### 6.2 Tab Fakultas
Tabel:
- Nama Fakultas
- Aksi: Edit / Hapus

Form modal:
- Nama Fakultas

### 6.3 Tab Departemen/Jurusan
Tabel:
- Nama Departemen
- Fakultas
- Aksi: Edit / Hapus

Form modal:
- Nama Departemen
- Dropdown Fakultas

### 6.4 Form Mahasiswa
Gunakan dropdown bertingkat:
1. Pilih Fakultas
2. Departemen menyesuaikan fakultas yang dipilih

---

## 7. Seed Data

Tambahkan seed awal untuk:
- 15 Fakultas
- 49 Departemen/Jurusan sesuai daftar yang sudah diberikan user

Gunakan data seed ini sebagai master awal agar sistem langsung siap dipakai.

---

## 8. Instruksi untuk AI Agent

Jika diminta mengerjakan master data fakultas dan departemen, baca dokumen ini lalu:
1. Update schema Prisma.
2. Tambahkan endpoint CRUD.
3. Tambahkan tab Master Data di frontend.
4. Tambahkan seed data awal.
5. Pastikan relasi mahasiswa ke fakultas/departemen berjalan dengan benar.