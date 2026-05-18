/**
 * ScanQrModal.jsx — Modal Scan QR Absensi (Mahasiswa)
 * Strategi deteksi QR:
 *  1. BarcodeDetector API (Chromium built-in, paling ringan)
 *  2. jsQR via CDN (fallback canvas-based, works everywhere)
 *  3. Manual input (jika kamera tidak tersedia sama sekali)
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiScanQr } from '../utils/api';

// Load jsQR dari CDN jika BarcodeDetector tidak ada
function loadJsQr() {
  return new Promise((resolve) => {
    if (window.jsQR) { resolve(window.jsQR); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.onload  = () => resolve(window.jsQR);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

export default function ScanQrModal({ onClose }) {
  const [status, setStatus]             = useState('init');  // init|scanning|loading|success|error|manual
  const [message, setMessage]           = useState('');
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [waktuHadir, setWaktuHadir]     = useState('');
  const [manualToken, setManualToken]   = useState('');
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const closingRef = useRef(false);

  // Callback ref: langsung attach stream ke <video> saat elemen mount
  const videoCallbackRef = (node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  };

  /* ── Stop kamera ─────────────────────────────────────────── */
  const stopCamera = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleClose = (isSuccess = false) => {
    if (closingRef.current) return;
    closingRef.current = true;
    stopCamera();
    // Jika status sudah success, atau diset true eksplisit (saat timeout)
    onClose(isSuccess === true || status === 'success');
  };

  /* ── Submit token ke API ─────────────────────────────────── */
  const submitToken = async (token) => {
    const trimmed = token.trim();
    if (!trimmed) return;
    stopCamera();
    setStatus('loading');
    try {
      const res = await apiScanQr(trimmed);
      if (res.status === 'Sukses') {
        setNamaKegiatan(res.data?.nama_kegiatan || '');
        setWaktuHadir(
          res.data?.waktu_hadir
            ? new Date(res.data.waktu_hadir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : ''
        );
        setStatus('success');
        setTimeout(() => handleClose(true), 2500);
      } else {
        setMessage(res.message || 'Terjadi kesalahan. Coba lagi.');
        setStatus('error');
      }
    } catch {
      setMessage('Gagal terhubung ke server. Periksa koneksi.');
      setStatus('error');
    }
  };

  /* ── Start kamera + scan QR ──────────────────────────────── */
  const startCamera = async () => {
    setStatus('init');

    // Minta akses kamera
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Izin kamera ditolak. Aktifkan izin kamera di browser, lalu coba lagi.'
        : 'Kamera tidak tersedia di perangkat ini.';
      setMessage(msg);
      setStatus('manual');
      return;
    }

    streamRef.current = stream;
    // Attach ke video — callback ref sudah handle ini,
    // tapi set ulang jika elemen sudah ada sebelum stream ready
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      try { await videoRef.current.play(); } catch (_) {}
    }
    setStatus('scanning');

    // Pilih metode decode
    const useBarcodeDetector = 'BarcodeDetector' in window;
    let detector = null;
    let jsQr     = null;

    if (useBarcodeDetector) {
      // eslint-disable-next-line no-undef
      detector = new BarcodeDetector({ formats: ['qr_code'] });
    } else {
      jsQr = await loadJsQr();
    }

    // Canvas untuk jsQR
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx    = canvas.getContext('2d', { willReadFrequently: true });

    const tick = async () => {
      const video = videoRef.current;
      if (!video || !streamRef.current) return;

      try {
        if (useBarcodeDetector && detector) {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            await submitToken(barcodes[0].rawValue);
            return;
          }
        } else if (jsQr) {
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (w && h) {
            canvas.width  = w;
            canvas.height = h;
            ctx.drawImage(video, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const code = jsQr(imageData.data, imageData.width, imageData.height);
            if (code) {
              await submitToken(code.data);
              return;
            }
          }
        }
      } catch (_) {}

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const t = setTimeout(() => startCamera(), 300);
    return () => { clearTimeout(t); stopCamera(); };
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ─── Render ───────────────────────────────────────────────── */
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(2,8,30,0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; }
          50%  { top: 86%; }
          100% { top: 10%; }
        }
        @keyframes successPop {
          0%  { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100%{ transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Hidden canvas untuk jsQR decode */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{
        background: '#0f172a', borderRadius: '24px',
        width: '100%', maxWidth: '420px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        animation: 'fadeUp 0.25s ease',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 22px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M3 17v2a2 2 0 0 0 2 2h2M17 3h2a2 2 0 0 1 2 2v2M17 21h2a2 2 0 0 0 2-2v-2"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <rect x="7" y="7" width="4" height="4" rx="1" fill="white"/>
                <rect x="13" y="7" width="4" height="4" rx="1" fill="white"/>
                <rect x="7" y="13" width="4" height="4" rx="1" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Scan QR Absen</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '1px' }}>
                {status === 'manual' ? 'Input kode manual' : 'Arahkan kamera ke QR Code'}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.13)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '22px' }}>

          {/* INIT / LOADING */}
          {(status === 'init' || status === 'loading') && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: '3px solid rgba(16,185,129,0.2)',
                borderTop: '3px solid #10b981',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ fontSize: '13px' }}>
                {status === 'loading' ? 'Mencatat kehadiran...' : 'Memulai kamera...'}
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '24px 0', animation: 'fadeUp 0.3s ease' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'successPop 0.4s ease',
              }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div style={{ color: 'white', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
                Kehadiran Tercatat!
              </div>
              <div style={{ color: '#6ee7b7', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                {namaKegiatan}
              </div>
              {waktuHadir && (
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>Pukul {waktuHadir}</div>
              )}
              <div style={{ marginTop: '20px', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
                Modal menutup otomatis...
              </div>
            </div>
          )}

          {/* ERROR */}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0', animation: 'fadeUp 0.3s ease' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(239,68,68,0.35)',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ color: '#f87171', fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>
                Gagal Absen
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.55)', fontSize: '13px', lineHeight: '1.65',
                marginBottom: '20px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: '10px', padding: '12px',
              }}>
                {message}
              </div>
            </div>
          )}

          {/* SCANNING — video feed */}
          {status === 'scanning' && (
            <>
              <div style={{
                position: 'relative', width: '100%', aspectRatio: '1/1',
                borderRadius: '16px', overflow: 'hidden',
                background: '#000', marginBottom: '14px',
              }}>
                <video
                  ref={videoCallbackRef}
                  muted playsInline autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Corner brackets */}
                {[
                  { top: 14, left: 14, borderTop: '3px solid #10b981', borderLeft: '3px solid #10b981', borderRadius: '4px 0 0 0' },
                  { top: 14, right: 14, borderTop: '3px solid #10b981', borderRight: '3px solid #10b981', borderRadius: '0 4px 0 0' },
                  { bottom: 14, left: 14, borderBottom: '3px solid #10b981', borderLeft: '3px solid #10b981', borderRadius: '0 0 0 4px' },
                  { bottom: 14, right: 14, borderBottom: '3px solid #10b981', borderRight: '3px solid #10b981', borderRadius: '0 0 4px 0' },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 28, height: 28, pointerEvents: 'none', ...s }} />
                ))}
                {/* Scan line */}
                <div style={{
                  position: 'absolute', left: 14, right: 14, height: '3px',
                  background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                  animation: 'scanLine 2s ease-in-out infinite',
                  borderRadius: '2px', pointerEvents: 'none',
                }} />
              </div>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '12px' }}>
                Posisikan QR Code fasilitator di dalam bingkai
              </div>
            </>
          )}

          {/* MANUAL input */}
          {status === 'manual' && (
            <div style={{ animation: 'fadeUp 0.25s ease' }}>
              {message && (
                <div style={{
                  background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
                  borderRadius: '10px', padding: '10px 14px',
                  color: '#fbbf24', fontSize: '12px', marginBottom: '16px', lineHeight: '1.6',
                }}>
                  ⚠ {message}
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                  Masukkan QR Token
                </label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={e => setManualToken(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitToken(manualToken); }}
                  placeholder="Token dari fasilitator (UUID format)"
                  autoFocus
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.13)',
                    color: 'white', fontSize: '13px', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#10b981'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setMessage(''); setStatus('init'); setTimeout(() => startCamera(), 200); }}
                  style={{
                    flex: 1, padding: '11px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '13px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Buka Kamera
                </button>
                <button
                  onClick={() => submitToken(manualToken)}
                  disabled={!manualToken.trim()}
                  style={{
                    flex: 1, padding: '11px', borderRadius: '10px',
                    background: manualToken.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(16,185,129,0.2)',
                    border: 'none', color: 'white', fontWeight: '700', fontSize: '13px',
                    cursor: manualToken.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: manualToken.trim() ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >Absen Sekarang</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
