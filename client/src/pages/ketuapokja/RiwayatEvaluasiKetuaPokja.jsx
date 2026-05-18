import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
// import { apiGetRiwayatEvaluasi } from '../../utils/api'; // (Belum ada di api.js, tapi disiapkan untuk future)

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconChart    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconClipboard= () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2"/><rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/pokja/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { path: '/pokja/monitoring', label: 'Monitoring', icon: <IconChart /> },
  { path: '/pokja/evaluasi', label: 'Evaluasi', icon: <IconClipboard /> },
  { path: '/pokja/evaluasi/riwayat', label: 'Riwayat Evaluasi', icon: <IconClipboard /> },
];

function RiwayatEvaluasiKetuaPokja() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Simulasi Fetch Data Riwayat Evaluasi
    // fetch GET /api/evaluasi
    // const fetchData = async () => { ... }
  }, []);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter page-content">
        <div className="section-animate" style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Riwayat Evaluasi</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Histori evaluasi yang pernah dibuat untuk fasilitator asrama.</p>
        </div>

        <div className="stat-card card-animate" style={{ padding: '28px' }}>
          <p style={{ color: '#64748b' }}>Data riwayat evaluasi akan ditampilkan di sini.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default RiwayatEvaluasiKetuaPokja;
