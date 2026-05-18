import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetKegiatan } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';

// ─── Ikon sidebar ──────────────────────────────────────────────
const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCal      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconPin      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>;
const IconList     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/fasilitator/dashboard',  label: 'Dashboard',       icon: <IconHome /> },
  { path: '/fasilitator/kegiatan',   label: 'Kelola Kegiatan', icon: <IconCal /> },
  { path: '/fasilitator/perizinan',  label: 'Validasi Izin',   icon: <IconFile /> },
  { path: '/fasilitator/kepulangan', label: 'Kepulangan',      icon: <IconPin /> },
  { path: '/fasilitator/rekap',      label: 'Rekap Absensi',   icon: <IconList /> },
];

// ─── Badge status ──────────────────────────────────────────────
function BadgeStatus({ status }) {
  const map = {
    BERLANGSUNG: { label: 'Sedang Berlangsung', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    SELESAI:     { label: 'Selesai',             bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  };
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: '11px',
      fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
      border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

// ─── Komponen Utama ────────────────────────────────────────────
function KelolaKegiatanFasilitator() {
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState(null);
  const [filter, setFilter]     = useState('SEMUA');

  useEffect(() => {
    // Tampilkan pesan sukses dari PilihPetugasPage jika ada
    const msg = sessionStorage.getItem('kegiatan_success');
    if (msg) {
      setAlert({ type: 'success', msg });
      sessionStorage.removeItem('kegiatan_success');
      setTimeout(() => setAlert(null), 4000);
    }
    fetchKegiatan();
  }, []);

  const fetchKegiatan = () => {
    setLoading(true);
    apiGetKegiatan()
      .then(res => { if (res.data) setKegiatan(res.data); })
      .finally(() => setLoading(false));
  };

  const FILTERS  = ['SEMUA', 'BERLANGSUNG', 'SELESAI'];
  const filtered = filter === 'SEMUA' ? kegiatan : kegiatan.filter(k => k.status_kegiatan === filter);

  const total        = kegiatan.length;
  const berlangsung  = kegiatan.filter(k => k.status_kegiatan === 'BERLANGSUNG').length;
  const selesai      = kegiatan.filter(k => k.status_kegiatan === 'SELESAI').length;
  const animTotal        = useCountUp(total);
  const animBerlangsung  = useCountUp(berlangsung);
  const animSelesai      = useCountUp(selesai);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter page-content">

        {/* Header */}
        <div className="section-animate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Kelola Kegiatan</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Buat, pantau, dan kelola semua kegiatan pembinaan.</p>
          </div>
          <button
            className="btn-cta"
            onClick={() => navigate('/fasilitator/kegiatan/tambah')}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Buat Kegiatan
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div style={{
            marginBottom: '16px', padding: '12px 16px', borderRadius: '10px',
            background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: alert.type === 'success' ? '#047857' : '#dc2626',
            fontSize: '14px', fontWeight: '500',
          }}>
            {alert.type === 'success' ? '✓' : '⚠'} {alert.msg}
          </div>
        )}

        {/* Mini Stats */}
        <div className="grid-responsive-3" style={{ marginBottom: '20px' }}>
          {[
            { label: 'Total Kegiatan',      value: animTotal,       color: '#10b981' },
            { label: 'Sedang Berlangsung',  value: animBerlangsung, color: '#059669' },
            { label: 'Selesai',             value: animSelesai,     color: '#64748b' },
          ].map((s, i) => (
            <div key={s.label} className={`stat-card card-animate card-animate-${i + 1}`}
              style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '20px', border: '1px solid',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              transition: 'all 0.2s ease',
              background:   filter === f ? '#10b981' : '#ffffff',
              color:        filter === f ? '#ffffff' : '#64748b',
              borderColor:  filter === f ? '#10b981' : '#e2e8f0',
            }}>
              {f === 'SEMUA' ? 'Semua' : f === 'BERLANGSUNG' ? 'Sedang Berlangsung' : 'Selesai'}
            </button>
          ))}
        </div>

        {/* Tabel Kegiatan */}
        <div className="table-card card-animate card-animate-4">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Daftar Kegiatan</h2>
            <span style={{ color: '#94a3b8', fontSize: '12px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
              {filtered.length} data
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-shimmer" style={{ height: '48px', borderRadius: '8px' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Tidak ada kegiatan</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                Klik "+ Buat Kegiatan" untuk menambah jadwal baru.
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Nama Kegiatan', 'Tanggal', 'Waktu', 'Jenis', 'Lokasi', 'Status', 'Aksi'].map(h => (
                      <th key={h} style={{
                        padding: '12px 14px', textAlign: 'left', color: '#64748b',
                        fontWeight: '500', fontSize: '11px', textTransform: 'uppercase',
                        letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((k, i) => (
                    <tr key={k.id_kegiatan} className="table-row row-animate"
                      style={{ animationDelay: `${0.04 * i}s` }}>
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '13px' }}>{i + 1}</td>
                      <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: '500' }}>{k.nama_kegiatan}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(k.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {k.jenis_kegiatan?.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{k.lokasi}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <BadgeStatus status={k.status_kegiatan} />
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <button
                          onClick={() => navigate(`/fasilitator/kegiatan/${k.id_kegiatan}`)}
                          style={{
                            padding: '6px 14px', borderRadius: '8px',
                            background: '#f1f5f9', border: '1px solid #e2e8f0',
                            color: '#475569', fontSize: '12px', fontWeight: '600',
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#10b981'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                          Detail
                        </button>
                      </td>
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

export default KelolaKegiatanFasilitator;
