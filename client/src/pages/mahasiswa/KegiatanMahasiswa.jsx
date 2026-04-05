import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetKegiatan } from '../../utils/api';

const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/dashboard/mahasiswa', label: 'Dashboard', icon: <IconHome /> },
  { path: '/dashboard/mahasiswa/kegiatan', label: 'Kegiatan', icon: <IconCalendar /> },
  { path: '/dashboard/mahasiswa/izin', label: 'Perizinan', icon: <IconFile /> },
];

function BadgeStatus({ status }) {
  const map = {
    TERJADWAL:   { label: 'Terjadwal',   bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    BERLANGSUNG: { label: 'Berlangsung', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    SELESAI:     { label: 'Selesai',     bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    DIBATALKAN:  { label: 'Dibatalkan',  bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${s.border}` }}>{s.label}</span>;
}

const formatTanggal = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

function KegiatanMahasiswa() {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('SEMUA');

  useEffect(() => {
    apiGetKegiatan()
      .then(res => { if (res.data) setKegiatan(res.data); })
      .finally(() => setLoading(false));
  }, []);

  const FILTERS = ['SEMUA', 'TERJADWAL', 'BERLANGSUNG', 'SELESAI', 'DIBATALKAN'];
  const filtered = filter === 'SEMUA' ? kegiatan : kegiatan.filter(k => k.status_kegiatan === filter);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '32px' }}>

        {/* Header */}
        <div className="section-animate" style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Jadwal Kegiatan</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Daftar semua kegiatan pembinaan yang dijadwalkan untukmu.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="card-animate card-animate-1" style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: '20px', border: '1px solid',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: filter === f ? '#10b981' : '#ffffff',
              color: filter === f ? '#ffffff' : '#64748b',
              borderColor: filter === f ? '#10b981' : '#e2e8f0',
            }}>{f === 'SEMUA' ? '📋 Semua' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
          ))}
        </div>

        {/* Tabel */}
        <div className="table-card card-animate card-animate-2">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Daftar Kegiatan</h2>
            <span style={{ color: '#94a3b8', fontSize: '13px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
              {filtered.length} kegiatan
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer" style={{ height: '50px', borderRadius: '8px' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Tidak ada kegiatan ditemukan</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Coba ubah filter atau cek kembali nanti.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Kegiatan', 'Tanggal', 'Waktu', 'Jenis', 'Lokasi', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((k, i) => (
                    <tr key={k.id_kegiatan} className="table-row row-animate" style={{ animationDelay: `${0.04 * i}s` }}>
                      <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{i + 1}</td>
                      <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: '500' }}>{k.nama_kegiatan}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{formatTanggal(k.tanggal_kegiatan)}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>
                        {new Date(k.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} – {new Date(k.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{k.jenis_kegiatan.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{k.lokasi}</td>
                      <td style={{ padding: '14px 16px' }}><BadgeStatus status={k.status_kegiatan} /></td>
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

export default KegiatanMahasiswa;
