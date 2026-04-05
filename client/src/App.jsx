import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import halaman-halaman
import LoginPage from './pages/auth/LoginPage';

// Mahasiswa
import DashboardMahasiswa from './pages/mahasiswa/DashboardMahasiswa';
import KegiatanMahasiswa from './pages/mahasiswa/KegiatanMahasiswa';
import PerizinanMahasiswa from './pages/mahasiswa/PerizinanMahasiswa';

// Fasilitator
import DashboardFasilitator from './pages/fasilitator/DashboardFasilitator';
import KelolaKegiatanFasilitator from './pages/fasilitator/KelolaKegiatanFasilitator';
import ValidasiIzinFasilitator from './pages/fasilitator/ValidasiIzinFasilitator';

// Ketua Pokja
import DashboardKetuaPokja from './pages/ketuapokja/DashboardKetuaPokja';
import MonitoringKetuaPokja from './pages/ketuapokja/MonitoringKetuaPokja';
import EvaluasiKetuaPokja from './pages/ketuapokja/EvaluasiKetuaPokja';

// Import guard
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman publik */}
        <Route path="/" element={<LoginPage />} />

        {/* ── MAHASISWA ── */}
        <Route path="/dashboard/mahasiswa" element={
          <PrivateRoute allowedRoles={['MAHASISWA']}><DashboardMahasiswa /></PrivateRoute>
        } />
        <Route path="/dashboard/mahasiswa/kegiatan" element={
          <PrivateRoute allowedRoles={['MAHASISWA']}><KegiatanMahasiswa /></PrivateRoute>
        } />
        <Route path="/dashboard/mahasiswa/izin" element={
          <PrivateRoute allowedRoles={['MAHASISWA']}><PerizinanMahasiswa /></PrivateRoute>
        } />

        {/* ── FASILITATOR ── */}
        <Route path="/dashboard/fasilitator" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><DashboardFasilitator /></PrivateRoute>
        } />
        <Route path="/dashboard/fasilitator/kegiatan" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><KelolaKegiatanFasilitator /></PrivateRoute>
        } />
        <Route path="/dashboard/fasilitator/izin" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><ValidasiIzinFasilitator /></PrivateRoute>
        } />

        {/* ── KETUA POKJA ── */}
        <Route path="/dashboard/ketua-pokja" element={
          <PrivateRoute allowedRoles={['KETUA_POKJA']}><DashboardKetuaPokja /></PrivateRoute>
        } />
        <Route path="/dashboard/ketua-pokja/monitoring" element={
          <PrivateRoute allowedRoles={['KETUA_POKJA']}><MonitoringKetuaPokja /></PrivateRoute>
        } />
        <Route path="/dashboard/ketua-pokja/evaluasi" element={
          <PrivateRoute allowedRoles={['KETUA_POKJA']}><EvaluasiKetuaPokja /></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;