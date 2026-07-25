import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetRekapMahasiswa } from '../../utils/api';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFileText = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/><polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/mahasiswa/dashboard', label: 'Dashboard',     icon: <IconHome /> },
  { path: '/mahasiswa/kehadiran', label: 'Kegiatan',      icon: <IconCalendar /> },
  { path: '/mahasiswa/izin',      label: 'Perizinan',     icon: <IconFile /> },
  { path: '/mahasiswa/rekap',     label: 'Rekap Absensi', icon: <IconFileText /> },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

function fmtTgl(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// [1] Badge status rekap
function BadgeStatus({ status }) {
  if (status === 'REWARD') {
    return <span style={{ background: '#fefce8', color: '#a16207', border: '1px solid #fde047', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>🏆 Reward</span>;
  }
  if (status === 'DAPAT_IQAB') {
    return <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>Dapat Iqob</span>;
  }
  // BEBAS_IQAB atau fallback
  return <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>Bebas Iqob</span>;
}

// ─── Modal Iqab ───────────────────────────────────────────────────────────────

function ModalIqab({ rekap, onClose }) {
  if (!rekap) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px',
          width: '90vw', maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',  /* flex column agar footer sticky */
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header (fixed) ── */}
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
              Informasi Penebusan Iqob
            </h2>
            <button
              onClick={onClose}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >✕</button>
          </div>
          <p style={{ margin: '4px 0 16px', fontSize: '12px', color: '#94a3b8' }}>
            Rekap Periode: {fmtTgl(rekap.tanggal_mulai)} – {fmtTgl(rekap.tanggal_selesai)}
          </p>
          <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '0' }} />
        </div>

        {/* ── Body (scrollable) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>

          {/* Section Alpha */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}></span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', marginBottom: '2px' }}>
                Jumlah Alpha kamu: <strong>{rekap.total_alpha ?? '–'}×</strong>
              </div>
              {rekap.batas_alfa != null && (
                <div style={{ fontSize: '12px', color: '#ef4444' }}>
                  Batas iqob: {rekap.batas_alfa}× | kamu melebihi batas
                </div>
              )}
            </div>
          </div>

          {/* Section Ketentuan Penebusan */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              Ketentuan Hukuman:
            </div>
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: '12px', padding: '14px 16px',
              fontSize: '14px', color: '#78350f', lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowY: 'auto',
              maxHeight: '50vh',
            }}>
              {rekap.pengumuman_iqab || 'Belum ada ketentuan penebusan dari fasilitator.'}
            </div>
          </div>

        </div>

        {/* ── Footer (fixed) ── */}
        <div style={{ padding: '16px 28px', flexShrink: 0, borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '12px',
              border: '1.5px solid #e2e8f0', borderRadius: '10px',
              background: '#fff', color: '#475569',
              fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}



// ─── Halaman Utama ────────────────────────────────────────────────────────────

function RekapMahasiswa() {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIqab, setModalIqab] = useState(null); // rekap yang sedang dilihat iqabnya

  useEffect(() => { fetchRiwayat(); }, []);

  const fetchRiwayat = async () => {
    try {
      const res = await apiGetRekapMahasiswa();
      if (res.status === 'Sukses') {
        const sortedData = (res.data || []).sort((a, b) => {
          const dateA = a.tanggal_generate ? new Date(a.tanggal_generate).getTime() : 0;
          const dateB = b.tanggal_generate ? new Date(b.tanggal_generate).getTime() : 0;
          return dateB - dateA;
        });
        setRiwayat(sortedData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardLayout menuItems={MENU}>
        <div className="page-enter page-content">

          {/* Header */}
          <div className="section-animate" style={{ marginBottom: '24px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Rapor Kehadiran</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
              Lihat persentase kehadiran dan status evaluasi Anda setiap periode.
            </p>
          </div>

          {/* Tabel */}
          <div className="table-card card-animate card-animate-1" style={{ border: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Riwayat Evaluasi</h2>
              <span style={{ color: '#94a3b8', fontSize: '13px', background: '#f8fafc', padding: '4px 10px', borderRadius: '20px' }}>{riwayat.length} Rekap</span>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat rapor Anda...</div>
            ) : riwayat.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Belum ada rekap yang dipublikasikan.</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Rapor Anda akan ditampilkan di sini setelah fasilitator mempublikasikannya.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {/* [2] Kolom Periode */}
                      <th style={{ padding: '14px 20px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>PERIODE</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>HADIR</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>IZIN/SAKIT</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>ALPHA</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>% KEHADIRAN</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.map((r, i) => (
                      <tr key={r.id_rekap} className="table-row row-animate" style={{ animationDelay: `${0.05 * i}s` }}>

                        {/* [2] Periode tanggal */}
                        <td style={{ padding: '14px 20px', fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>
                          {r.tanggal_mulai
                            ? <>{fmtTgl(r.tanggal_mulai)}<span style={{ color: '#94a3b8', fontWeight: '400', margin: '0 4px' }}>–</span>{fmtTgl(r.tanggal_selesai)}</>
                            : `${r.bulan}/${r.tahun}`
                          }
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: '600', color: '#059669' }}>{r.total_hadir}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: '600', color: '#d97706' }}>{r.total_izin}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: '700', color: '#dc2626' }}>{r.total_alpha}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{r.persentase_kehadiran}%</span>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>dari {r.total_kegiatan} keg.</div>
                        </td>

                        {/* [1] Status + tombol Lihat Iqab */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                            <BadgeStatus status={r.status_iqab || 'BEBAS_IQAB'} />
                            {/* [4] Tombol Lihat Iqab — hanya muncul jika DAPAT_IQAB */}
                            {r.status_iqab === 'DAPAT_IQAB' && (
                              <button
                                onClick={() => setModalIqab(r)}
                                style={{
                                  background: '#fef2f2', color: '#dc2626',
                                  border: '1px solid #fecaca', borderRadius: '6px',
                                  padding: '4px 10px', fontSize: '11px', fontWeight: '600',
                                  cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                              >
                                Lihat Iqob
                              </button>
                            )}
                          </div>
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

      {/* [4] Modal Iqab */}
      {modalIqab && createPortal(<ModalIqab rekap={modalIqab} onClose={() => setModalIqab(null)} />, document.body)}
    </>
  );
}

export default RekapMahasiswa;
