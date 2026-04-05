import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetIzin, apiValidasiIzin } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/dashboard/fasilitator', label: 'Dashboard', icon: <IconHome /> },
  { path: '/dashboard/fasilitator/kegiatan', label: 'Kelola Kegiatan', icon: <IconCalendar /> },
  { path: '/dashboard/fasilitator/izin', label: 'Validasi Izin', icon: <IconFile /> },
];

function BadgeIzin({ status }) {
  const map = {
    MENUNGGU:   { label: 'Menunggu',   bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    DISETUJUI:  { label: 'Disetujui',  bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    DITOLAK:    { label: 'Ditolak',    bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    DIBATALKAN: { label: 'Dibatalkan', bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
    SELESAI:    { label: 'Selesai',    bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  };
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${s.border}` }}>{s.label}</span>;
}

const formatTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function ValidasiIzinFasilitator() {
  const [izinList, setIzinList]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(null); // holds izin object
  const [catatan, setCatatan]     = useState('');
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert]         = useState(null);
  const [filter, setFilter]       = useState('SEMUA');

  const fetchIzin = () => {
    setLoading(true);
    apiGetIzin()
      .then(res => { if (res.data) setIzinList(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchIzin(); }, []);

  const handleValidasi = async (status) => {
    if (!showModal) return;
    setProcessing(true);
    const res = await apiValidasiIzin(showModal.id_perizinan, {
      status_pengajuan: status,
      catatan_fasilitator: catatan,
    });
    setProcessing(false);
    if (res.status === 'Sukses') {
      setAlert({ type: 'success', msg: `Izin berhasil di-${status.toLowerCase()}!` });
      setShowModal(null);
      setCatatan('');
      fetchIzin();
    } else {
      setAlert({ type: 'error', msg: res.message || 'Gagal memvalidasi izin.' });
    }
    setTimeout(() => setAlert(null), 4000);
  };

  const FILTERS = ['SEMUA', 'MENUNGGU', 'DISETUJUI', 'DITOLAK', 'SELESAI'];
  const filtered = filter === 'SEMUA' ? izinList : izinList.filter(iz => iz.status_pengajuan === filter);

  const menunggu = izinList.filter(iz => iz.status_pengajuan === 'MENUNGGU').length;
  const disetujui = izinList.filter(iz => iz.status_pengajuan === 'DISETUJUI').length;
  const animMenunggu = useCountUp(menunggu);
  const animDisetujui = useCountUp(disetujui);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '32px' }}>

        {/* Header */}
        <div className="section-animate" style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Validasi Izin</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Setujui atau tolak pengajuan izin dari mahasiswa.</p>
        </div>

        {/* Alert */}
        {alert && (
          <div className="alert-modern" style={{
            marginBottom: '16px',
            background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: alert.type === 'success' ? '#047857' : '#dc2626',
          }}>
            <span>{alert.type === 'success' ? '✓' : '⚠'}</span> {alert.msg}
          </div>
        )}

        {/* Mini Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div className="stat-card card-animate card-animate-1" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706' }}>{animMenunggu}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Menunggu Validasi</div>
          </div>
          <div className="stat-card card-animate card-animate-2" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>{animDisetujui}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Disetujui</div>
          </div>
          <div className="stat-card card-animate card-animate-3" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#64748b' }}>{useCountUp(izinList.length)}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Total Pengajuan</div>
          </div>
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

        {/* Tabel Izin */}
        <div className="table-card card-animate card-animate-4">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Daftar Pengajuan Izin</h2>
          </div>
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: '48px', borderRadius: '8px' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Tidak ada pengajuan izin</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Mahasiswa', 'Kamar', 'Jenis', 'Tanggal', 'Durasi', 'Alasan', 'Status', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((iz, i) => (
                    <tr key={iz.id_perizinan} className="table-row row-animate" style={{ animationDelay: `${0.04 * i}s` }}>
                      <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: '500' }}>{iz.mahasiswa?.nama || '-'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{iz.mahasiswa?.nomor_kamar || '-'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{iz.jenis_izin.replace('_', ' ')}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{formatTgl(iz.tanggal_mulai)} – {formatTgl(iz.tanggal_selesai)}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{iz.durasi_hari} hari</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iz.alasan}</td>
                      <td style={{ padding: '12px 14px' }}><BadgeIzin status={iz.status_pengajuan} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        {iz.status_pengajuan === 'MENUNGGU' ? (
                          <button onClick={() => { setShowModal(iz); setCatatan(''); }} style={{
                            background: '#10b981', color: 'white', border: 'none', borderRadius: '8px',
                            padding: '6px 12px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                            onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                          >Review</button>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Validasi */}
      {showModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(4px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px',
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(null); }}>
          <div className="modal-content" style={{
            background: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Review Izin</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#94a3b8' }}>Pengajuan dari <strong style={{ color: '#1e293b' }}>{showModal.mahasiswa?.nama}</strong></p>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '16px', fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>
              <div><strong>Jenis:</strong> {showModal.jenis_izin.replace('_', ' ')}</div>
              <div><strong>Tanggal:</strong> {formatTgl(showModal.tanggal_mulai)} – {formatTgl(showModal.tanggal_selesai)} ({showModal.durasi_hari} hari)</div>
              <div><strong>Alasan:</strong> {showModal.alasan}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Catatan Fasilitator (opsional)</label>
              <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
                placeholder="Tambahkan catatan jika diperlukan..."
                rows={3} style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
                  background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleValidasi('DITOLAK')} disabled={processing} style={{
                flex: 1, padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer',
                transition: 'all 0.2s ease', opacity: processing ? 0.7 : 1,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
              >Tolak</button>
              <button onClick={() => handleValidasi('DISETUJUI')} disabled={processing} className="btn-cta" style={{
                flex: 1, padding: '11px', borderRadius: '10px', fontSize: '14px',
                justifyContent: 'center', opacity: processing ? 0.7 : 1,
              }}>Setujui</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ValidasiIzinFasilitator;
