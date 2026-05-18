import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetPerluPerhatian } from '../../utils/api';

const BRAND = '#01696f';

// ── Icons ──
const IconHome     = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile     = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconMapPin   = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFileText = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/></svg>;
const IconAlert    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconPhone    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>;
const IconEye      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconChevronRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

const MENU = [
  { path: '/fasilitator/dashboard',        label: 'Dashboard',       icon: <IconHome /> },
  { path: '/fasilitator/perlu-perhatian',  label: 'Perlu Perhatian', icon: <IconAlert /> },
  { path: '/fasilitator/kegiatan',         label: 'Kelola Kegiatan', icon: <IconCalendar /> },
  { path: '/fasilitator/perizinan',        label: 'Validasi Izin',   icon: <IconFile /> },
  { path: '/fasilitator/kepulangan',       label: 'Kepulangan',      icon: <IconMapPin /> },
  { path: '/fasilitator/rekap',            label: 'Rekap Absensi',   icon: <IconFileText /> },
];

const TABS = [
  { key: 'ALL',               label: 'Semua' },
  { key: 'ALFA_BERTURUT',     label: 'Alfa 3x Berturut' },
  { key: 'IZIN_TIDAK_KEMBALI', label: 'Izin Tidak Kembali' },
];

// ── Skeleton ──
function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <td key={i} style={{ padding: '16px 20px' }}>
          <div className="skeleton-shimmer" style={{ height: '16px', borderRadius: '6px' }} />
        </td>
      ))}
    </tr>
  );
}

// ── Badge Tipe ──
function TipeBadge({ tipe }) {
  const isAlfa = tipe === 'ALFA_BERTURUT';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '10px',
      background: isAlfa ? '#fee2e2' : '#fef3c7',
      color:      isAlfa ? '#dc2626' : '#d97706',
    }}>
      {isAlfa ? 'Alfa Berturut' : 'Izin Tdk Kembali'}
    </span>
  );
}

export default function PerluPerhatianPage() {
  const navigate = useNavigate();
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipe, setTipe]       = useState('ALL');

  useEffect(() => {
    setLoading(true);
    apiGetPerluPerhatian(tipe)
      .then(res => { if (res.data) setData(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [tipe]);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
          <button onClick={() => navigate('/fasilitator/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND, fontWeight: '500', fontSize: '13px', padding: 0 }}>Dashboard</button>
          <IconChevronRight />
          <span style={{ color: '#475569', fontWeight: '500' }}>Perlu Perhatian</span>
        </div>

        {/* ── Header ── */}
        <div className="section-animate" style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Mahasiswa Perlu Perhatian</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Daftar mahasiswa yang membutuhkan tindak lanjut segera
          </p>
        </div>

        {/* ── Filter Tab ── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#fff', borderRadius: '12px', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 'fit-content' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setTipe(tab.key)}
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: tipe === tab.key ? '700' : '500',
                color: tipe === tab.key ? '#fff' : '#64748b',
                background: tipe === tab.key ? BRAND : 'transparent',
                border: 'none',
                borderRadius: '9px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
              {tipe === tab.key && !loading && (
                <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,0.25)', borderRadius: '8px', padding: '1px 6px', fontSize: '11px' }}>
                  {data.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tabel / List ── */}
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Empty state */}
          {!loading && data.length === 0 ? (
            <div style={{ padding: '64px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                Tidak ada mahasiswa yang perlu perhatian
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Semua mahasiswa dalam kondisi baik</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['No', 'Nama', 'Kamar & Blok', 'Tipe Masalah', 'Keterangan', 'Sejak', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                    : data.map((m, i) => (
                      <tr key={i} style={{ borderBottom: i < data.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* No */}
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#94a3b8', fontWeight: '600', width: '50px' }}>{i + 1}</td>

                        {/* Nama */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '50%',
                              background: m.tipe === 'ALFA_BERTURUT' ? '#fef2f2' : '#fef3c7',
                              color:      m.tipe === 'ALFA_BERTURUT' ? '#dc2626' : '#d97706',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: '700', flexShrink: 0
                            }}>
                              {m.nama.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{m.nama}</div>
                              {m.is_baru && (
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', background: '#fef2f2', padding: '1px 5px', borderRadius: '4px' }}>Baru</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Kamar & Blok */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Kamar {m.kamar}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{m.blok}</div>
                        </td>

                        {/* Tipe Masalah */}
                        <td style={{ padding: '16px 20px' }}>
                          <TipeBadge tipe={m.tipe} />
                        </td>

                        {/* Keterangan */}
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#374151', maxWidth: '220px' }}>
                          {m.keterangan}
                        </td>

                        {/* Sejak */}
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {m.waktu}
                        </td>

                        {/* Aksi */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                            <button
                              title="Hubungi mahasiswa"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                border: `1.5px solid ${BRAND}`, color: BRAND, background: 'transparent',
                                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = BRAND; }}
                            >
                              <IconPhone /> Hubungi
                            </button>
                            {m.tipe === 'IZIN_TIDAK_KEMBALI' && (
                              <button
                                title="Lihat detail izin"
                                onClick={() => navigate('/fasilitator/perizinan')}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                  border: '1.5px solid #d97706', color: '#d97706', background: 'transparent',
                                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#d97706'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d97706'; }}
                              >
                                <IconEye /> Lihat Izin
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Summary footer ── */}
        {!loading && data.length > 0 && (
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#94a3b8', textAlign: 'right' }}>
            Menampilkan <strong style={{ color: '#475569' }}>{data.length}</strong> mahasiswa
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
