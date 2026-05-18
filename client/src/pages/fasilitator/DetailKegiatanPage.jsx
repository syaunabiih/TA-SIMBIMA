import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetKegiatan, apiTutupPresensi, apiInputKehadiranFasil, apiEditKehadiranFasil, apiCekKelengkapanAbsensi, apiAlfaOtomatis } from '../../utils/api';
import { createPortal } from 'react-dom';
import QrAbsensiModal from '../../components/QrAbsensiModal';

const MENU = [
  { path: '/fasilitator/dashboard',  label: 'Dashboard',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { path: '/fasilitator/kegiatan',   label: 'Kelola Kegiatan', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg> },
  { path: '/fasilitator/perizinan',  label: 'Validasi Izin',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg> },
  { path: '/fasilitator/kepulangan', label: 'Kepulangan',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg> },
  { path: '/fasilitator/rekap',      label: 'Rekap Absensi',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/></svg> },
];

const SLOT_OPTIONS = [
  '1-A', '1-B', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B', '5-A', '5-B'
];

function labelSlot(key) {
  const [lantai, blok] = key.split('-');
  return `Lantai ${lantai} — Blok ${blok}`;
}

// Badge status kehadiran
function BadgeKehadiran({ status }) {
  if (!status) return (
    <span style={{ background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>
      Belum Diisi
    </span>
  );
  const map = {
    HADIR: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', label: 'Hadir' },
    IZIN:  { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', label: 'Izin' },
    SAKIT: { bg: '#fffbeb', color: '#78350f', border: '#fde68a', label: 'Sakit' },
    ALPHA: { bg: '#fef2f2', color: '#7f1d1d', border: '#fecaca', label: 'Alfa' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>
      {s.label}
    </span>
  );
}

// Badge status kegiatan
function BadgeStatusKegiatan({ status }) {
  const map = {
    BERLANGSUNG: { label: 'Sedang Berlangsung', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    SELESAI:     { label: 'Selesai',             bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  };
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>
      {s.label}
    </span>
  );
}

// Modal konfirmasi tutup presensi
function ConfirmModal({ onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.15s ease',
    }}>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes iconPop { 0% { transform: scale(0); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }
      `}</style>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '32px 28px',
        width: '100%', maxWidth: '420px', margin: '0 16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
        animation: 'slideUp 0.2s ease',
      }}>
        {/* Ikon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#fef2f2', border: '2px solid #fecaca',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#ef4444" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1.5" fill="#ef4444"/>
            </svg>
          </div>
        </div>

        {/* Judul */}
        <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>
          Tutup Presensi?
        </h2>

        {/* Deskripsi */}
        <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b', textAlign: 'center', lineHeight: '1.6' }}>
          Anda akan menutup presensi untuk kegiatan ini.
        </p>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.5' }}>
          Setelah ditutup, mahasiswa <strong style={{ color: '#ef4444' }}>tidak dapat lagi</strong> mengisi absensi.
        </p>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '20px' }} />

        {/* Tombol */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '11px 0', borderRadius: '10px',
              border: '1.5px solid #e2e8f0', background: '#f8fafc',
              color: '#475569', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '11px 0', borderRadius: '10px',
              border: 'none', background: loading ? '#fca5a5' : '#ef4444',
              color: 'white', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#dc2626'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#ef4444'; }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Menutup...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Ya, Tutup Presensi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailKegiatanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [kegiatan, setKegiatan]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [selectedSlot, setSelectedSlot]   = useState('');
  const [kehadiran, setKehadiran]         = useState([]);
  const [loadingKH, setLoadingKH]         = useState(false);
  const [tutupLoading, setTutupLoading]   = useState(false);
  const [alert, setAlert]                 = useState(null);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [editMode, setEditMode]           = useState(false);
  const [editDraft, setEditDraft]         = useState({});
  const [savingBulk, setSavingBulk]       = useState(false);
  const [toast, setToast]                 = useState(null);
  const [successModal, setSuccessModal]   = useState(null);
  const [warningModal, setWarningModal]   = useState(null);
  const [statusBlok, setStatusBlok]       = useState([]);
  const [showQrModal, setShowQrModal]     = useState(false);

  // Auto-buka QR jika dari halaman Buat Kegiatan
  useEffect(() => {
    if (location.state?.autoShowQr) {
      // Tunggu data kegiatan selesai load baru buka modal
      const timer = setTimeout(() => setShowQrModal(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    fetchKegiatan();
    fetchStatusBlok();
  }, [id]);

  const fetchStatusBlok = async () => {
    try {
      const res = await apiCekKelengkapanAbsensi(id);
      if (res.status === 'Sukses' && Array.isArray(res.data)) {
        setStatusBlok(res.data);
      }
    } catch (error) {
      console.error('Gagal fetch status blok', error);
    }
  };

  const fetchKegiatan = () => {
    apiGetKegiatan()
      .then(res => {
        const found = res.data?.find(k => String(k.id_kegiatan) === String(id));
        setKegiatan(found || null);
      })
      .finally(() => setLoading(false));
  };

  // Fetch kehadiran (ekstrak agar bisa dipanggil manual setelah simpan)
  const fetchKehadiran = (slot = selectedSlot) => {
    if (!slot) { setKehadiran([]); return; }
    const [lantai, blok] = slot.split('-');
    setLoadingKH(true);
    const token = localStorage.getItem('simbima_token');
    fetch(`http://localhost:5000/api/kegiatan/${id}/kehadiran?lantai=${lantai}&blok=${blok}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => { if (res.data) setKehadiran(res.data); })
      .finally(() => setLoadingKH(false));
  };

  // Fetch kehadiran saat slot berubah
  useEffect(() => {
    setEditMode(false);
    setEditDraft({});
    if (!selectedSlot) { setKehadiran([]); return; }
    fetchKehadiran(selectedSlot);
  }, [selectedSlot, id]);

  const handleTutupPresensi = async () => {
    setTutupLoading(true);
    try {
      const res = await apiCekKelengkapanAbsensi(id);
      if (res.status === 'Sukses' && Array.isArray(res.data)) {
        const list = res.data;
        const belumTerisi = list.reduce((sum, b) => sum + (b.total - b.terisi), 0);
        const lengkap = belumTerisi === 0;

        if (!lengkap) {
          setWarningModal({ visible: true, belum_terisi: belumTerisi });
        } else {
          setShowConfirm(true);
        }
      } else {
        setAlert({ type: 'error', msg: res.message || 'Gagal mengecek absensi.' });
        setTimeout(() => setAlert(null), 4000);
      }
    } catch {
      setAlert({ type: 'error', msg: 'Terjadi kesalahan saat mengecek absensi.' });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setTutupLoading(false);
    }
  };

  const handleConfirmTutup = async () => {
    setTutupLoading(true);
    try {
      const res = await apiTutupPresensi(id);
      if (res.status === 'Sukses') {
        setAlert({ type: 'success', msg: 'Presensi berhasil ditutup. Status kegiatan diubah ke Selesai.' });
        fetchKegiatan();
        fetchStatusBlok();
        fetchKehadiran(selectedSlot);
      } else {
        setAlert({ type: 'error', msg: res.message || 'Gagal menutup presensi.' });
      }
    } catch {
      setAlert({ type: 'error', msg: 'Terjadi kesalahan. Coba lagi.' });
    } finally {
      setTutupLoading(false);
      setShowConfirm(false);
      setTimeout(() => setAlert(null), 4000);
    }
  };

  // Alfa otomatis lalu tutup presensi
  const handleAlfaLaluTutup = async () => {
    setTutupLoading(true);
    setWarningModal(null);
    try {
      // 1. Alfa otomatis
      const alfaRes = await apiAlfaOtomatis(id);
      const jumlahAlfa = alfaRes.jumlah || 0;

      // 2. Tutup presensi
      const tutupRes = await apiTutupPresensi(id);
      if (tutupRes.status === 'Sukses') {
        setToast({ type: 'success', msg: `Presensi ditutup. ${jumlahAlfa} mahasiswa otomatis tercatat Alfa.` });
        fetchKegiatan();
        fetchStatusBlok();
        fetchKehadiran(selectedSlot);
      } else {
        setAlert({ type: 'error', msg: tutupRes.message || 'Gagal menutup presensi.' });
      }
    } catch {
      setAlert({ type: 'error', msg: 'Terjadi kesalahan. Coba lagi.' });
    } finally {
      setTutupLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Masuk mode edit: snapshot nilai saat ini ke draft
  const handleStartEdit = () => {
    const draft = {};
    kehadiran.forEach(m => { draft[m.id_mahasiswa] = m.status_kehadiran || ''; });
    setEditDraft(draft);
    setEditMode(true);
  };

  // Batal: buang draft, kembali read-only
  const handleCancelEdit = () => {
    setEditDraft({});
    setEditMode(false);
  };

  // Simpan: loop semua baris yang berubah, POST/PUT sesuai ada tidaknya id_kehadiran
  const handleSaveBulk = async () => {
    setSavingBulk(true);
    let errCount = 0;
    let savedCount = 0;

    // Kumpulkan baris yang nilainya berubah
    const changed = kehadiran.filter(m => {
      const original = m.status_kehadiran || '';
      const draft    = editDraft[m.id_mahasiswa] || '';
      return draft !== original && draft !== '';
    });

    for (const m of changed) {
      const newStatus = editDraft[m.id_mahasiswa];
      try {
        let res;
        if (m.id_kehadiran) {
          // UPDATE — sudah ada record
          res = await apiEditKehadiranFasil(m.id_kehadiran, newStatus);
        } else {
          // CREATE — belum ada record
          res = await apiInputKehadiranFasil({
            id_kegiatan:      Number(id),
            id_mahasiswa:     Number(m.id_mahasiswa),
            status_kehadiran: newStatus,
          });
        }
        if (res.status === 'Sukses') {
          savedCount++;
        } else {
          console.warn('Gagal simpan kehadiran:', res.message);
          errCount++;
        }
      } catch (err) {
        console.error('handleSaveBulk error:', err);
        errCount++;
      }
    }

    setSavingBulk(false);
    setEditMode(false);
    setEditDraft({});

    // Refetch dari DB agar tabel sinkron
    fetchKehadiran();
    fetchStatusBlok(); // Refresh status blok setelah simpan

    if (errCount === 0 && savedCount === 0) {
      setToast({ type: 'success', msg: 'Tidak ada perubahan untuk disimpan.' });
      setTimeout(() => setToast(null), 3000);
    } else {
      // Tampilkan modal sukses dengan auto-close 2.5 detik
      setSuccessModal({ saved: savedCount, failed: errCount, visible: true });
      setTimeout(() => setSuccessModal(prev => prev ? { ...prev, visible: false } : null), 2500);
      setTimeout(() => setSuccessModal(null), 2900);
    }
  };

  const fmtTgl = (d) => new Date(d).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtJam = (d) => new Date(d).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });


  if (loading) {
    return (
      <DashboardLayout menuItems={MENU}>
        <div className="page-content">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: '56px', borderRadius: '12px', marginBottom: '12px' }} />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!kegiatan) {
    return (
      <DashboardLayout menuItems={MENU}>
        <div className="page-content" style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>😕</div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>Kegiatan tidak ditemukan</div>
          <button onClick={() => navigate('/fasilitator/kegiatan')} style={{ marginTop: '16px', padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
            Kembali
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '20px', overflow: 'hidden' };
  const cardHeader = { padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

  return (
    <DashboardLayout menuItems={MENU}>
      {/* Modal Sukses Simpan Kehadiran */}
      {successModal && createPortal((
        <div
          onClick={() => setSuccessModal(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '28px',
              padding: '40px 36px',
              width: '100%', maxWidth: '380px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.03)',
              transform: successModal.visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: successModal.visible ? 1 : 0,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Soft background glow */}
            <div style={{
              position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
              width: '150px', height: '150px',
              background: successModal.failed > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              filter: 'blur(40px)', borderRadius: '50%', zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Animated Icon Container */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: successModal.failed > 0 
                  ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' 
                  : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                position: 'relative',
                animation: 'iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both',
              }}>
                {/* Inner Icon Circle */}
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: successModal.failed > 0 
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: successModal.failed > 0 
                    ? '0 8px 20px rgba(245, 158, 11, 0.3)' 
                    : '0 8px 20px rgba(16, 185, 129, 0.3)',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    {successModal.failed > 0 ? (
                      <>
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5"/>
                        <line x1="12" y1="8" x2="12" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        <circle cx="12" cy="16" r="1.5" fill="white"/>
                      </>
                    ) : (
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    )}
                  </svg>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h2 style={{ 
                margin: '0 0 8px', fontSize: '22px', fontWeight: '800', 
                color: '#0f172a', letterSpacing: '-0.02em' 
              }}>
                {successModal.failed > 0 ? 'Sebagian Berhasil' : 'Absensi Diperbarui'}
              </h2>

              <p style={{ 
                margin: '0 0 28px', fontSize: '14px', color: '#64748b', 
                lineHeight: '1.6', fontWeight: '500' 
              }}>
                {successModal.failed === 0
                  ? 'Data kehadiran mahasiswa telah berhasil disinkronisasi ke sistem.'
                  : `${successModal.saved} data berhasil disimpan, ${successModal.failed} gagal. Silakan coba lagi.`}
              </p>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Modal Peringatan Absensi Belum Lengkap — 2 pilihan */}
      {warningModal && createPortal((
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px', padding: '32px 28px',
              width: '100%', maxWidth: '420px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              textAlign: 'center',
            }}
          >
            {/* Ikon peringatan */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 20px rgba(239,68,68,0.25)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h2 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              Absensi Belum Lengkap
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: '1.65' }}>
              Masih ada{' '}
              <strong style={{ color: '#ef4444' }}>{warningModal.belum_terisi} mahasiswa</strong>{' '}
              yang belum diisi absensinya. Apakah Anda ingin menjadikan status mereka sebagai{' '}
              <strong style={{ color: '#1e293b' }}>Alfa</strong>?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Batal */}
              <button
                onClick={() => setWarningModal(null)}
                disabled={tutupLoading}
                style={{
                  flex: 1, padding: '12px', border: '1.5px solid #e2e8f0',
                  borderRadius: '10px', background: '#f8fafc',
                  color: '#475569', fontWeight: '600', fontSize: '14px',
                  cursor: tutupLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Batal
              </button>
              {/* Iya, Jadikan Alfa */}
              <button
                onClick={handleAlfaLaluTutup}
                disabled={tutupLoading}
                style={{
                  flex: 1, padding: '12px', border: 'none',
                  borderRadius: '10px',
                  background: tutupLoading ? '#fca5a5' : 'linear-gradient(135deg,#ef4444,#b91c1c)',
                  color: '#fff', fontWeight: '700', fontSize: '14px',
                  cursor: tutupLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
                }}
              >
                {tutupLoading ? 'Memproses...' : 'Iya, Jadikan Alfa'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Modal Konfirmasi Tutup Presensi */}
      {showConfirm && createPortal(
        <ConfirmModal
          loading={tutupLoading}
          onConfirm={handleConfirmTutup}
          onCancel={() => setShowConfirm(false)}
        />,
        document.body
      )}
      <div className="page-enter page-content" style={{ maxWidth: '900px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '13px', color: '#94a3b8' }}>
          <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => navigate('/fasilitator/kegiatan')}>Kelola Kegiatan</span>
          <span>›</span>
          <span style={{ color: '#1e293b', fontWeight: '600' }}>Detail Kegiatan</span>
        </div>

        {/* ── Info Kegiatan ── */}
        <div style={cardStyle}>
          <div style={cardHeader}>
            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{kegiatan.nama_kegiatan}</h1>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {kegiatan.status_kegiatan === 'BERLANGSUNG' && (
                <>
                  {/* Tombol QR Absensi */}
                  <button
                    onClick={() => setShowQrModal(true)}
                    style={{
                      padding: '7px 16px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none', borderRadius: '8px', color: 'white',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                      <rect x="13" y="13" width="3" height="3" rx="0.5" fill="currentColor"/>
                      <rect x="18" y="13" width="3" height="8" rx="0.5" fill="currentColor"/>
                      <rect x="13" y="18" width="5" height="3" rx="0.5" fill="currentColor"/>
                    </svg>
                    Tampilkan QR Absensi
                  </button>

                  {/* Tombol Tutup Presensi */}
                  <button
                    onClick={handleTutupPresensi}
                    disabled={tutupLoading}
                    style={{
                      padding: '7px 16px', background: tutupLoading ? '#fca5a5' : '#ef4444',
                      border: 'none', borderRadius: '8px', color: 'white',
                      fontSize: '13px', fontWeight: '600', cursor: tutupLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                    onMouseEnter={e => { if (!tutupLoading) e.currentTarget.style.background = '#dc2626'; }}
                    onMouseLeave={e => { if (!tutupLoading) e.currentTarget.style.background = '#ef4444'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {tutupLoading ? 'Menutup...' : 'Tutup Presensi'}
                  </button>
                </>
              )}
              <button onClick={() => navigate('/fasilitator/kegiatan')} style={{ padding: '7px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                ← Kembali
              </button>
            </div>
          </div>

          {/* Alert */}
          {alert && (
            <div style={{
              margin: '0 24px 0', padding: '12px 16px',
              background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: alert.type === 'success' ? '#047857' : '#dc2626',
              fontSize: '13px', fontWeight: '500', borderRadius: '8px', marginTop: '16px',
            }}>
              {alert.type === 'success' ? '✓' : '⚠'} {alert.msg}
            </div>
          )}
          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
            {[
              { label: 'Tanggal',     val: fmtTgl(kegiatan.tanggal_kegiatan) },
              { label: 'Waktu Mulai', val: fmtJam(kegiatan.waktu_mulai) },
              { label: 'Lokasi',      val: kegiatan.lokasi },
              { label: 'Jenis',       val: kegiatan.jenis_kegiatan?.replace(/_/g, ' ') },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
                <div style={{ color: '#1e293b', fontWeight: '500' }}>{val}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Status</div>
              <BadgeStatusKegiatan status={kegiatan.status_kegiatan} />
            </div>
          </div>
        </div>

        {/* ── Daftar Kehadiran Mahasiswa ── */}
        <div style={cardStyle}>
          <div style={cardHeader}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Daftar Kehadiran Mahasiswa</h2>
            {/* Tombol Edit Kehadiran — muncul jika slot dipilih & data ada (semua status) */}
            {selectedSlot && !loadingKH && kehadiran.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {editMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={savingBulk}
                      style={{
                        padding: '7px 16px', borderRadius: '8px',
                        border: '1.5px solid #e2e8f0', background: '#f8fafc',
                        color: '#64748b', fontSize: '13px', fontWeight: '600',
                        cursor: savingBulk ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveBulk}
                      disabled={savingBulk}
                      style={{
                        padding: '7px 16px', borderRadius: '8px', border: 'none',
                        background: savingBulk ? '#6ee7b7' : '#10b981',
                        color: 'white', fontSize: '13px', fontWeight: '600',
                        cursor: savingBulk ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!savingBulk) e.currentTarget.style.background = '#059669'; }}
                      onMouseLeave={e => { if (!savingBulk) e.currentTarget.style.background = '#10b981'; }}
                    >
                      {savingBulk ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="3"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          Simpan
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStartEdit}
                    style={{
                      padding: '7px 16px', borderRadius: '8px',
                      border: '1.5px solid #e2e8f0', background: '#f8fafc',
                      color: '#475569', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.color = '#2563eb'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Edit Kehadiran
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{ padding: '20px 24px' }}>

            {/* Dropdown pilih lantai & blok */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                Pilih Lantai &amp; Blok
              </label>
              <select
                value={selectedSlot}
                onChange={e => setSelectedSlot(e.target.value)}
                style={{
                  width: '100%', maxWidth: '320px', padding: '10px 14px', borderRadius: '10px',
                  border: `1.5px solid ${selectedSlot ? '#10b981' : '#e2e8f0'}`,
                  background: selectedSlot ? '#f0fdf4' : '#f8fafc',
                  color: selectedSlot ? '#065f46' : '#374151',
                  fontSize: '14px', fontWeight: '500', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">-- Pilih Lantai &amp; Blok --</option>
                {SLOT_OPTIONS.map(slot => {
                  const [lantaiStr, blokStr] = slot.split('-');
                  const st = statusBlok.find(s => s.lantai === Number(lantaiStr) && s.blok === blokStr);
                  
                  let label = `Lantai ${lantaiStr} — Blok ${blokStr}`;
                  if (st) {
                    if (st.total === 0) {
                      label += ' (kosong)';
                    } else if (st.lengkap) {
                      label += ' ✓';
                    } else {
                      label += ` (${st.terisi}/${st.total})`;
                    }
                  }
                  
                  return (
                    <option key={slot} value={slot} style={{ color: st?.lengkap && st?.total > 0 ? '#059669' : 'inherit' }}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Kondisi belum pilih */}
            {!selectedSlot && (
              <div style={{ padding: '28px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', color: '#94a3b8', fontSize: '14px' }}>
                Pilih lantai dan blok untuk melihat data kehadiran
              </div>
            )}

            {/* Loading kehadiran */}
            {selectedSlot && loadingKH && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: '44px', borderRadius: '8px' }} />)}
              </div>
            )}

            {/* Tabel kehadiran */}
            {selectedSlot && !loadingKH && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>

                {/* Toast notifikasi */}
                {toast && (
                  <div style={{
                    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                    background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    borderBottom: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    color: toast.type === 'success' ? '#047857' : '#dc2626',
                    fontSize: '13px', fontWeight: '500',
                  }}>
                    {toast.type === 'success' ? '✓' : '⚠'} {toast.msg}
                  </div>
                )}

                {/* Banner mode edit */}
                {editMode && (
                  <div style={{
                    padding: '9px 16px', background: '#eff6ff',
                    borderBottom: '1px solid #bfdbfe',
                    color: '#1d4ed8', fontSize: '12px', fontWeight: '500',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Mode edit aktif — ubah status tiap mahasiswa, lalu klik <strong style={{ marginLeft: '3px' }}>Simpan</strong>.
                  </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['No', 'Nama', 'Kamar', 'Status Kehadiran'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kehadiran.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                          Tidak ada mahasiswa di {labelSlot(selectedSlot)}
                        </td>
                      </tr>
                    ) : kehadiran.map((m, i) => {
                      const draftStatus = editDraft[m.id_mahasiswa];
                      const isChanged   = editMode && draftStatus !== (m.status_kehadiran || '');
                      return (
                        <tr key={m.id_mahasiswa} style={{
                          borderTop: '1px solid #f1f5f9',
                          background: isChanged ? '#fefce8' : editMode ? '#fafafa' : 'white',
                          transition: 'background 0.15s',
                        }}>
                          <td style={{ padding: '11px 16px', color: '#94a3b8', fontSize: '13px', width: '48px' }}>{i + 1}</td>
                          <td style={{ padding: '11px 16px', color: '#1e293b', fontWeight: '500' }}>
                            {m.nama}
                            {isChanged && (
                              <span style={{ marginLeft: '8px', fontSize: '10px', background: '#fef08a', color: '#854d0e', padding: '1px 7px', borderRadius: '20px', fontWeight: '700' }}>Diubah</span>
                            )}
                          </td>
                          <td style={{ padding: '11px 16px', color: '#64748b', fontSize: '13px' }}>{m.nomor_kamar}</td>
                          <td style={{ padding: '11px 16px' }}>
                            {editMode ? (
                              <select
                                value={editDraft[m.id_mahasiswa] || ''}
                                onChange={e => setEditDraft(prev => ({ ...prev, [m.id_mahasiswa]: e.target.value }))}
                                style={{
                                  padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                  border: `1.5px solid ${isChanged ? '#f59e0b' : '#e2e8f0'}`,
                                  background: isChanged ? '#fffbeb' : '#f8fafc',
                                  color: isChanged ? '#78350f' : '#475569',
                                  outline: 'none', cursor: 'pointer', width: '130px',
                                  transition: 'border-color 0.15s',
                                }}
                              >
                                <option value="">-- Belum Diisi --</option>
                                <option value="HADIR">Hadir</option>
                                <option value="IZIN">Izin</option>
                                <option value="SAKIT">Sakit</option>
                                <option value="ALPHA">Alfa</option>
                              </select>
                            ) : (
                              <BadgeKehadiran status={m.status_kehadiran} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary baris bawah */}
                {kehadiran.length > 0 && (
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '16px', fontSize: '12px', fontWeight: '600' }}>
                    {['HADIR', 'IZIN', 'SAKIT', 'ALPHA'].map(s => {
                      const n = kehadiran.filter(m => m.status_kehadiran === s).length;
                      const colors = { HADIR: '#10b981', IZIN: '#3b82f6', SAKIT: '#f59e0b', ALPHA: '#ef4444' };
                      const labels = { HADIR: 'Hadir', IZIN: 'Izin', SAKIT: 'Sakit', ALPHA: 'Alfa' };
                      return (
                        <span key={s} style={{ color: colors[s] }}>{labels[s]}: {n}</span>
                      );
                    })}
                    <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>
                      Belum diisi: {kehadiran.filter(m => !m.status_kehadiran).length}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* QR Absensi Modal */}
      {showQrModal && (
        <QrAbsensiModal
          idKegiatan={id}
          onClose={() => setShowQrModal(false)}
          onExpired={() => {
            setShowQrModal(false);
            setAlert({ type: 'warning', msg: 'Waktu QR habis. Presensi sudah ditutup' });
            handleAlfaLaluTutup();
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default DetailKegiatanPage;
