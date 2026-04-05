/**
 * utils/api.js — Pusat semua komunikasi dengan server
 *
 * Konsep yang dipakai:
 * - BASE_URL: alamat server, kalau ganti cukup ubah di sini
 * - getToken(): ambil token dari localStorage untuk dikirim ke server
 * - authHeader(): membuat header Authorization yang diperlukan
 * - Setiap fungsi = 1 endpoint API
 */

const BASE_URL = 'http://localhost:5000/api';

// Ambil token yang disimpan saat login
const getToken = () => localStorage.getItem('simbima_token');

// Header standar untuk request yang butuh autentikasi
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

// ─── PERIZINAN ────────────────────────────────────────────────────────────────

export const apiAjukanIzin = (data) =>
  fetch(`${BASE_URL}/izin/ajukan`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

export const apiValidasiIzin = (id_perizinan, data) =>
  fetch(`${BASE_URL}/izin/validasi/${id_perizinan}`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());

// ─── MONITORING ───────────────────────────────────────────────────────────────

export const apiGetDashboardStats = () =>
  fetch(`${BASE_URL}/monitoring/dashboard`, {
    headers: authHeader(),
  }).then(res => res.json());

export const apiTambahEvaluasi = (data) =>
  fetch(`${BASE_URL}/monitoring/evaluasi`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data),
  }).then(res => res.json());
