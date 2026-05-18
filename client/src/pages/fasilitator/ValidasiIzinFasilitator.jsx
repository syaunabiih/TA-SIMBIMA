import { useState, useEffect } from 'react';
import { usePolling } from '../../hooks/usePolling';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetIzin, apiValidasiIzin, apiGetTotalHariBulanIni } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';
import Modal from '../../components/Modal';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;

const IconMapPin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFileText = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/><polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/fasilitator/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { path: '/fasilitator/kegiatan', label: 'Kelola Kegiatan', icon: <IconCalendar /> },
  { path: '/fasilitator/perizinan', label: 'Validasi Izin', icon: <IconFile /> },
  { path: '/fasilitator/kepulangan', label: 'Kepulangan', icon: <IconMapPin /> },
  { path: '/fasilitator/rekap', label: 'Rekap Absensi', icon: <IconFileText /> },
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(null); // holds izin object
  const [catatan, setCatatan]     = useState('');
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert]         = useState(null);
  const [filter, setFilter]       = useState('SEMUA');
  const [imgPreview, setImgPreview]       = useState(null);
  const [totalHari, setTotalHari]         = useState(null); // { total_hari, nama_bulan }

  const fetchIzin = (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setIsRefreshing(true);
    
    apiGetIzin()
      .then(res => { if (res.data) setIzinList(res.data); })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => { fetchIzin(false); }, []);
  usePolling(() => fetchIzin(true), 10000);

  // Buka modal + fetch total hari bulan ini untuk mahasiswa tersebut
  const openModal = (izin) => {
    setShowModal(izin);
    setCatatan('');
    setTotalHari(null);
    apiGetTotalHariBulanIni(izin.id_mahasiswa)
      .then(res => { if (res.status === 'Sukses') setTotalHari(res.data); })
      .catch(() => {});
  };

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
      <div className="page-enter page-content">

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
            <div className="table-responsive">
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
                          <button onClick={() => openModal(iz)} style={{
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
      <Modal isOpen={!!showModal} onClose={() => setShowModal(null)} maxWidth="480px">
        {showModal && (
          <>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Review Izin</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#94a3b8' }}>Pengajuan dari <strong style={{ color: '#1e293b' }}>{showModal.mahasiswa?.nama}</strong></p>

            {/* Info Card */}
            <div style={{
              border: '1px solid #e2e8f0', borderRadius: '14px',
              marginBottom: '16px', overflow: 'hidden',
            }}>
              {/* Jenis Izin */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Jenis Izin</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    {showModal.jenis_izin.replace(/_/g, ' ')}
                  </span>
                  <BadgeIzin status={showModal.status_pengajuan} />
                </div>
              </div>

              {/* Periode */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Periode</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                  {formatTgl(showModal.tanggal_mulai)} – {formatTgl(showModal.tanggal_selesai)}
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#64748b', fontWeight: '400' }}>({showModal.durasi_hari} hari)</span>
                </div>
              </div>

              {/* Alasan */}
              <div style={{ padding: '14px 16px', borderBottom: showModal.dokumen_pendukung ? '1px solid #e2e8f0' : 'none' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Alasan</div>
                <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{showModal.alasan}</div>
              </div>

              {/* Dokumen Pendukung */}
              {showModal.dokumen_pendukung && (() => {
                const docUrl = showModal.dokumen_pendukung;
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(docUrl);
                return (
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Dokumen Pendukung</div>
                    <button
                      onClick={() => {
                        if (isImage) {
                          setImgPreview(docUrl);
                        } else {
                          window.open(docUrl, '_blank');
                        }
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      Lihat Dokumen
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* ── Total Izin Bulan Ini ── */}
            <div style={{
              background: totalHari && totalHari.total_hari > 0 ? '#fffbeb' : '#f8fafc',
              border: `1px solid ${totalHari && totalHari.total_hari > 0 ? '#fde68a' : '#e2e8f0'}`,
              borderRadius: '12px', padding: '12px 16px', marginBottom: '16px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>
                {totalHari === null ? '' : totalHari.total_hari > 0 ? '' : ''}
              </span>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Izin Bulan Ini</div>
                {totalHari === null ? (
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Memuat data...</div>
                ) : totalHari.total_hari > 0 ? (
                  <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
                    <strong>{showModal.mahasiswa?.nama}</strong> telah izin{' '}
                    <strong>{totalHari.total_hari} hari</strong>{' '}di bulan {totalHari.nama_bulan}
                    <span style={{ color: '#a16207', fontSize: '12px' }}></span>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Belum ada izin disetujui di bulan {totalHari.nama_bulan}
                  </div>
                )}
              </div>
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
          </>
        )}
      </Modal>
      {/* Modal Preview Gambar */}
      <Modal isOpen={!!imgPreview} onClose={() => setImgPreview(null)} maxWidth="90vw" noPadding>
        {imgPreview && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setImgPreview(null)}
              style={{
                position: 'absolute', top: '-14px', right: '-14px',
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#ffffff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                fontWeight: '700', color: '#475569', zIndex: 1,
              }}
            >✕</button>
            <img
              src={imgPreview}
              alt="Dokumen Pendukung"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', display: 'block' }}
            />
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

export default ValidasiIzinFasilitator;
