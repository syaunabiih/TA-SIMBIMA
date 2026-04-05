import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetDashboardStats } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconChart    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconClipboard= () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2"/><rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/dashboard/ketua-pokja', label: 'Dashboard', icon: <IconHome /> },
  { path: '/dashboard/ketua-pokja/monitoring', label: 'Monitoring', icon: <IconChart /> },
  { path: '/dashboard/ketua-pokja/evaluasi', label: 'Evaluasi', icon: <IconClipboard /> },
];

function StatCard({ label, value, color, icon, desc, delay = 0 }) {
  const animated = useCountUp(value);
  return (
    <div className={`stat-card card-animate card-animate-${delay + 1}`}
      style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>{label}</div>
          <div style={{ color: '#1e293b', fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>{value != null ? animated : '—'}</div>
          {desc && <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{desc}</div>}
        </div>
        <div className="icon-container" style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: `${color}15`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color,
        }}>{icon}</div>
      </div>
      {/* Animated accent bar */}
      <div className="accent-bar-animate" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />
    </div>
  );
}

function DashboardKetuaPokja() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const nama = localStorage.getItem('simbima_nama') || 'Ketua Pokja';

  useEffect(() => {
    apiGetDashboardStats()
      .then(res => {
        if (res.data?.statistik) setStats(res.data.statistik);
        else setError(res.message || 'Gagal memuat data.');
      })
      .catch(() => setError('Tidak bisa terhubung ke server.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '32px' }}>

        {/* Header */}
        <div className="section-animate" style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b', letterSpacing: '-0.4px' }}>
            Monitoring Pembinaan
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Halo, <strong style={{ color: '#059669' }}>{nama}</strong>. Pantau perkembangan di sini.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert-modern" style={{
            marginBottom: '24px',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626',
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading State — shimmer skeletons */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton-shimmer" style={{ height: '130px' }} />
            ))}
          </div>
        ) : (
          /* Stat Cards */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <StatCard
              label="Mahasiswa Aktif"
              value={stats?.total_mahasiswa_aktif}
              color="#10b981"
              desc="Status hunian: Aktif"
              delay={0}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
            />
            <StatCard
              label="Total Kegiatan"
              value={stats?.total_kegiatan_pembinaan}
              color="#2563eb"
              desc="Seluruh kegiatan pembinaan"
              delay={1}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
            />
            <StatCard
              label="Izin Menunggu"
              value={stats?.izin_menunggu_validasi}
              color="#d97706"
              desc="Perlu validasi fasilitator"
              delay={2}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
            />
            <StatCard
              label="Izin Berjalan"
              value={stats?.izin_sedang_berjalan}
              color="#7c3aed"
              desc="Sedang di luar asrama"
              delay={3}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            />
          </div>
        )}

        {/* Info Card */}
        {!loading && !error && (
          <div className="info-card card-animate" style={{ animationDelay: '0.35s' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '600', color: '#047857' }}>
              💡 Panduan Penggunaan
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '13px', lineHeight: '1.8' }}>
              <li>Pantau jumlah mahasiswa aktif dan kegiatan pembinaan secara real-time</li>
              <li>Menu <strong style={{ color: '#1e293b' }}>Monitoring</strong> untuk melihat laporan kehadiran per gedung</li>
              <li>Menu <strong style={{ color: '#1e293b' }}>Evaluasi</strong> untuk mengirim catatan evaluasi ke fasilitator</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardKetuaPokja;
