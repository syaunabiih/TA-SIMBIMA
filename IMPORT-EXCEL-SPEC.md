# IMPORT-EXCEL-SPEC.md — SIMBIMA
# Fitur Import Excel Mahasiswa (Fasilitator)

---

## 1. Tujuan

Fasilitator dapat menginput data mahasiswa baru secara massal
melalui file Excel, tanpa harus input satu per satu.

---

## 2. Alur Pengguna

1. Fasilitator klik "Download Template" → dapat file xlsx kosong.
2. Fasilitator isi data mahasiswa di Excel.
3. Fasilitator klik "Import Excel" → pilih file.
4. Sistem validasi dan tampilkan preview.
5. Fasilitator klik "Konfirmasi Import".
6. Sistem simpan semua data yang valid.

---

## 3. Layout Halaman Daftar Mahasiswa

Tambah 2 tombol di sebelah "+ Tambah Mahasiswa":
- Tombol "Import Excel" (icon upload)
- Tombol "Download Template" (icon download)

---

## 4. Format Template Excel

Kolom yang harus ada di file template:
| NIM | Nama Lengkap | Email | Lantai | Nomor Kamar | Fakultas | Jurusan | Alamat Asal | No. Telp |

Contoh data:
| 23F10101 | Bagas Santoso | 23f10101@student.unand.ac.id | 1 | A01 | Teknik | Teknik Sipil | Padang | 08xxx |

Kolom wajib: NIM, Nama Lengkap, Email, Lantai, Nomor Kamar
Kolom opsional: Fakultas, Jurusan, Alamat Asal, No. Telp

---

## 5. Backend

### 5.1 Library
Gunakan: npm install xlsx

### 5.2 Endpoint Import
POST /api/fasilitator/mahasiswa/import
- Terima file .xlsx / .xls (multipart/form-data)
- Parse setiap baris
- Validasi per baris:
  * NIM tidak boleh kosong
  * NIM wajib unik (cek di DB)
  * Email tidak boleh kosong
  * Email wajib unik (cek di DB)
  * Lantai dan Nomor Kamar wajib diisi
- Set otomatis untuk semua baris valid:
  * gedungId = gedung fasilitator yang sedang login
  * mustChangePassword = true
  * statusAsrama = AKTIF
  * tahunAkademikId = tahun akademik aktif saat ini
  * password awal = NIM (di-hash dengan bcrypt)
- Response format:
  {
    berhasil: number,
    gagal: number,
    errors: [{ baris: number, nim: string, pesan: string }]
  }

### 5.3 Endpoint Download Template
GET /api/fasilitator/mahasiswa/template
- Generate file xlsx dengan header kolom yang benar
- Sertakan 1 baris contoh data
- Return sebagai file download (.xlsx)

---

## 6. Frontend

### 6.1 Modal Import Excel
Tampil saat klik tombol "Import Excel":
1. Input upload file (accept: .xlsx, .xls)
2. Setelah file dipilih, tampilkan preview tabel:
   - Kolom: No | NIM | Nama | Email | Kamar | Status
   - Baris valid: highlight hijau
   - Baris error: highlight merah + pesan error
3. Tampilkan ringkasan: "X baris valid, Y baris error"
4. Tombol "Konfirmasi Import":
   - Aktif hanya jika minimal 1 baris valid
   - Hanya baris valid yang disimpan, baris error dilewati
5. Setelah selesai, tampilkan notifikasi hasil
6. Refresh tabel daftar mahasiswa

### 6.2 Tombol Download Template
- Langsung trigger download file template xlsx
- Tanpa modal tambahan

---

## 7. Validasi Error

| Kondisi | Pesan Error |
|---|---|
| NIM kosong | NIM tidak boleh kosong |
| NIM sudah terdaftar | NIM sudah digunakan |
| Email kosong | Email tidak boleh kosong |
| Email sudah terdaftar | Email sudah digunakan |
| Lantai kosong | Lantai tidak boleh kosong |
| Nomor kamar kosong | Nomor kamar tidak boleh kosong |

---

## 8. Instruksi untuk AI Agent

Baca dokumen ini lalu implementasikan:
1. Install library xlsx di backend.
2. Buat endpoint POST import dan GET template.
3. Tambah tombol Import dan Download Template di DaftarMahasiswaFasilitator.
4. Buat modal preview dengan highlight valid/error.
5. Gunakan komponen modal dan tabel yang sudah ada di proyek.