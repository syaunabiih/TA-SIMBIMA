import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetKegiatan } from '../../utils/api';

// ─── Ikon untuk menu sidebar ───────────────────────────────────────────────
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/dashboard/mahasiswa', label: 'Dashboard', icon: <IconHome /> },
  { path: '/dashboard/mahasiswa/kegiatan', label: 'Kegiatan', icon: <IconCalendar /> },
  { path: '/dashboard/mahasiswa/izin', label: 'Perizinan', icon: <IconFile /> },
];

// ─── Komponen kartu statistik ──────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>{label}</div>
        <div style={{ color: 'white', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>{value}</div>
        {sub && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Badge status kegiatan ─────────────────────────────────────────────────
function BadgeStatus({ status }) {
  const map = {
    TERJADWAL:   { label: 'Terjadwal',   bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
    BERLANGSUNG: { label: 'Berlangsung', bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    SELESAI:     { label: 'Selesai',     bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
    DIBATALKAN:  { label: 'Dibatalkan',  bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
  };
  const s = map[status] || { label: status, bg: 'rgba(255,255,255,0.1)', color: 'white' };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: '11px',
      fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
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
    // Ambil data kegiatan dari API saat halaman pertama kali dimuat
    apiGetKegiatan()
      .then(res => {
        if (res.data) setKegiatan(res.data);
      })
      .finally(() => setLoading(false));
  }, []); // [] artinya hanya dijalankan sekali saat komponen mount

  const kegiatanMendatang = kegiatan.filter(k => k.status_kegiatan === 'TERJADWAL');
  const kegiatanSelesai   = kegiatan.filter(k => k.status_kegiatan === 'SELESAI');

  return (
    <DashboardLayout menuItems={MENU}>
      <div style={{ padding: '32px', color: 'white' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'white', letterSpacing: '-0.4px' }}>
            Selamat Datang 👋
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
            Halo, <strong style={{ color: '#10b981' }}>{nama}</strong>. Berikut ringkasan aktivitas kamu.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard
            label="Total Kegiatan"
            value={kegiatan.length}
            color="#10b981"
            sub="Semua kegiatan"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>}
          />
          <StatCard
            label="Akan Datang"
            value={kegiatanMendatang.length}
            color="#60a5fa"
            sub="Perlu kehadiran"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
          />
          <StatCard
            label="Sudah Selesai"
            value={kegiatanSelesai.length}
            color="#a78bfa"
            sub="Riwayat kegiatan"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
        </div>

        {/* Tabel Kegiatan */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Jadwal Kegiatan</h2>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{kegiatan.length} kegiatan</span>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '14px' }}>Memuat data...</div>
            </div>
          ) : kegiatan.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px' }}>Belum ada kegiatan terdaftar</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Kegiatan', 'Tanggal', 'Jenis', 'Lokasi', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kegiatan.map((k, i) => (
                    <tr key={k.id_kegiatan} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', color: 'white', fontWeight: '500' }}>{k.nama_kegiatan}</td>
                      <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.6)' }}>{formatTanggal(k.tanggal_kegiatan)}</td>
                      <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.6)' }}>{k.jenis_kegiatan.replace('_', ' ')}</td>
                      <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.6)' }}>{k.lokasi}</td>
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
