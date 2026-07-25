import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FASILITATOR_MENU } from './fasilitatorMenu';
import { apiGetKegiatan, apiGetJenisKegiatan, apiCekKegiatanAktif } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';
import { useSocket } from '../../hooks/useSocket';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('simbima_token');

// ─── Ikon sidebar ──────────────────────────────────────────────
const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCal      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconPin      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>;
const IconList     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/></svg>;



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
  const [kegiatan, setKegiatan]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [alert, setAlert]                 = useState(null);
  const [filter, setFilter]               = useState('SEMUA');
  const [filterJenis, setFilterJenis]     = useState('');
  const [jenisList, setJenisList]         = useState([]);
  const [checkingAktif, setCheckingAktif] = useState(false);
  const [modalAktif, setModalAktif]       = useState(null); // { id_kegiatan, nama_kegiatan }

  useEffect(() => {
    // Tampilkan pesan sukses dari PilihPetugasPage jika ada
    const msg = sessionStorage.getItem('kegiatan_success');
    if (msg) {
      setAlert({ type: 'success', msg });
      sessionStorage.removeItem('kegiatan_success');
      setTimeout(() => setAlert(null), 4000);
    }
    fetchKegiatan();
    fetchJenisKegiatan();
  }, []);

  const fetchJenisKegiatan = () => {
    apiGetJenisKegiatan()
      .then(data => {
        if (data.status === 'Sukses' && Array.isArray(data.data)) setJenisList(data.data);
      })
      .catch(console.error);
  };

  const fetchKegiatan = useCallback(() => {
    setLoading(true);
    apiGetKegiatan()
      .then(res => { if (res.data) setKegiatan(res.data); })
      .finally(() => setLoading(false));
  }, []);

  // Realtime: refresh otomatis saat ada perubahan kegiatan dari server
  useSocket('kegiatan:update', fetchKegiatan);
  useSocket('absensi:update',  fetchKegiatan);

  // Handler tombol "Buat Kegiatan" — cek dulu apakah ada kegiatan aktif di asrama
  const handleBuatKegiatan = async () => {
    setCheckingAktif(true);
    try {
      const res = await apiCekKegiatanAktif();
      if (res.ada && res.kegiatan) {
        setModalAktif(res.kegiatan);
      } else {
        navigate('/fasilitator/kegiatan/tambah');
      }
    } catch {
      // Jika gagal cek (network error), tetap biarkan lanjut
      navigate('/fasilitator/kegiatan/tambah');
    } finally {
      setCheckingAktif(false);
    }
  };

  const FILTERS  = ['SEMUA', 'BERLANGSUNG', 'SELESAI'];
  const filtered = kegiatan
    .filter(k => filter === 'SEMUA' || k.status_kegiatan === filter)
    .filter(k => !filterJenis || k.id_jenis_kegiatan === filterJenis);

  const total        = kegiatan.length;
  const berlangsung  = kegiatan.filter(k => k.status_kegiatan === 'BERLANGSUNG').length;
  const selesai      = kegiatan.filter(k => k.status_kegiatan === 'SELESAI').length;
  const animTotal        = useCountUp(total);
  const animBerlangsung  = useCountUp(berlangsung);
  const animSelesai      = useCountUp(selesai);

  return (
    <DashboardLayout menuItems={FASILITATOR_MENU}>
      <div className="page-enter page-content">

        {/* Header */}
        <div className="section-animate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Kelola Kegiatan</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Buat, pantau, dan kelola semua kegiatan pembinaan.</p>
          </div>
          <button
            className="btn-cta"
            onClick={handleBuatKegiatan}
            disabled={checkingAktif}
            style={{ opacity: checkingAktif ? 0.75 : 1, cursor: checkingAktif ? 'wait' : 'pointer' }}
          >
            {checkingAktif ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', verticalAlign: 'middle' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.35)" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                {' '}Memeriksa...
              </>
            ) : (
              <><span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Buat Kegiatan</>
            )}
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

        {/* Filter Tabs Status */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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

        {/* Filter Jenis */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Jenis:</span>
          <button onClick={() => setFilterJenis('')} style={{
            padding: '5px 12px', borderRadius: '16px', border: '1px solid',
            fontSize: '11px', fontWeight: '500', cursor: 'pointer',
            background: filterJenis === '' ? '#10b981' : '#fff',
            color:      filterJenis === '' ? '#fff' : '#64748b',
            borderColor:filterJenis === '' ? '#10b981' : '#e2e8f0',
          }}>Semua</button>
          
          {jenisList.map(j => (
            <button key={j.id_jenis_kegiatan} onClick={() => setFilterJenis(j.id_jenis_kegiatan)} style={{
              padding: '5px 12px', borderRadius: '16px', border: '1px solid',
              fontSize: '11px', fontWeight: '600', cursor: 'pointer',
              background: filterJenis === j.id_jenis_kegiatan ? (j.is_wajib ? '#dc2626' : '#2563eb') : '#fff',
              color:      filterJenis === j.id_jenis_kegiatan ? '#fff' : '#64748b',
              borderColor:filterJenis === j.id_jenis_kegiatan ? (j.is_wajib ? '#dc2626' : '#2563eb') : '#e2e8f0',
            }}>
              {j.is_wajib ? '🔴' : '🔵'} {j.nama_jenis}
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
                    {['#', 'Jenis', 'Nama Kegiatan', 'Tanggal', 'Waktu', 'Lokasi', 'Status', 'Aksi'].map(h => (
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
                      <td style={{ padding: '12px 14px' }}>
                        {k.jenis_kegiatan?.is_wajib ? (
                          <span style={{ fontSize: '11px', color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '12px' }}>
                            🔴 Wajib
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '12px' }}>
                            🔵 Mandiri
                          </span>
                        )}
                        <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                          {k.jenis_kegiatan?.nama_jenis || 'Lainnya'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: '500' }}>{k.nama_kegiatan}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(k.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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

      {/* ── MODAL: Kegiatan Masih Berlangsung ─────────────────────────── */}
      {modalAktif && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15,23,42,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setModalAktif(null)}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}</style>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px 32px 32px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              textAlign: 'center',
            }}
          >
            {/* Ikon peringatan */}
            <div style={{
              width: '68px', height: '68px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef9c3, #fef08a)',
              border: '3px solid #fde047',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(234,179,8,0.28)',
            }}>
              ⚠️
            </div>

            <h3 style={{ margin: '0 0 12px', fontSize: '19px', fontWeight: '800', color: '#1e293b' }}>
              Kegiatan Masih Berlangsung
            </h3>
            <p style={{ margin: '0 0 8px', color: '#475569', fontSize: '14px', lineHeight: '1.65' }}>
              Kegiatan <strong style={{ color: '#0f172a' }}>"{modalAktif.nama_kegiatan}"</strong> sedang aktif di asrama ini.
            </p>
            <p style={{ margin: '0 0 28px', color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
              QR absensi masih bisa di-scan mahasiswa. Pastikan kegiatan tersebut sudah selesai sebelum membuat kegiatan baru.
            </p>

            {/* Tombol */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => navigate(`/fasilitator/kegiatan/${modalAktif.id_kegiatan}`)}
                style={{
                  width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', fontWeight: '700', fontSize: '14px',
                  cursor: 'pointer', letterSpacing: '0.2px',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.35)'; }}
              >
                Lihat Kegiatan Aktif
              </button>
              <button
                onClick={() => setModalAktif(null)}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  background: '#f8fafc', border: '1.5px solid #e2e8f0',
                  color: '#64748b', fontWeight: '600', fontSize: '14px',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                Oke, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default KelolaKegiatanFasilitator;

