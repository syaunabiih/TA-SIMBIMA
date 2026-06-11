/**
 * utils/api.js — Pusat semua komunikasi dengan server
 */

const BASE_URL = 'http://localhost:5000/api';

// Interceptor global untuk penanganan response 401 Unauthorized (Token Expired/Invalid)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    localStorage.removeItem('simbima_token');
    window.location.href = '/'; // Tendang balik ke halaman login awal
  }
  return response;
};

const getToken = () => localStorage.getItem('simbima_token');

const authHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const apiLogin = (identifier, password) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  }).then(res => res.json());

// ─── KEGIATAN ─────────────────────────────────────────────────────────────────

export const apiGetKegiatan = () =>
  fetch(`${BASE_URL}/kegiatan`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiBuatKegiatan = (data) =>
  fetch(`${BASE_URL}/kegiatan/buat`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiInputKehadiran = (data) =>
  fetch(`${BASE_URL}/kegiatan/absen`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiGetMahasiswaAsrama = () =>
  fetch(`${BASE_URL}/kegiatan/mahasiswa-asrama`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiGetTugasSaya = () =>
  fetch(`${BASE_URL}/kegiatan/tugas-saya`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiCekKelengkapanAbsensi = (id_kegiatan) =>
  fetch(`${BASE_URL}/kegiatan/${id_kegiatan}/cek-absensi`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiTutupPresensi = (id_kegiatan) =>
  fetch(`${BASE_URL}/kegiatan/${id_kegiatan}/tutup`, {
    method: 'PUT',
    headers: authHeader(),
  }).then(res => res.json());

export const apiAlfaOtomatis = (id_kegiatan) =>
  fetch(`${BASE_URL}/kegiatan/${id_kegiatan}/alfa-otomatis`, {
    method: 'POST',
    headers: authHeader(),
  }).then(res => res.json());

// ─── QR ABSENSI ───────────────────────────────────────────────────────────────

export const apiGetQrToken = (id_kegiatan) =>
  fetch(`${BASE_URL}/kegiatan/${id_kegiatan}/qr-token`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiScanQr = (qr_token) =>
  fetch(`${BASE_URL}/kegiatan/scan-qr`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ qr_token }),
  }).then(res => res.json());


export const apiInputKehadiranFasil = (data) =>
  fetch(`${BASE_URL}/kegiatan/kehadiran`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiEditKehadiranFasil = (id_kehadiran, status_kehadiran) =>
  fetch(`${BASE_URL}/kegiatan/kehadiran/${id_kehadiran}`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify({ status_kehadiran }),
  }).then(res => res.json());


// ─── PERIZINAN ────────────────────────────────────────────────────────────────

export const apiGetIzin = () =>
  fetch(`${BASE_URL}/izin`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiAjukanIzin = (data) => {
  const isFormData = data instanceof FormData;
  const headers = authHeader();
  if (isFormData) {
    delete headers['Content-Type'];
  }

  return fetch(`${BASE_URL}/izin/ajukan`, {
    method: 'POST',
    headers: headers,
    body: isFormData ? data : JSON.stringify(data),
  }).then(res => res.json());
};

export const apiBatalkanIzin = (id_perizinan) =>
  fetch(`${BASE_URL}/izin/${id_perizinan}/batalkan`, {
    method: 'PATCH',
    headers: authHeader(),
  }).then(res => res.json());

export const apiValidasiIzin = (id_perizinan, data) =>
  fetch(`${BASE_URL}/izin/validasi/${id_perizinan}`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiKonfirmasiIzin = (data) =>
  fetch(`${BASE_URL}/izin/konfirmasi`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiGetIzinDetail = (id) =>
  fetch(`${BASE_URL}/izin/${id}`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiUploadFotoBerangkat = (id, formData) => {
  const headers = authHeader();
  delete headers['Content-Type'];
  return fetch(`${BASE_URL}/izin/${id}/foto-berangkat`, {
    method: 'POST',
    headers,
    body: formData,
  }).then(res => res.json());
};

export const apiUploadFotoPulang = (id, formData) => {
  const headers = authHeader();
  delete headers['Content-Type'];
  return fetch(`${BASE_URL}/izin/${id}/foto-pulang`, {
    method: 'POST',
    headers,
    body: formData,
  }).then(res => res.json());
};

export const apiGetTotalHariBulanIni = (id_mahasiswa) =>
  fetch(`${BASE_URL}/izin/mahasiswa/${id_mahasiswa}/total-bulan-ini`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiGetIzinSummary = () =>
  fetch(`${BASE_URL}/izin/summary`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiKonfirmasiKembali = (id_perizinan) =>
  fetch(`${BASE_URL}/izin/${id_perizinan}/konfirmasi-kembali`, {
    method: 'PATCH',
    headers: authHeader(),
  }).then(res => res.json());

// ─── MONITORING ───────────────────────────────────────────────────────────────

export const apiGetDashboardStats = () =>
  fetch(`${BASE_URL}/monitoring/dashboard`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiGetKehadiranPerGedung = () =>
  fetch(`${BASE_URL}/admin/dashboard/kehadiran-per-gedung`, {
    headers: authHeader(),
  }).then(res => res.json());

// Dashboard agregasi per role
export const apiGetDashboardFasilitator = () =>
  fetch(`${BASE_URL}/dashboard/fasilitator`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiGetDashboardMahasiswa = () =>
  fetch(`${BASE_URL}/dashboard/mahasiswa`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiGetPerluPerhatian = (tipe = 'ALL') =>
  fetch(`${BASE_URL}/dashboard/fasilitator/perlu-perhatian?tipe=${tipe}`, {
    headers: authHeader(),
  }).then(res => res.json());


export const apiTambahEvaluasi = (data) =>
  fetch(`${BASE_URL}/monitoring/evaluasi`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

// ─── REKAP ABSENSI ────────────────────────────────────────────────────────────

export const apiGenerateRekap = (data) =>
  fetch(`${BASE_URL}/rekap/generate`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiPublikasiRekap = (data) =>
  fetch(`${BASE_URL}/rekap/publikasi`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiGetRekapFasilitator = () =>
  fetch(`${BASE_URL}/rekap/fasilitator`, {
    headers: authHeader(),
  }).then(res => res.json());

// Jika tahun tidak diberikan, bulan dianggap tanggal_mulai (YYYY-MM-DD)
export const apiGetRekapDetail = (bulan, tahun) =>
  fetch(`${BASE_URL}/rekap/fasilitator/${bulan}${tahun ? `/${tahun}` : ''}`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiGetRekapMahasiswa = () =>
  fetch(`${BASE_URL}/rekap/mahasiswa`, {
    headers: authHeader(),
  }).then(res => res.json());

// ─── PROFIL & LUPA PASSWORD ────────────────────────────────────────────────────────

export const apiGetProfil = () =>
  fetch(`${BASE_URL}/auth/profil`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiUpdateProfil = (data) =>
  fetch(`${BASE_URL}/auth/profil`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiChangePassword = (data) =>
  fetch(`${BASE_URL}/auth/profil/password`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiLupaPassword = (data) =>
  fetch(`${BASE_URL}/auth/lupa-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiResetPassword = (data) =>
  fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiTandaiSemuaDibaca = () =>
  fetch(`${BASE_URL}/notifikasi/tandai-semua`, {
    method: 'PUT',
    headers: authHeader(),
  }).then(res => res.json());

export const apiGetNotifikasi = () =>
  fetch(`${BASE_URL}/notifikasi`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiTandaiDibaca = (id_notifikasi) =>
  fetch(`${BASE_URL}/notifikasi/${id_notifikasi}/baca`, {
    method: 'PUT',
    headers: authHeader(),
  }).then(res => res.json());
