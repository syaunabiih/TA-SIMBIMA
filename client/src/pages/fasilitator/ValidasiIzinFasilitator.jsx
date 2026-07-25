import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FASILITATOR_MENU } from './fasilitatorMenu';
import { apiGetIzin, apiValidasiIzin, apiGetTotalHariBulanIni, apiGetIzinSummary, apiKonfirmasiKembali } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';
import Modal from '../../components/Modal';

// ── Icons ────────────────────────────────────────────────────────────────────
const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconUsers    = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;


// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

function hitungTerlambat(tanggalSelesai) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const sel = new Date(tanggalSelesai); sel.setHours(0, 0, 0, 0);
  return Math.floor((now - sel) / (1000 * 60 * 60 * 24));
}
function isTerlambat(iz) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sel = new Date(iz.tanggal_selesai); sel.setHours(0, 0, 0, 0);
  return iz.status_pengajuan === 'DISETUJUI' && today > sel && !iz.returned_at;
}

// ── Komponen Badge ─────────────────────────────────────────────────────────────
function BadgeIzin({ status, terlambat = false }) {
  if (terlambat) return (
    <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2"/></svg>
      TERLAMBAT
    </span>
  );
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

function BadgeKepulangan({ statusDesc }) {
  const map = {
    'Sudah Kembali': { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    'Sudah Tiba':    { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    'Belum Berangkat': { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  };
  const s = map[statusDesc] || map['Belum Berangkat'];
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{statusDesc}</span>;
}

// ── Tab 1: Validasi Izin ──────────────────────────────────────────────────────
const FILTER_IZIN = ['SEMUA', 'MENUNGGU', 'DISETUJUI', 'TERLAMBAT', 'DITOLAK', 'SELESAI'];

function TabValidasi({ izinList, summary, loading, onRefresh }) {
  const [filterIzin, setFilterIzin]   = useState('SEMUA');
  const [showModal, setShowModal]     = useState(null);
  const [catatan, setCatatan]         = useState('');
  const [processing, setProcessing]   = useState(false);
  const [procKembali, setProcKembali] = useState(null);
  const [alert, setAlert]             = useState(null);
  const [imgPreview, setImgPreview]   = useState(null);
  const [totalHari, setTotalHari]     = useState(null);

  const menunggu      = izinList.filter(iz => iz.status_pengajuan === 'MENUNGGU').length;
  const terlambatCount = izinList.filter(isTerlambat).length;
  const animMenunggu  = useCountUp(menunggu);
  const animTerlambat = useCountUp(terlambatCount);

  const filtered = izinList.filter(iz => {
    if (filterIzin === 'SEMUA')     return true;
    if (filterIzin === 'TERLAMBAT') return isTerlambat(iz);
    return iz.status_pengajuan === filterIzin;
  });

  const openModal = (izin) => {
    setShowModal(izin); setCatatan(''); setTotalHari(null);
    apiGetTotalHariBulanIni(izin.id_mahasiswa)
      .then(res => { if (res.status === 'Sukses') setTotalHari(res.data); })
      .catch(() => {});
  };

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const handleValidasi = async (status) => {
    if (!showModal) return;
    setProcessing(true);
    const res = await apiValidasiIzin(showModal.id_perizinan, { status_pengajuan: status, catatan_fasilitator: catatan });
    setProcessing(false);
    if (res.status === 'Sukses') {
      showAlert('success', `Izin berhasil di-${status.toLowerCase()}!`);
      setShowModal(null); setCatatan(''); onRefresh();
    } else { showAlert('error', res.message || 'Gagal memvalidasi izin.'); }
  };

  const handleKonfirmasiKembali = async (id) => {
    setProcKembali(id);
    const res = await apiKonfirmasiKembali(id);
    setProcKembali(null);
    if (res.status === 'Sukses') { showAlert('success', 'Mahasiswa dikonfirmasi sudah kembali ke asrama.'); onRefresh(); }
    else { showAlert('error', res.message || 'Gagal konfirmasi kembali.'); }
  };

  return (
    <>
      {/* Alert */}
      {alert && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`, color: alert.type === 'success' ? '#047857' : '#dc2626', fontSize: '14px' }}>
          {alert.type === 'success' ? '✓' : '⚠'} {alert.msg}
        </div>
      )}

      {/* Mini Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="stat-card card-animate card-animate-1" style={{ padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706' }}>{animMenunggu}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Menunggu Validasi</div>
        </div>
        <div className="stat-card card-animate card-animate-2" style={{ padding: '16px 20px', textAlign: 'center', background: terlambatCount > 0 ? '#fef2f2' : undefined, borderColor: terlambatCount > 0 ? '#fecaca' : undefined, position: 'relative' }}>
          {terlambatCount > 0 && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', animation: 'pulse-dot 1.5s infinite' }} />}
          <div style={{ fontSize: '24px', fontWeight: '700', color: terlambatCount > 0 ? '#dc2626' : '#64748b' }}>{animTerlambat}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Terlambat Kembali</div>
        </div>
        <div className="stat-card card-animate card-animate-3" style={{ padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#64748b' }}>{useCountUp(izinList.length)}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Total Pengajuan</div>
        </div>
      </div>

      {/* Filter Tabs Izin */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {FILTER_IZIN.map(f => {
          const isTerlTab = f === 'TERLAMBAT';
          const isActive  = filterIzin === f;
          const hasBadge  = isTerlTab && terlambatCount > 0;
          return (
            <button key={f} onClick={() => setFilterIzin(f)} style={{
              padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease',
              background: isActive ? (isTerlTab ? '#dc2626' : '#10b981') : '#ffffff',
              color: isActive ? '#ffffff' : (isTerlTab ? '#dc2626' : '#64748b'),
              borderColor: isActive ? (isTerlTab ? '#dc2626' : '#10b981') : (isTerlTab ? '#fecaca' : '#e2e8f0'),
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {isTerlTab ? '⚠ Terlambat' : f === 'SEMUA' ? 'Semua' : f.charAt(0) + f.slice(1).toLowerCase()}
              {hasBadge && (
                <span style={{ background: isActive ? 'rgba(255,255,255,0.3)' : '#dc2626', color: '#fff', borderRadius: '20px', padding: '0px 6px', fontSize: '10px', fontWeight: '700', lineHeight: '16px' }}>
                  {terlambatCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Banner terlambat */}
      {terlambatCount > 0 && filterIzin !== 'TERLAMBAT' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#dc2626' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <span><strong>{terlambatCount} mahasiswa</strong> belum kembali ke asrama melewati batas tanggal izin.</span>
          <button onClick={() => setFilterIzin('TERLAMBAT')} style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '600', color: '#dc2626', background: 'none', border: '1px solid #fecaca', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}>
            Lihat →
          </button>
        </div>
      )}

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
                {filtered.map((iz, i) => {
                  const terlambat = isTerlambat(iz);
                  const hariTerlambat = terlambat ? hitungTerlambat(iz.tanggal_selesai) : 0;
                  return (
                    <tr key={iz.id_perizinan} className="table-row row-animate" style={{ animationDelay: `${0.04 * i}s`, background: terlambat ? '#fff8f8' : undefined, borderLeft: terlambat ? '3px solid #fca5a5' : '3px solid transparent' }}>
                      <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: '500' }}>{iz.mahasiswa?.nama || '-'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{iz.mahasiswa?.nomor_kamar || '-'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{iz.jenis_izin.replace('_', ' ')}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        <div>{formatTgl(iz.tanggal_mulai)} – {formatTgl(iz.tanggal_selesai)}</div>
                        {terlambat && <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', marginTop: '3px' }}>⚠ Terlambat {hariTerlambat} hari</div>}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{iz.durasi_hari} hari</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iz.alasan}</td>
                      <td style={{ padding: '12px 14px' }}><BadgeIzin status={iz.status_pengajuan} terlambat={terlambat} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        {iz.status_pengajuan === 'MENUNGGU' ? (
                          <button onClick={() => openModal(iz)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                            onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                          >Review</button>
                        ) : terlambat ? (
                          <button onClick={() => handleKonfirmasiKembali(iz.id_perizinan)} disabled={procKembali === iz.id_perizinan}
                            style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: '600', cursor: procKembali === iz.id_perizinan ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { if (procKembali !== iz.id_perizinan) e.currentTarget.style.background = '#d1fae5'; }}
                            onMouseLeave={e => { if (procKembali !== iz.id_perizinan) e.currentTarget.style.background = '#ecfdf5'; }}
                          >
                            {procKembali === iz.id_perizinan ? '...' : '✓ Sudah Kembali'}
                          </button>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Review Validasi */}
      <Modal isOpen={!!showModal} onClose={() => setShowModal(null)} maxWidth="480px">
        {showModal && (
          <>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Review Izin</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#94a3b8' }}>Pengajuan dari <strong style={{ color: '#1e293b' }}>{showModal.mahasiswa?.nama}</strong></p>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Jenis Izin</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{showModal.jenis_izin.replace(/_/g, ' ')}</span>
                  <BadgeIzin status={showModal.status_pengajuan} />
                </div>
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Periode</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                  {formatTgl(showModal.tanggal_mulai)} – {formatTgl(showModal.tanggal_selesai)}
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#64748b', fontWeight: '400' }}>({showModal.durasi_hari} hari)</span>
                </div>
              </div>
              <div style={{ padding: '14px 16px', borderBottom: showModal.dokumen_pendukung ? '1px solid #e2e8f0' : 'none' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Alasan</div>
                <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{showModal.alasan}</div>
              </div>
              {showModal.dokumen_pendukung && (() => {
                const docUrl = showModal.dokumen_pendukung;
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(docUrl);
                return (
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Dokumen Pendukung</div>
                    <button onClick={() => { if (isImage) setImgPreview(docUrl); else window.open(docUrl, '_blank'); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer' }}
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

            {/* Total Izin Bulan Ini */}
            <div style={{ background: totalHari && totalHari.total_hari > 0 ? '#fffbeb' : '#f8fafc', border: `1px solid ${totalHari && totalHari.total_hari > 0 ? '#fde68a' : '#e2e8f0'}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{totalHari === null ? '' : totalHari.total_hari > 0 ? '⚠️' : '✅'}</span>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Izin Bulan Ini</div>
                {totalHari === null ? (
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Memuat data...</div>
                ) : totalHari.total_hari > 0 ? (
                  <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
                    <strong>{showModal.mahasiswa?.nama}</strong> telah izin <strong>{totalHari.total_hari} hari</strong> di bulan {totalHari.nama_bulan}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#475569' }}>Belum ada izin disetujui di bulan {totalHari.nama_bulan}</div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Catatan Fasilitator (opsional)</label>
              <textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Tambahkan catatan jika diperlukan..." rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleValidasi('DITOLAK')} disabled={processing} style={{ flex: 1, padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', opacity: processing ? 0.7 : 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
              >Tolak</button>
              <button onClick={() => handleValidasi('DISETUJUI')} disabled={processing} className="btn-cta" style={{ flex: 1, padding: '11px', borderRadius: '10px', fontSize: '14px', justifyContent: 'center', opacity: processing ? 0.7 : 1 }}>Setujui</button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal Preview Gambar */}
      <Modal isOpen={!!imgPreview} onClose={() => setImgPreview(null)} maxWidth="90vw" noPadding>
        {imgPreview && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setImgPreview(null)} style={{ position: 'absolute', top: '-14px', right: '-14px', width: '32px', height: '32px', borderRadius: '50%', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontWeight: '700', color: '#475569', zIndex: 1 }}>✕</button>
            <img src={imgPreview} alt="Dokumen" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', display: 'block' }} />
          </div>
        )}
      </Modal>
    </>
  );
}

// ── Tab 2: Monitoring Kepulangan ──────────────────────────────────────────────
function processIzinData(rawData) {
  const filtered = rawData.filter(x => x.status_pengajuan === 'DISETUJUI' || x.status_pengajuan === 'SELESAI');
  return filtered.map(item => {
    const hasFotoBerangkat = !!item.foto_berangkat;
    const hasFotoPulang    = !!item.foto_pulang;
    const hasTibaLama    = item.konfirmasis?.find(k => k.jenis_konfirmasi === 'SAMPAI_TUJUAN');
    const hasKembaliLama = item.konfirmasis?.find(k => k.jenis_konfirmasi === 'KEMBALI_ASRAMA');
    let statusDesc = 'Belum Berangkat';
    if (hasFotoPulang || hasKembaliLama)       statusDesc = 'Sudah Kembali';
    else if (hasFotoBerangkat || hasTibaLama) statusDesc = 'Sudah Tiba';
    return { ...item, statusDesc, fotoBerangkat: item.foto_berangkat || null, fotoPulang: item.foto_pulang || null, buktiTiba: hasTibaLama || null, buktiKembali: hasKembaliLama || null };
  });
}

function TabKepulangan({ izinList, loading }) {
  const [filterTab, setFilterTab]   = useState('Semua');
  const [showModal, setShowModal]   = useState(false);
  const [selectedIzin, setSelectedIzin] = useState(null);

  const dataKepulangan = processIzinData(izinList);
  const filtered = dataKepulangan.filter(x => filterTab === 'Semua' || x.statusDesc === filterTab);

  return (
    <>
      {/* Filter Tabs Kepulangan */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['Semua', 'Belum Berangkat', 'Sudah Tiba', 'Sudah Kembali'].map(tab => (
          <button key={tab} onClick={() => setFilterTab(tab)} style={{
            padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            border: filterTab === tab ? 'none' : '1px solid #e2e8f0',
            background: filterTab === tab ? '#10b981' : '#ffffff',
            color: filterTab === tab ? '#ffffff' : '#64748b',
            transition: 'all 0.2s',
          }}>{tab}</button>
        ))}
      </div>

      {/* Tabel Kepulangan */}
      <div className="table-card card-animate card-animate-1">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat data kepulangan...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Belum ada data kepulangan.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['MAHASISWA', 'TUJUAN', 'BERANGKAT / KEMBALI', 'STATUS', 'AKSI'].map((h, idx) => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: idx === 4 ? 'right' : 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((izin, i) => (
                  <tr key={izin.id_perizinan} className="table-row row-animate" style={{ animationDelay: `${0.05 * i}s` }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{izin.mahasiswa.nama}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{izin.mahasiswa.nim}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>{izin.alasan}</td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                      <div>{formatTgl(izin.tanggal_mulai)}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>sd {formatTgl(izin.tanggal_selesai)}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}><BadgeKepulangan statusDesc={izin.statusDesc} /></td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button onClick={() => { setSelectedIzin(izin); setShowModal(true); }}
                        style={{ background: '#f1f5f9', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#e0e7ff'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                      >Lihat Bukti</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Bukti */}
      <Modal isOpen={showModal && !!selectedIzin} onClose={() => setShowModal(false)} maxWidth="700px" noPadding>
        {selectedIzin && (
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Bukti Kepulangan</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{selectedIzin.mahasiswa.nama} - {selectedIzin.mahasiswa.nim}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', padding: '8px 12px', borderRadius: '12px' }}>✕</button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><strong style={{ color: '#0f172a' }}>Jenis:</strong> {selectedIzin.jenis_izin.replace('_', ' ')}</div>
                <div><strong style={{ color: '#0f172a' }}>Tujuan Izin:</strong> {selectedIzin.alasan}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Foto Berangkat */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ background: '#f1f5f9', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#334155', fontSize: '14px' }}>Foto Bukti Sampai Pada Tujuan</div>
                  {selectedIzin.fotoBerangkat ? (
                    <div style={{ padding: '16px', textAlign: 'center' }}>
                      <img src={selectedIzin.fotoBerangkat} alt="Bukti Berangkat" style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                      <a href={selectedIzin.fotoBerangkat} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', textAlign: 'center', textDecoration: 'none' }}>Lihat Foto</a>
                    </div>
                  ) : (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Mahasiswa belum mengunggah foto.</div>
                  )}
                </div>
                {/* Foto Pulang */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ background: '#f1f5f9', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#334155', fontSize: '14px' }}>Foto Bukti Sudah di Asrama</div>
                  {selectedIzin.fotoPulang ? (
                    <div style={{ padding: '16px', textAlign: 'center' }}>
                      <img src={selectedIzin.fotoPulang} alt="Bukti Pulang" style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                      <a href={selectedIzin.fotoPulang} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', textAlign: 'center', textDecoration: 'none' }}>Lihat Foto</a>
                    </div>
                  ) : (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Mahasiswa belum mengunggah foto.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ── Halaman Utama ─────────────────────────────────────────────────────────────
export default function PerizinanKepulanganPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'kepulangan' ? 'kepulangan' : 'validasi';

  const [izinList, setIzinList] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchData = (isPoll = false) => {
    if (!isPoll) setLoading(true);
    Promise.all([apiGetIzin(), apiGetIzinSummary()])
      .then(([resIzin, resSummary]) => {
        if (resIzin.data) setIzinList(resIzin.data);
        if (resSummary.status === 'Sukses') setSummary(resSummary.data);
      })
      .finally(() => { setLoading(false); });
  };

  useEffect(() => { fetchData(false); }, []);

  // ── Realtime: refresh saat ada update perizinan ───────────────────────
  const onPerizinanUpdate = useCallback(() => fetchData(true), []);
  useSocket("perizinan:update", onPerizinanUpdate);

  const menunggu      = izinList.filter(iz => iz.status_pengajuan === 'MENUNGGU').length;
  const terlambatCount = izinList.filter(isTerlambat).length;
  const badgeCount    = menunggu + terlambatCount;

  const switchTab = (tab) => {
    setSearchParams(tab === 'kepulangan' ? { tab: 'kepulangan' } : {});
  };

  return (
    <DashboardLayout menuItems={FASILITATOR_MENU}>
      <div className="page-enter page-content">

        {/* Header */}
        <div className="section-animate" style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Perizinan & Kepulangan</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Kelola validasi izin dan pantau kepulangan mahasiswa.</p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
          <button
            onClick={() => switchTab('validasi')}
            style={{
              padding: '8px 20px', borderRadius: '9px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease',
              background: activeTab === 'validasi' ? '#ffffff' : 'transparent',
              color: activeTab === 'validasi' ? '#1e293b' : '#64748b',
              boxShadow: activeTab === 'validasi' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            Validasi Izin
            {badgeCount > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>
                {badgeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => switchTab('kepulangan')}
            style={{
              padding: '8px 20px', borderRadius: '9px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease',
              background: activeTab === 'kepulangan' ? '#ffffff' : 'transparent',
              color: activeTab === 'kepulangan' ? '#1e293b' : '#64748b',
              boxShadow: activeTab === 'kepulangan' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Monitoring Kepulangan
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'validasi' ? (
          <TabValidasi izinList={izinList} summary={summary} loading={loading} onRefresh={() => fetchData(false)} />
        ) : (
          <TabKepulangan izinList={izinList} loading={loading} />
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </DashboardLayout>
  );
}

