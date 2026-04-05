import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetKegiatan } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';

// ─── Ikon untuk menu sidebar ───────────────────────────────────────────────
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/dashboard/mahasiswa', label: 'Dashboard', icon: <IconHome /> },
  { path: '/dashboard/mahasiswa/kegiatan', label: 'Kegiatan', icon: <IconCalendar /> },
  { path: '/dashboard/mahasiswa/izin', label: 'Perizinan', icon: <IconFile /> },
];

// ─── Komponen kartu statistik (animated) ───────────────────────────────────
function StatCard({ label, value, icon, color, sub, delay = 0 }) {
  const animatedValue = useCountUp(value);
  return (
    <div className={`stat-card card-animate card-animate-${delay + 1}`}
      style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
    >
      <div className="icon-container" style={{
        width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
      }}>
        {icon}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>{label}</div>
        <div style={{ color: '#1e293b', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{animatedValue}</div>
        {sub && <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Badge status kegiatan ─────────────────────────────────────────────────
function BadgeStatus({ status }) {
  const map = {
    TERJADWAL:   { label: 'Terjadwal',   bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    BERLANGSUNG: { label: 'Berlangsung', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    SELESAI:     { label: 'Selesai',     bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    DIBATALKAN:  { label: 'Dibatalkan',  bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: '11px',
      fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
      border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
}

// ─── Format tanggal Indonesia ──────────────────────────────────────────────
const formatTanggal = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

// ─── Komponen Utama ────────────────────────────────────────────────────────
function DashboardMahasiswa() {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const nama = localStorage.getItem('simbima_nama') || 'Mahasiswa';

  useEffect(() => {
    apiGetKegiatan()
      .then(res => {
        if (res.data) setKegiatan(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const kegiatanMendatang = kegiatan.filter(k => k.status_kegiatan === 'TERJADWAL');
  const kegiatanSelesai   = kegiatan.filter(k => k.status_kegiatan === 'SELESAI');

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '32px' }}>

        {/* Header */}
        <div className="section-animate" style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b', letterSpacing: '-0.4px' }}>
            Selamat Datang 👋
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Halo, <strong style={{ color: '#059669' }}>{nama}</strong>. Berikut ringkasan aktivitas kamu.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard
            label="Total Kegiatan"
            value={kegiatan.length}
            color="#10b981"
            sub="Semua kegiatan"
            delay={0}
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>}
          />
          <StatCard
            label="Akan Datang"
            value={kegiatanMendatang.length}
            color="#2563eb"
            sub="Perlu kehadiran"
            delay={1}
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
          />
          <StatCard
            label="Sudah Selesai"
            value={kegiatanSelesai.length}
            color="#7c3aed"
            sub="Riwayat kegiatan"
            delay={2}
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
        </div>

        {/* Tabel Kegiatan */}
        <div className="table-card card-animate card-animate-4">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Jadwal Kegiatan</h2>
            <span style={{ color: '#94a3b8', fontSize: '13px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>{kegiatan.length} kegiatan</span>
          </div>

          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton-shimmer" style={{ height: '48px', borderRadius: '8px' }} />
              ))}
            </div>
          ) : kegiatan.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Belum ada kegiatan terdaftar</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Kegiatan akan muncul setelah fasilitator menambahkan jadwal</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Kegiatan', 'Tanggal', 'Jenis', 'Lokasi', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kegiatan.map((k, i) => (
                    <tr key={k.id_kegiatan}
                      className="table-row row-animate"
                      style={{ animationDelay: `${0.05 * i}s` }}
                    >
                      <td style={{ padding: '14px 20px', color: '#1e293b', fontWeight: '500' }}>{k.nama_kegiatan}</td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>{formatTanggal(k.tanggal_kegiatan)}</td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>{k.jenis_kegiatan.replace('_', ' ')}</td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>{k.lokasi}</td>
                      <td style={{ padding: '14px 20px' }}><BadgeStatus status={k.status_kegiatan} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

export default DashboardMahasiswa;
