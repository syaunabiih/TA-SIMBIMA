/**
 * QrAbsensiModal.jsx — Modal QR Absensi (Fasilitator)
 * Tanpa library eksternal: QR via API qrserver.com (image)
 * + countdown timer + live list hadir polling 5s
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiGetQrToken } from '../utils/api';
import { useSocket } from '../hooks/useSocket';

const BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api`;
const getToken = () => localStorage.getItem('simbima_token');

function useCountdown(expiresAt) {
  const [sisa, setSisa] = useState(null);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setSisa(diff);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return sisa;
}

function formatCountdown(s) {
  if (s === null) return '—';
  if (s === 0) return 'Expired';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// QR code ditampilkan sebagai <img> dari API publik qrserver.com
function QRImage({ value, size = 240 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
  return (
    <img
      src={url}
      alt="QR Code Absensi"
      width={size}
      height={size}
      style={{ borderRadius: '4px', display: 'block' }}
    />
  );
}

export default function QrAbsensiModal({ idKegiatan, onClose, onExpired }) {
  const [qrData, setQrData]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [hadirList, setHadirList]     = useState([]);
  const pollRef                       = useRef(null);

  const sisa = useCountdown(qrData?.expires_at);

  useEffect(() => {
    if (sisa === 0 && onExpired) {
      onExpired();
    }
  }, [sisa, onExpired]);

  // Fetch QR token
  useEffect(() => {
    setLoading(true);
    apiGetQrToken(idKegiatan)
      .then(res => {
        if (res.status === 'Sukses') setQrData(res.data);
        else setError(res.message || 'Gagal memuat QR token.');
      })
      .catch(() => setError('Gagal terhubung ke server.'))
      .finally(() => setLoading(false));
  }, [idKegiatan]);

  // Polling list hadir dari semua slot
  const fetchHadirFromExisting = useCallback(() => {
    const slots = ['1-A','1-B','2-A','2-B','3-A','3-B','4-A','4-B','5-A','5-B'];
    const allHadir = [];
    let done = 0;
    slots.forEach(slot => {
      const [lantai, blok] = slot.split('-');
      fetch(`${BASE_URL}/kegiatan/${idKegiatan}/kehadiran?lantai=${lantai}&blok=${blok}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
        .then(r => r.json())
        .then(res => {
          if (Array.isArray(res.data)) {
            res.data.forEach(m => { if (m.status_kehadiran === 'HADIR') allHadir.push(m); });
          }
        })
        .catch(() => {})
        .finally(() => {
          done++;
          if (done === slots.length) setHadirList([...allHadir]);
        });
    });
  }, [idKegiatan]);

  useEffect(() => {
    fetchHadirFromExisting();
  }, [fetchHadirFromExisting]);

  // ── Realtime: update list hadir saat ada absensi baru ─────────────────────
  useSocket("absensi:update", fetchHadirFromExisting);

  // Escape key
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const isExpired = sisa === 0;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(2,8,30,0.93)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes qrPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
          50%      { box-shadow: 0 0 0 20px rgba(16,185,129,0); }
        }
        @keyframes slideInRow {
          from { opacity:0; transform:translateX(-10px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2"/>
              <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2"/>
              <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2"/>
              <rect x="13" y="13" width="4" height="4" rx="1" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>QR Absensi</div>
            {qrData && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '2px' }}>{qrData.nama_kegiatan}</div>}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          title="Tutup (Esc)"
        >✕</button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Panel kiri: QR + countdown */}
        <div style={{
          flex: '0 0 auto', width: '480px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 40px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
              <div style={{ fontSize: '13px' }}>Memuat QR Code...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#f87171', padding: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>❌</div>
              <div style={{ fontSize: '13px' }}>{error}</div>
            </div>
          ) : qrData ? (
            <>
              {/* Nama kegiatan saja — tanpa waktu */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>
                  {qrData.nama_kegiatan}
                </div>
              </div>

              {/* QR Image */}
              <div style={{
                background: 'white', borderRadius: '20px', padding: '18px',
                animation: isExpired ? 'none' : 'qrPulse 2.5s infinite',
                opacity: isExpired ? 0.35 : 1,
                transition: 'opacity 0.4s',
                position: 'relative',
              }}>
                <QRImage value={qrData.qr_token} size={220} />
                {isExpired && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '20px',
                    background: 'rgba(0,0,0,0.62)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}>
                    <div style={{ fontSize: '28px' }}>⏰</div>
                    <div style={{ color: '#fca5a5', fontWeight: '700', fontSize: '15px' }}>QR Expired</div>
                  </div>
                )}
              </div>

              {/* Countdown */}
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <div style={{
                  fontSize: '46px', fontWeight: '800',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', lineHeight: 1,
                  color: isExpired ? '#f87171' : sisa < 120 ? '#fbbf24' : '#10b981',
                  transition: 'color 0.4s',
                }}>
                  {formatCountdown(sisa)}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '6px' }}>
                  {isExpired ? 'QR Code sudah tidak aktif' : ''}
                </div>
              </div>

              {/* Instruksi */}
              <div style={{
                marginTop: '20px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.22)',
                borderRadius: '12px', padding: '12px 18px',
                textAlign: 'center', maxWidth: '320px',
              }}>
                <div style={{ color: '#6ee7b7', fontSize: '12px', lineHeight: 1.65 }}>
                  Mahasiswa scan QR ini via<br />
                  <strong>Kegiatan → Scan QR Absen</strong>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Panel kanan: Live list hadir */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
            <div>
              <div style={{ color: 'white', fontSize: '17px', fontWeight: '700' }}>Mahasiswa Hadir</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '3px' }}></div>
            </div>
            <div style={{
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.28)',
              borderRadius: '20px', padding: '6px 16px',
              color: '#6ee7b7', fontWeight: '800', fontSize: '22px',
            }}>
              {hadirList.length}
            </div>
          </div>

          {hadirList.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'rgba(255,255,255,0.25)' }}>
              <div style={{ fontSize: '48px' }}></div>
              <div style={{ fontSize: '14px' }}>Belum ada mahasiswa yang scan QR</div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {hadirList.map((m, i) => (
                <div key={m.id_mahasiswa || i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  animation: 'slideInRow 0.3s ease',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '700', fontSize: '13px', flexShrink: 0,
                  }}>
                    {(m.nama || '?').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>{m.nama}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
                      {m.nim && `NIM: ${m.nim}`}{m.nomor_kamar && ` · Kamar ${m.nomor_kamar}`}
                    </div>
                  </div>
                  <span style={{
                    background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.32)',
                    borderRadius: '20px', padding: '3px 10px',
                    color: '#6ee7b7', fontSize: '11px', fontWeight: '600', flexShrink: 0,
                  }}>Hadir</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
