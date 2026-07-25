import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAutoLogout from './hooks/useAutoLogout';

// Import halaman-halaman
import LoginPage from './pages/auth/LoginPage';
import LupaPasswordPage from './pages/auth/LupaPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import FirstLoginPasswordPage from './pages/auth/FirstLoginPasswordPage';
import ProfilUser from './pages/profil/ProfilUser';

// Mahasiswa
import DashboardMahasiswa from './pages/mahasiswa/DashboardMahasiswa';
import KegiatanMahasiswa from './pages/mahasiswa/KegiatanMahasiswa';
import PerizinanMahasiswa from './pages/mahasiswa/PerizinanMahasiswa';
import IzinDetailPage from './pages/mahasiswa/IzinDetailPage';
import RekapMahasiswa from './pages/mahasiswa/RekapMahasiswa';
import NotifikasiMahasiswa from './pages/mahasiswa/NotifikasiMahasiswa';

// Fasilitator
import DashboardFasilitator from './pages/fasilitator/DashboardFasilitator';
import KelolaKegiatanFasilitator from './pages/fasilitator/KelolaKegiatanFasilitator';
import ValidasiIzinFasilitator from './pages/fasilitator/ValidasiIzinFasilitator';
import RekapFasilitator from './pages/fasilitator/RekapFasilitator';
import GenerateRekapFasilitator from './pages/fasilitator/GenerateRekapFasilitator';
import DetailRekapFasilitator from './pages/fasilitator/DetailRekapFasilitator';
import NotifikasiFasilitator from './pages/fasilitator/NotifikasiFasilitator';
import TambahKegiatanPage from './pages/fasilitator/TambahKegiatanPage';
import DetailKegiatanPage from './pages/fasilitator/DetailKegiatanPage';
import PerluPerhatianPage from './pages/fasilitator/PerluPerhatianPage';
import DaftarMahasiswaPage from './pages/fasilitator/DaftarMahasiswaPage';

// Superadmin
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard';
import MasterDataPage from './pages/superadmin/MasterDataPage';
import KelolaAkunPage from './pages/superadmin/KelolaAkunPage';
import MonitoringPage from './pages/superadmin/MonitoringPage';
import PerizinanReadOnlyPage from './pages/superadmin/PerizinanReadOnlyPage';
import DaftarMahasiswaReadOnlyPage from './pages/superadmin/DaftarMahasiswaReadOnlyPage';

// Import guard
import PrivateRoute from './components/PrivateRoute';

/**
 * AutoLogoutWatcher — Komponen pemantau sesi
 * Harus berada di dalam BrowserRouter agar bisa pakai useNavigate.
 * Berlaku untuk semua role (MAHASISWA, FASILITATOR, SUPERADMIN, dll).
 * - Logout otomatis jika token JWT expired
 * - Logout otomatis jika tidak ada aktivitas selama 24 jam
 */
function AutoLogoutWatcher() {
  useAutoLogout(1440); // 24 jam inaktivitas
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AutoLogoutWatcher />
      <Routes>
        {/* Halaman publik */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/lupa-password" element={<LupaPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/first-login" element={<FirstLoginPasswordPage />} />

        {/* ── PROFIL GLOBAL SEMUA ROLE ── */}
        <Route path="/profil" element={<PrivateRoute allowedRoles={['MAHASISWA', 'FASILITATOR', 'KETUA_POKJA', 'SUPERADMIN']}><ProfilUser /></PrivateRoute>} />

        {/* ── MAHASISWA ── */}
        <Route path="/mahasiswa/dashboard" element={
          <PrivateRoute allowedRoles={['MAHASISWA']}><DashboardMahasiswa /></PrivateRoute>
        } />
        <Route path="/mahasiswa/kehadiran" element={
          <PrivateRoute allowedRoles={['MAHASISWA']}><KegiatanMahasiswa /></PrivateRoute>
        } />
        <Route path="/mahasiswa/izin" element={
          <PrivateRoute allowedRoles={['MAHASISWA']}><PerizinanMahasiswa /></PrivateRoute>
        } />
        <Route path="/mahasiswa/izin/:id" element={
          <PrivateRoute allowedRoles={['MAHASISWA']}><IzinDetailPage /></PrivateRoute>
        } />
        <Route path="/mahasiswa/rekap" element={
          <PrivateRoute allowedRoles={['MAHASISWA']}><RekapMahasiswa /></PrivateRoute>
        } />
        <Route path="/mahasiswa/notifikasi" element={
          <PrivateRoute allowedRoles={['MAHASISWA']}><NotifikasiMahasiswa /></PrivateRoute>
        } />

        {/* ── FASILITATOR ── */}
        <Route path="/fasilitator/dashboard" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><DashboardFasilitator /></PrivateRoute>
        } />
        <Route path="/fasilitator/kegiatan" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><KelolaKegiatanFasilitator /></PrivateRoute>
        } />
        <Route path="/fasilitator/kegiatan/tambah" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><TambahKegiatanPage /></PrivateRoute>
        } />
        <Route path="/fasilitator/kegiatan/:id" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><DetailKegiatanPage /></PrivateRoute>
        } />
        <Route path="/fasilitator/perizinan" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><ValidasiIzinFasilitator /></PrivateRoute>
        } />
        <Route path="/fasilitator/kepulangan" element={
          <Navigate to="/fasilitator/perizinan?tab=kepulangan" replace />
        } />
        <Route path="/fasilitator/rekap" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><RekapFasilitator /></PrivateRoute>
        } />
        <Route path="/fasilitator/rekap/generate" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><GenerateRekapFasilitator /></PrivateRoute>
        } />
        <Route path="/fasilitator/rekap/:bulan" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><DetailRekapFasilitator /></PrivateRoute>
        } />
        <Route path="/fasilitator/rekap/:bulan/:tahun" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><DetailRekapFasilitator /></PrivateRoute>
        } />
        <Route path="/fasilitator/notifikasi" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><NotifikasiFasilitator /></PrivateRoute>
        } />
        <Route path="/fasilitator/perlu-perhatian" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><PerluPerhatianPage /></PrivateRoute>
        } />
        <Route path="/fasilitator/mahasiswa" element={
          <PrivateRoute allowedRoles={['FASILITATOR']}><DaftarMahasiswaPage /></PrivateRoute>
        } />

        {/* ── SUPERADMIN ── */}
        <Route path="/superadmin/dashboard" element={
          <PrivateRoute allowedRoles={['SUPERADMIN']}><SuperadminDashboard /></PrivateRoute>
        } />
        <Route path="/superadmin/master-data" element={
          <PrivateRoute allowedRoles={['SUPERADMIN']}><MasterDataPage /></PrivateRoute>
        } />
        <Route path="/superadmin/akun" element={
          <PrivateRoute allowedRoles={['SUPERADMIN']}><KelolaAkunPage /></PrivateRoute>
        } />
        <Route path="/superadmin/monitoring" element={
          <PrivateRoute allowedRoles={['SUPERADMIN']}><MonitoringPage /></PrivateRoute>
        } />
        <Route path="/superadmin/perizinan" element={
          <PrivateRoute allowedRoles={['SUPERADMIN']}><PerizinanReadOnlyPage /></PrivateRoute>
        } />
        <Route path="/superadmin/mahasiswa" element={
          <PrivateRoute allowedRoles={['SUPERADMIN']}><DaftarMahasiswaReadOnlyPage /></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;