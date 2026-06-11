import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetNotifikasi, apiTandaiDibaca, apiTandaiSemuaDibaca } from '../../utils/api';

// ─── Ikon SVG Sidebar ─────────────────────────────────────────────────────────
const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFileText = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/mahasiswa/dashboard', label: 'Dashboard',     icon: <IconHome /> },
  { path: '/mahasiswa/kehadiran', label: 'Kegiatan',      icon: <IconCalendar /> },
  { path: '/mahasiswa/izin',      label: 'Perizinan',     icon: <IconFile /> },
  { path: '/mahasiswa/rekap',     label: 'Rekap Absensi', icon: <IconFileText /> },
];

// ─── Konfigurasi Tipe Notifikasi ──────────────────────────────────────────────
const TIPE_CONFIG = {
  IZIN: {
    label: 'Izin',
    warna: '#f97316',
    warnaBg: '#fff7ed',
    warnaBorder: '#fed7aa',
    warnaBadgeBg: '#ffedd5',
    warnaBadgeText: '#c2410c',
  },
  FOTO_BERANGKAT: {
    label: 'Kepulangan',
    warna: '#3b82f6',
    warnaBg: '#eff6ff',
    warnaBorder: '#bfdbfe',
    warnaBadgeBg: '#dbeafe',
    warnaBadgeText: '#1d4ed8',
  },
  FOTO_PULANG: {
    label: 'Kepulangan',
    warna: '#3b82f6',
    warnaBg: '#eff6ff',
    warnaBorder: '#bfdbfe',
    warnaBadgeBg: '#dbeafe',
    warnaBadgeText: '#1d4ed8',
  },
  KEGIATAN: {
    label: 'Kegiatan',
    warna: '#10b981',
    warnaBg: '#f0fdf4',
    warnaBorder: '#bbf7d0',
    warnaBadgeBg: '#dcfce7',
    warnaBadgeText: '#065f46',
  },
  ABSENSI: {
    label: 'Kegiatan',
    warna: '#10b981',
    warnaBg: '#f0fdf4',
    warnaBorder: '#bbf7d0',
    warnaBadgeBg: '#dcfce7',
    warnaBadgeText: '#065f46',
  },
  INFO: {
    label: 'Notifikasi',
    warna: '#64748b',
    warnaBg: '#f8fafc',
    warnaBorder: '#e2e8f0',
    warnaBadgeBg: '#f1f5f9',
    warnaBadgeText: '#475569',
  },
  PERINGATAN: {
    label: 'Peringatan',
    warna: '#eab308',
    warnaBg: '#fefce8',
    warnaBorder: '#fef08a',
    warnaBadgeBg: '#fef9c3',
    warnaBadgeText: '#a16207',
  },
  PENGUMUMAN: {
    ikon: '📢',
    label: 'Pengumuman',
    warna: '#8b5cf6',
    warnaBg: '#f5f3ff',
    warnaBorder: '#ddd6fe',
    warnaBadgeBg: '#ede9fe',
    warnaBadgeText: '#6d28d9',
  },
};

const DEFAULT_CONFIG = TIPE_CONFIG.INFO;

function getTipeConfig(tipe) {
  return TIPE_CONFIG[tipe] || DEFAULT_CONFIG;
}

// Tentukan URL navigasi untuk MAHASISWA berdasarkan tipe dan id_referensi
function getNavigasiUrl(notif) {
  const { tipe_notifikasi, id_referensi, link_tujuan } = notif;

  // Prioritaskan link_tujuan dari DB jika sudah diisi
  if (link_tujuan && link_tujuan.trim() !== '') return link_tujuan;

  // Fallback: hitung berdasarkan tipe
  if (tipe_notifikasi === 'IZIN') {
    // Mahasiswa klik notif izin → ke halaman detail izin spesifik
    return id_referensi ? `/mahasiswa/izin/${id_referensi}` : '/mahasiswa/izin';
  }
  if (tipe_notifikasi === 'FOTO_BERANGKAT' || tipe_notifikasi === 'FOTO_PULANG') {
    // Notif kepulangan untuk mahasiswa → ke detail izin terkait
    return id_referensi ? `/mahasiswa/izin/${id_referensi}` : '/mahasiswa/izin';
  }
  return null;
}

function getLabelTombol(tipe) {
  if (tipe === 'IZIN') return '📋 Lihat Detail Izin';
  if (tipe === 'FOTO_BERANGKAT' || tipe === 'FOTO_PULANG') return '🏠 Lihat Detail Izin';
  if (tipe === 'KEGIATAN' || tipe === 'ABSENSI') return '📅 Lihat Kegiatan';
  return ' Buka Halaman';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeSince(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' thn lalu';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' bln lalu';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' hr lalu';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' jam lalu';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' mnt lalu';
  return Math.floor(seconds) + ' dtk lalu';
}

// ─── NotifCard ────────────────────────────────────────────────────────────────
function NotifCard({ notif, onRead, onNavigate, index }) {
  const [open, setOpen] = useState(false);
  const unread = !notif.status_baca;
  const cfg = getTipeConfig(notif.tipe_notifikasi);
  const url = getNavigasiUrl(notif);

  const handleCardClick = () => {
    if (unread) onRead(notif.id_notifikasi);
    setOpen(prev => !prev);
  };

  const handleLihat = (e) => {
    e.stopPropagation();
    if (url) onNavigate(notif, url);
  };

  return (
    <div
      className="card-animate"
      style={{
        background: unread ? cfg.warnaBg : '#ffffff',
        border: `1px solid ${unread ? cfg.warnaBorder : '#e2e8f0'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        animationDelay: `${index * 0.04}s`,
        boxShadow: unread
          ? `0 2px 8px ${cfg.warna}14`
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Row collapsed — judul + waktu + chevron ── */}
      <div
        onClick={handleCardClick}
        style={{
          padding: '13px 18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Dot unread */}
        {unread && (
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: cfg.warna, flexShrink: 0,
          }} />
        )}

        {/* Judul */}
        <span style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: unread ? '700' : '500',
          color: unread ? '#1e293b' : '#475569',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {notif.judul}
        </span>

        {/* Waktu */}
        <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {timeSince(notif.tanggal_kirim)}
        </span>

        {/* Chevron */}
        <div style={{
          color: '#cbd5e1',
          fontSize: '10px',
          flexShrink: 0,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </div>
      </div>

      {/* ── Section expanded ── */}
      {open && (
        <div style={{
          borderTop: `1px solid ${cfg.warnaBorder}`,
          padding: '14px 18px 16px',
          background: '#fafafa',
        }}>
          {/* Pesan lengkap */}
          <p style={{
            margin: '0 0 12px',
            fontSize: '13px',
            color: '#475569',
            lineHeight: '1.65',
            whiteSpace: 'pre-wrap',
          }}>
            {notif.pesan}
          </p>

          {/* Row bawah: badge tipe + tombol Lihat */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            {/* Badge tipe */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '600',
              padding: '3px 9px',
              borderRadius: '20px',
              background: cfg.warnaBadgeBg,
              color: cfg.warnaBadgeText,
              border: `1px solid ${cfg.warnaBorder}`,
            }}>
              {cfg.ikon} {cfg.label}
            </span>

            {/* Tombol Lihat */}
            {url && (
              <button
                onClick={handleLihat}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: `1.5px solid ${cfg.warna}`,
                  background: 'transparent',
                  color: cfg.warna,
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = cfg.warnaBadgeBg; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {getLabelTombol(notif.tipe_notifikasi)} →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────
function NotifikasiMahasiswa() {
  const navigate = useNavigate();
  const [notifList, setNotifList] = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetchNotif = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    try {
      const res = await apiGetNotifikasi();
      if (res.status === 'Sukses') setNotifList(res.data.notifikasi);
    } catch (e) { console.error(e); }
    finally { if (!isPoll) setLoading(false); }
  };

  useEffect(() => { fetchNotif(false); }, []);

  // ── Realtime: refresh saat ada update perizinan ────────────────────────────
  const onPerizinanUpdate = useCallback(() => fetchNotif(true), []);
  useSocket("perizinan:update", onPerizinanUpdate);

  const handleTandaiSemua = async () => {
    try { await apiTandaiSemuaDibaca(); fetchNotif(); } catch (e) {}
  };

  const handleRead = async (id) => {
    try {
      await apiTandaiDibaca(id);
      setNotifList(prev => prev.map(n =>
        n.id_notifikasi === id ? { ...n, status_baca: true } : n
      ));
    } catch (e) {}
  };

  const handleNavigate = (notif, url) => {
    if (!notif.status_baca) handleRead(notif.id_notifikasi);
    navigate(url);
  };

  const unreadCount = notifList.filter(n => !n.status_baca).length;

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter page-content" style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <div className="section-animate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Notifikasi</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
              {unreadCount > 0
                ? <><strong style={{ color: '#10b981' }}>{unreadCount}</strong> pesan belum dibaca</>
                : 'Semua pesan sudah dibaca ✓'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleTandaiSemua}
              style={{
                background: 'none',
                border: '1px solid #a7f3d0',
                color: '#059669',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              Tandai Semua Dibaca ✓
            </button>
          )}
        </div>

        {/* List notifikasi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="skeleton-shimmer" style={{ height: '100px', borderRadius: '16px' }} />
            ))
          ) : notifList.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: '#fff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              color: '#94a3b8',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>Inbox Masih Kosong</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>Belum ada notifikasi untukmu.</div>
            </div>
          ) : (
            notifList.map((notif, index) => (
              <NotifCard
                key={notif.id_notifikasi}
                notif={notif}
                onRead={handleRead}
                onNavigate={handleNavigate}
                index={index}
              />
            ))
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

export default NotifikasiMahasiswa;
