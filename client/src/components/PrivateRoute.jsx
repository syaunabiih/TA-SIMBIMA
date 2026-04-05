import { Navigate } from 'react-router-dom';

/**
 * PrivateRoute — Komponen penjaga halaman
 *
 * Cara kerja:
 * 1. Cek apakah ada token di localStorage
 * 2. Kalau ADA → tampilkan halaman yang diminta (children)
 * 3. Kalau TIDAK ADA → redirect paksa ke halaman Login
 *
 * Penggunaan:
 * <PrivateRoute><DashboardMahasiswa /></PrivateRoute>
 */
function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('simbima_token');
  const role = localStorage.getItem('simbima_role');

  // Belum login → ke halaman login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Sudah login tapi role tidak sesuai → ke halaman login
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // Semua aman → tampilkan halaman
  return children;
}

export default PrivateRoute;
