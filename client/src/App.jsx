import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import halaman-halaman
import LoginPage from './pages/auth/LoginPage';
import DashboardMahasiswa from './pages/mahasiswa/DashboardMahasiswa';
import DashboardFasilitator from './pages/fasilitator/DashboardFasilitator';
import DashboardKetuaPokja from './pages/ketuapokja/DashboardKetuaPokja';

// Import guard
import PrivateRoute from './components/PrivateRoute';

/**
 * App.jsx — Pusat konfigurasi routing
 *
 * Cara baca:
 * - <BrowserRouter> → membungkus seluruh app agar bisa pakai routing
 * - <Routes> → tempat mendaftarkan semua route
 * - <Route path="/" element={...}> → kalau URL = "/" tampilkan komponen ini
 * - <PrivateRoute> → hanya bisa diakses kalau sudah login
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman publik — bisa diakses tanpa login */}
        <Route path="/" element={<LoginPage />} />

        {/* Halaman Mahasiswa — hanya role MAHASISWA */}
        <Route
          path="/dashboard/mahasiswa"
          element={
            <PrivateRoute allowedRoles={['MAHASISWA']}>
              <DashboardMahasiswa />
            </PrivateRoute>
          }
        />

        {/* Halaman Fasilitator — hanya role FASILITATOR */}
        <Route
          path="/dashboard/fasilitator"
          element={
            <PrivateRoute allowedRoles={['FASILITATOR']}>
              <DashboardFasilitator />
            </PrivateRoute>
          }
        />

        {/* Halaman Ketua Pokja — hanya role KETUA_POKJA */}
        <Route
          path="/dashboard/ketua-pokja"
          element={
            <PrivateRoute allowedRoles={['KETUA_POKJA']}>
              <DashboardKetuaPokja />
            </PrivateRoute>
          }
        />

        {/* Fallback — URL tidak dikenal → ke halaman login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;