import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetKegiatan } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconChart    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconClipboard= () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2"/><rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/dashboard/ketua-pokja', label: 'Dashboard', icon: <IconHome /> },
  { path: '/dashboard/ketua-pokja/monitoring', label: 'Monitoring', icon: <IconChart /> },
  { path: '/dashboard/ketua-pokja/evaluasi', label: 'Evaluasi', icon: <IconClipboard /> },
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

function MonitoringKetuaPokja() {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('SEMUA');

  useEffect(() => {
    apiGetKegiatan()
      .then(res => { if (res.data) setKegiatan(res.data); else setError(res.message); })
      .catch(() => setError('Tidak bisa terhubung ke server.'))
      .finally(() => setLoading(false));
  }, []);

  const total = kegiatan.length;
  const terjadwal = kegiatan.filter(k => k.status_kegiatan === 'TERJADWAL').length;
  const selesai = kegiatan.filter(k => k.status_kegiatan === 'SELESAI').length;
  const dibatalkan = kegiatan.filter(k => k.status_kegiatan === 'DIBATALKAN').length;

  const FILTERS = ['SEMUA', 'TERJADWAL', 'BERLANGSUNG', 'SELESAI', 'DIBATALKAN'];
  const filtered = filter === 'SEMUA' ? kegiatan : kegiatan.filter(k => k.status_kegiatan === filter);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '32px' }}>

        {/* Header */}
        <div className="section-animate" style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Monitoring Kegiatan</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Pantau seluruh kegiatan pembinaan di semua gedung asrama.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-modern" style={{ marginBottom: '16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total', value: total, color: '#10b981' },
            { label: 'Terjadwal', value: terjadwal, color: '#2563eb' },
            { label: 'Selesai', value: selesai, color: '#7c3aed' },
            { label: 'Dibatalkan', value: dibatalkan, color: '#dc2626' },
          ].map((s, i) => (
            <div key={s.label} className={`stat-card card-animate card-animate-${i+1}`} style={{ padding: '16px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: s.color, position: 'relative', zIndex: 1 }}>{useCountUp(s.value)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
              <div className="accent-bar-animate" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '20px', border: '1px solid',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: filter === f ? '#10b981' : '#ffffff',
              color: filter === f ? '#ffffff' : '#64748b',
              borderColor: filter === f ? '#10b981' : '#e2e8f0',
            }}>{f === 'SEMUA' ? 'Semua' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
          ))}
        </div>

        {/* Tabel */}
        <div className="table-card">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Data Kegiatan Pembinaan</h2>
            <span style={{ color: '#94a3b8', fontSize: '12px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>{filtered.length} data</span>
          </div>
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer" style={{ height: '48px', borderRadius: '8px' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Tidak ada data kegiatan</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Nama Kegiatan', 'Tanggal', 'Jenis', 'Lokasi', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((k, i) => (
                    <tr key={k.id_kegiatan} className="table-row row-animate" style={{ animationDelay: `${0.04 * i}s` }}>
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '13px' }}>{i + 1}</td>
                      <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: '500' }}>{k.nama_kegiatan}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{k.jenis_kegiatan.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{k.lokasi}</td>
                      <td style={{ padding: '12px 14px' }}><BadgeStatus status={k.status_kegiatan} /></td>
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

export default MonitoringKetuaPokja;
