import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetIzinDetail, apiUploadFotoBerangkat, apiUploadFotoPulang, apiBatalkanIzin } from '../../utils/api';
import Modal from '../../components/Modal';

// ─── Icons ──────────────────────────────────────────────────────────────────
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFileText = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/></svg>;
const IconArrowLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconUpload = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

const MENU = [
  { path: '/mahasiswa/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { path: '/mahasiswa/kehadiran', label: 'Kegiatan', icon: <IconCalendar /> },
  { path: '/mahasiswa/izin', label: 'Perizinan', icon: <IconFile /> },
  { path: '/mahasiswa/rekap', label: 'Rekap Absensi', icon: <IconFileText /> },
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
  return <span style={{ background: s.bg, color: s.color, fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${s.border}` }}>{s.label}</span>;
}

const formatTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

// ─── Sub-komponen: Kamera HTML5 ──────────────────────────────────────────────
function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error(err);
        setError('Gagal mengakses kamera. Pastikan browser memiliki izin akses kamera.');
      }
    }
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.8);
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: '#000',
      display: 'flex', flexDirection: 'column'
    }}>
      {error ? (
        <div style={{ color: 'white', padding: '20px', textAlign: 'center', margin: 'auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
          <p style={{ lineHeight: 1.6, marginBottom: '24px' }}>{error}</p>
          <button onClick={onCancel} style={{ padding: '10px 24px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Tutup</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '40px 30px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <button onClick={onCancel} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
              Batal
            </button>
            <button onClick={handleCapture} style={{ 
              width: '70px', height: '70px', borderRadius: '50%', 
              background: '#fff', border: '4px solid #cbd5e1',
              boxShadow: '0 0 0 4px rgba(255,255,255,0.4)', cursor: 'pointer',
              transition: 'transform 0.1s'
            }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} />
            <div style={{ width: '70px' }} /> {/* Spacer */}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

// ─── Sub-komponen: Upload Foto Card ─────────────────────────────────────────
function FotoUploadCard({ title, emoji, existingUrl, onUpload, uploading, disabled, disabledReason }) {
  const fileRef = useRef(null);
  const [localFile, setLocalFile] = useState(null);
  const [localPreview, setLocalPreview] = useState('');
  const [fileError, setFileError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const processFile = (f) => {
    setFileError('');
    if (!f) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(f.type)) { setFileError('Format harus JPG / PNG / WebP.'); return; }
    if (f.size > 5 * 1024 * 1024) { setFileError('Ukuran maksimal 5 MB.'); return; }
    setLocalFile(f);
    setLocalPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!localFile) return;
    const fd = new FormData();
    fd.append('foto', localFile);
    const ok = await onUpload(fd);
    if (ok) { setLocalFile(null); setLocalPreview(''); }
  };

  // Jika foto sudah ada di server
  if (existingUrl) {
    return (
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{title}</div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '600',
            padding: '3px 10px', borderRadius: '20px', border: '1px solid #a7f3d0',
          }}>
            <IconCheck /> Terupload
          </span>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <img
            src={existingUrl}
            alt={title}
            style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer' }}
            onClick={() => window.open(existingUrl, '_blank')}
          />
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>Klik foto untuk memperbesar</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      border: `1px solid ${disabled ? '#f1f5f9' : '#e2e8f0'}`,
      borderRadius: '14px', overflow: 'hidden', marginBottom: '16px',
      opacity: disabled ? 0.55 : 1,
    }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>{emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{title}</div>
          {disabled && disabledReason && (
            <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚠️ {disabledReason}
            </div>
          )}
          {disabled && !disabledReason && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Hanya tersedia saat izin berstatus Disetujui</div>}
        </div>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (!disabled) processFile(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${localFile ? '#10b981' : dragOver ? '#6366f1' : '#e2e8f0'}`,
            borderRadius: '12px', padding: '24px 16px', textAlign: 'center',
            background: localFile ? '#f0fdf4' : dragOver ? '#eef2ff' : '#f8fafc',
            transition: 'all 0.2s ease',
          }}
        >
          {localPreview ? (
            <div>
              <img src={localPreview} alt="preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>{localFile?.name}</div>
              <button
                type="button"
                onClick={e => { 
                  e.stopPropagation(); setLocalFile(null); setLocalPreview(''); 
                  if (fileRef.current) fileRef.current.value = ''; 
                }}
                style={{ marginTop: '8px', fontSize: '11px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
              >Batal / Ganti Foto</button>
            </div>
          ) : (
            <div>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#94a3b8' }}>
                <IconUpload />
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '16px' }}>Klik tombol di bawah atau seret foto ke sini</div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); if (!disabled) fileRef.current?.click(); }}
                  disabled={disabled}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '12px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer' }}
                > Dari Galeri</button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); if (!disabled) setShowCamera(true); }}
                  disabled={disabled}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '12px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer' }}
                > Ambil Foto</button>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px' }}>JPG, PNG, WebP — maks. 5 MB</div>
            </div>
          )}
        </div>
        <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/jpg,image/webp" style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
        
        {showCamera && (
          <CameraCapture 
            onCancel={() => setShowCamera(false)} 
            onCapture={(file) => {
              processFile(file);
              setShowCamera(false);
            }} 
          />
        )}

        {fileError && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px', background: '#fef2f2', padding: '6px 10px', borderRadius: '8px' }}>{fileError}</div>}
        {localFile && (
          <button
            onClick={handleSubmit}
            disabled={uploading || disabled}
            style={{
              marginTop: '12px', width: '100%', padding: '11px', borderRadius: '10px',
              background: uploading ? '#94a3b8' : '#10b981', color: '#ffffff',
              border: 'none', fontWeight: '700', fontSize: '14px', cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {uploading ? 'Mengupload...' : `Kirim ${title}`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Halaman Utama ───────────────────────────────────────────────────────────
function IzinDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [izin, setIzin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [uploadingBerangkat, setUploadingBerangkat] = useState(false);
  const [uploadingPulang, setUploadingPulang] = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchDetail = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setIsRefreshing(true);
    const res = await apiGetIzinDetail(id);
    if (res.status === 'Sukses') setIzin(res.data);
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => { fetchDetail(false); }, [id]);
  usePolling(() => fetchDetail(true), 10000);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleBatalkan = async () => {
    setIsCancelling(true);
    try {
      const res = await apiBatalkanIzin(id);
      if (res.status === 'Sukses') {
        setIzin(prev => ({ ...prev, status_pengajuan: 'DIBATALKAN' }));
        setShowModal(false);
        showAlert('success', 'Pengajuan izin berhasil dibatalkan');
        setTimeout(() => navigate('/mahasiswa/izin'), 1500);
      } else {
        showAlert('error', res.message || 'Gagal membatalkan pengajuan');
      }
    } catch (err) {
      showAlert('error', 'Gagal membatalkan pengajuan');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUploadBerangkat = async (formData) => {
    setUploadingBerangkat(true);
    const res = await apiUploadFotoBerangkat(id, formData);
    setUploadingBerangkat(false);
    if (res.status === 'Sukses') {
      showAlert('success', 'Foto bukti keberangkatan berhasil diupload!');
      await fetchDetail();
      return true;
    } else {
      showAlert('error', res.message || 'Gagal upload foto berangkat.');
      return false;
    }
  };

  const handleUploadPulang = async (formData) => {
    setUploadingPulang(true);
    const res = await apiUploadFotoPulang(id, formData);
    setUploadingPulang(false);
    if (res.status === 'Sukses') {
      showAlert('success', 'Foto bukti kepulangan berhasil diupload!');
      await fetchDetail();
      return true;
    } else {
      showAlert('error', res.message || 'Gagal upload foto pulang.');
      return false;
    }
  };

  if (loading) {
    return (
      <DashboardLayout menuItems={MENU}>
        <div className="page-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '640px' }}>
            {[180, 120, 140, 200].map((h, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: `${h}px`, borderRadius: '14px' }} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!izin) {
    return (
      <DashboardLayout menuItems={MENU}>
        <div className="page-content" style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
          <div style={{ fontWeight: '600', color: '#475569' }}>Data perizinan tidak ditemukan.</div>
          <button onClick={() => navigate('/mahasiswa/izin')} style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            ← Kembali
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isDisetujui = izin.status_pengajuan === 'DISETUJUI';
  const isImageDoc = izin.dokumen_pendukung && /\.(jpg|jpeg|png|gif|webp)$/i.test(izin.dokumen_pendukung);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter page-content" style={{ maxWidth: '680px' }}>

        {/* Header */}
        <div className="section-animate" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/mahasiswa/izin')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#475569',
              flexShrink: 0, transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <IconArrowLeft />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>Detail Perizinan</h1>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div className="alert-modern" style={{
            marginBottom: '20px',
            background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: alert.type === 'success' ? '#047857' : '#dc2626',
          }}>
            <span>{alert.type === 'success' ? '✓' : '⚠'}</span> {alert.msg}
          </div>
        )}

        {/* ── CARD 1: Info Pengajuan ── */}
        <div className="stat-card card-animate card-animate-1" style={{ marginBottom: '16px', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Info Pengajuan</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{izin.jenis_izin.replace(/_/g, ' ')}</span>
              <BadgeIzin status={izin.status_pengajuan} />
            </div>
          </div>

          {/* Periode */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Periode</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
              {formatTgl(izin.tanggal_mulai)} - {formatTgl(izin.tanggal_selesai)}
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#64748b', fontWeight: '400' }}>({izin.durasi_hari} hari)</span>
            </div>
          </div>

          {/* Alasan */}
          <div style={{ padding: '14px 20px', borderBottom: izin.dokumen_pendukung ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Alasan</div>
            <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{izin.alasan}</div>
          </div>

          {/* Dokumen Pendukung */}
          {izin.dokumen_pendukung && (
            <div style={{ padding: '14px 20px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}> Dokumen Pendukung</div>
              <button
                onClick={() => isImageDoc ? setImgPreview(izin.dokumen_pendukung) : window.open(izin.dokumen_pendukung, '_blank')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Lihat Dokumen
              </button>
            </div>
          )}
        </div>

        {izin.status_pengajuan === 'MENUNGGU' && (
          <div style={{ marginBottom: '16px' }}>
            <button 
              onClick={() => setShowModal(true)}
              disabled={isCancelling}
              style={{
                background: 'transparent',
                border: '1.5px solid #dc2626',
                color: '#dc2626',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                display: 'block',
                textAlign: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Batalkan Pengajuan
            </button>
          </div>
        )}

        {/* ── CARD 2: Pesan Fasilitator ── */}
        <div className="stat-card card-animate card-animate-2" style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}> Pesan Fasilitator</div>
          </div>
          <div style={{ padding: '14px 20px' }}>
            {izin.catatan_fasilitator ? (
              <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {izin.catatan_fasilitator}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic' }}>Belum ada pesan dari fasilitator.</div>
            )}
            {izin.fasilitator && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
                - {izin.fasilitator.nama}
              </div>
            )}
          </div>
        </div>

        {/* ── CARD 3 & 4: Upload Foto (hanya saat DISETUJUI atau SELESAI) ── */}
        {(isDisetujui || izin.status_pengajuan === 'SELESAI') && (
          <div className="card-animate card-animate-3">
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Bukti Foto
            </div>

            <FotoUploadCard
              title="Bukti Sampai di Tujuan"
              emoji="➡️"
              existingUrl={izin.foto_berangkat}
              onUpload={handleUploadBerangkat}
              uploading={uploadingBerangkat}
              disabled={!isDisetujui}
            />

            <FotoUploadCard
              title="Bukti Sudah di Asrama"
              emoji="⬅️"
              existingUrl={izin.foto_pulang}
              onUpload={handleUploadPulang}
              uploading={uploadingPulang}
              disabled={!isDisetujui || !izin.foto_berangkat}
              disabledReason={!izin.foto_berangkat ? 'Upload foto bukti tiba di tujuan terlebih dahulu.' : null}
            />
          </div>
        )}

      </div>

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
                fontWeight: '700', color: '#475569',
              }}
            >✕</button>
            <img
              src={imgPreview}
              alt="Dokumen"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', display: 'block' }}
            />
          </div>
        )}
      </Modal>
      {/* Modal Konfirmasi Batal */}
      {showModal && createPortal(
        <div 
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.15)', textAlign: 'center'
            }}
          >
            <div style={{ width: '56px', height: '56px', background: '#fef2f2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
              ⚠
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Batalkan Pengajuan?</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              Yakin ingin membatalkan pengajuan izin ini? Tindakan ini tidak dapat diurungkan.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowModal(false)}
                disabled={isCancelling}
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: isCancelling ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
              >
                Tidak, Kembali
              </button>
              <button 
                onClick={handleBatalkan}
                disabled={isCancelling}
                style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: isCancelling ? 'not-allowed' : 'pointer', opacity: isCancelling ? 0.7 : 1, transition: 'all 0.2s' }}
              >
                {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </DashboardLayout>
  );
}

export default IzinDetailPage;
