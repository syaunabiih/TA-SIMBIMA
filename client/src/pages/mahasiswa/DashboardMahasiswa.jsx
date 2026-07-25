import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetDashboardMahasiswa, apiGetKegiatan } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ScanQrModal from '../../components/ScanQrModal';

const BRAND = '#059669';

const IconHome = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const IconCalendar = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" /></svg>;
const IconFile = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" /><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" /></svg>;
const IconFileText = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" /><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" /><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" /><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" /></svg>;
const IconHeart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

const MENU = [
  { path: '/mahasiswa/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { path: '/mahasiswa/kehadiran', label: 'Kegiatan', icon: <IconCalendar /> },
  { path: '/mahasiswa/izin', label: 'Perizinan', icon: <IconFile /> },
  { path: '/mahasiswa/rekap', label: 'Rekap Absensi', icon: <IconFileText /> },
];

const fmt = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const cardStyle = { background: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '20px' };

function StatCard({ label, value, color, icon, sub, onClick, delay = 0 }) {
  const animated = useCountUp(value ?? 0);
  return (
    <div
      className={`card-animate card-animate-${delay + 1}`}
      onClick={onClick}
      style={{ ...cardStyle, cursor: onClick ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1 }}>{animated}</div>
        {sub && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>{sub}</div>}
        {onClick && <div style={{ fontSize: '12px', color, marginTop: '4px', fontWeight: '600' }}>Lihat semua →</div>}
      </div>
    </div>
  );
}

function SkeletonBlock({ h = 80 }) {
  return <div className="skeleton-shimmer" style={{ height: `${h}px`, borderRadius: '12px' }} />;
}

function BadgeIzin({ status }) {
  const map = {
    MENUNGGU: { label: 'Menunggu', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    DISETUJUI: { label: 'Disetujui', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    DITOLAK: { label: 'Ditolak', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    DIBATALKAN: { label: 'Dibatalkan', bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
    SELESAI: { label: 'Selesai', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  };
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', border: `1px solid ${s.border}` }}>{s.label}</span>;
}

function BadgeKehadiran({ status }) {
  if (!status) return <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Belum diisi</span>;
  const map = {
    HADIR: { label: 'Hadir', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    ALPHA: { label: 'Alpha', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    IZIN: { label: 'Izin', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    SAKIT: { label: 'Sakit', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    BELUM: { label: 'Belum Diisi', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
  };
  const s = map[status] || { label: status, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
  return <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', border: `1px solid ${s.border}` }}>{s.label}</span>;
}

function EmptyState({ icon = '📭', msg = 'Belum ada data' }) {
  return (
    <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '13px', fontWeight: '500' }}>{msg}</div>
    </div>
  );
}

function DashboardMahasiswa() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kegiatanBerlangsung, setKegiatanBerlangsung] = useState([]);
  const [showScanModal, setShowScanModal] = useState(false);

  const nama = localStorage.getItem('simbima_nama') || 'Mahasiswa';

  const fetchDashboard = useCallback((isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setIsRefreshing(true);

    Promise.all([apiGetDashboardMahasiswa()])
      .then(([resDash]) => {
        if (resDash.data) setData(resDash.data);
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  const fetchKegiatan = useCallback(() => {
    apiGetKegiatan()
      .then(res => {
        if (res.data) {
          setKegiatanBerlangsung(res.data.filter(k => k.status_kegiatan === 'BERLANGSUNG' && !k.status_kehadiran_saya));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchDashboard(false);
    fetchKegiatan();
  }, [fetchDashboard, fetchKegiatan]);

  // ── Realtime: refresh saat ada update absensi atau kegiatan ───────────────
  const onAbsensiUpdate = useCallback(() => { fetchDashboard(true); fetchKegiatan(); }, [fetchDashboard, fetchKegiatan]);
  const onKegiatanUpdate = useCallback(() => fetchKegiatan(), [fetchKegiatan]);
  const onRekapUpdate = useCallback(() => fetchDashboard(true), [fetchDashboard]); // rekap baru dari fasilitator
  useSocket("absensi:update", onAbsensiUpdate);
  useSocket("kegiatan:update", onKegiatanUpdate);
  useSocket("rekap:update",   onRekapUpdate);

  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const izinAktif = data?.izin_aktif ?? null;

  const fmtTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter page-content">

        {/* ── Header ── */}
        <div className="section-animate" style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>Selamat Datang</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px' }}>
            Halo, <strong style={{ color: BRAND }}>{nama}</strong> | {todayLabel}
          </p>
        </div>

        {/* ── Banner Kegiatan Berlangsung (cukup 1) ── */}
        {kegiatanBerlangsung.length > 0 && (() => {
          const k = kegiatanBerlangsung[0]; // Ambil kegiatan pertama saja
          return (
            <div className="section-animate" style={{ marginBottom: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)',
                border: '1px solid rgba(16,185,129,0.4)',
                borderLeft: '5px solid #10b981',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '14px',
                boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  {/* Pulsing dot */}
                  <div style={{ flexShrink: 0, position: 'relative' }}>
                    <div style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 0 0 rgba(16,185,129,0.5)',
                      animation: 'pulse 1.5s infinite',
                    }} />
                    <style>{`@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 70% { box-shadow: 0 0 0 10px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }`}</style>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>
                    Absensi Sedang Berlangsung
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '2px' }}>
                      {k.nama_kegiatan}
                      {kegiatanBerlangsung.length > 1 && (
                        <span style={{ marginLeft: '8px', opacity: 0.7 }}>+ {kegiatanBerlangsung.length - 1} kegiatan lainnya</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a7f3d0' }}>
                      {k.lokasi} 
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowScanModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', borderRadius: '10px',
                    color: 'white', fontWeight: '700', fontSize: '13px',
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(16,185,129,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.4)'; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2M3 17v2a2 2 0 0 0 2 2h2M17 3h2a2 2 0 0 1 2 2v2M17 21h2a2 2 0 0 0 2-2v-2" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    <rect x="7" y="7" width="4" height="4" rx="1" fill="white"/>
                    <rect x="13" y="7" width="4" height="4" rx="1" fill="white"/>
                    <rect x="7" y="13" width="4" height="4" rx="1" fill="white"/>
                  </svg>
                  Scan QR Absen
                </button>
              </div>
            </div>
          );
        })()}


        {/* ── Banner Rekap Terbaru ── */}
        {!loading && data?.rekap_terbaru && (() => {
          const r = data.rekap_terbaru;
          const iqabMap = {
            REWARD: { label: 'Reward ', bg: 'rgba(255,255,255,0.25)', color: '#fef9c3', border: 'rgba(255,255,255,0.4)' },
            BEBAS_IQAB: { label: 'Bebas Iqab ✓', bg: 'rgba(255,255,255,0.2)', color: '#e0f2fe', border: 'rgba(255,255,255,0.35)' },
            DAPAT_IQAB: { label: 'Dapat Iqab ⚠', bg: 'rgba(222, 4, 4, 0.4)', color: '#f1f1f1ff', border: 'rgba(255,150,150,0.4)' },
          };
          const iqab = iqabMap[r.status_iqab] || iqabMap.BEBAS_IQAB;
          const pctColor = r.persentase_kehadiran >= 80 ? '#bfdbfe' : r.persentase_kehadiran >= 60 ? '#fde68a' : '#fca5a5';
          return (
            <div className="section-animate" style={{
              background: 'linear-gradient(135deg, #1b28bfff 0%, #7c88f5ff 60%, rgba(62, 72, 255, 1) 100%)',
              borderRadius: '14px', padding: '18px 22px', color: 'white',
              marginBottom: '20px', boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '16px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                   Rekap Absensi Terbaru
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', lineHeight: 1.3 }}>
                  {r.periode}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: pctColor }}>
                    {r.persentase_kehadiran.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: '12px', color: '#bfdbfe' }}>
                    Kehadiran • {r.total_hadir}/{r.total_kegiatan} kegiatan
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    background: iqab.bg, color: iqab.color,
                    border: `1px solid ${iqab.border}`,
                    padding: '2px 10px', borderRadius: '20px'
                  }}>
                    {iqab.label}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#93c5fd', marginTop: '6px' }}>
                  Diterbitkan: {r.tanggal_publikasi}
                </div>
              </div>
              <button
                onClick={() => navigate('/mahasiswa/rekap')}
                style={{
                  background: 'rgba(255,255,255,0.15)', color: 'white',
                  border: '1px solid rgba(255,255,255,0.35)',
                  padding: '10px 18px', borderRadius: '10px',
                  fontWeight: '700', cursor: 'pointer', fontSize: '13px',
                  whiteSpace: 'nowrap', backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              >
                Lihat Rekap Saya →
              </button>
            </div>
          );
        })()}

        {/* ── Banner Izin Aktif ── */}
        {loading ? (
          <div style={{ marginBottom: '20px' }}><SkeletonBlock h={100} /></div>
        ) : (izinAktif && izinAktif.status === 'DISETUJUI') && (
          <div className="section-animate" style={{
            background: `linear-gradient(135deg, ${BRAND} 0%, #014d51 100%)`,
            borderRadius: '16px', padding: '22px 24px', color: 'white',
            marginBottom: '24px', boxShadow: `0 8px 24px ${BRAND}40`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '8px', color: '#a7f3d0' }}>
                  Kamu Sedang Izin
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                  {izinAktif.jenis_izin.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '13px', color: '#d1fae5', opacity: 0.9 }}>
                  Kembali: {izinAktif.tanggal_selesai}
                  {izinAktif.hari_lagi > 0
                    ? <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '1px 8px', borderRadius: '20px', fontSize: '12px' }}>{izinAktif.hari_lagi} hari lagi</span>
                    : <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '1px 8px', borderRadius: '20px', fontSize: '12px' }}>Hari ini</span>
                  }
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {(!izinAktif.foto_berangkat || !izinAktif.foto_pulang) ? (
                  <button
                    onClick={() => navigate(`/mahasiswa/izin/${izinAktif.id}`)}
                    style={{
                      background: 'white',
                      color: BRAND,
                      border: 'none',
                      padding: '9px 16px', borderRadius: '10px', fontWeight: '700',
                      cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap',
                    }}
                  >
                    {!izinAktif.foto_berangkat
                      ? ' Upload Foto Sudah Sampai Tujuan'
                      : ' Upload Bukti Telah Balik ke Asrama'}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/mahasiswa/izin/${izinAktif.id}`)}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '9px 16px', borderRadius: '10px', fontWeight: '700',
                      cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap',
                    }}
                  >
                    ✅ Selesai Upload Foto
                  </button>
                )}
              </div>
            </div>
            {!izinAktif.foto_berangkat && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#fde68a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Upload foto bukti tiba di tujuan terlebih dahulu sebelum upload foto kepulangan.
              </div>
            )}
          </div>
        )}

        {/* ── ROW 1: 5 Stat Cards ── */}
        <div className="grid-responsive-5" style={{ marginBottom: '24px' }}>
          {loading ? (
            [1, 2, 3, 4, 5].map(i => <SkeletonBlock key={i} h={120} />)
          ) : (
            <>
              <StatCard
                label="Total Kegiatan"
                value={data?.stat?.total_kegiatan ?? 0}
                color={BRAND}
                sub="Bulan ini"
                delay={0}
                icon={<IconCalendar />}
              />
              <StatCard
                label="Jumlah Hadir"
                value={data?.stat?.kehadiran_count ?? 0}
                color="#2563eb"
                sub="Bulan ini"
                delay={1}
                icon={<IconCalendar />}
              />
              <StatCard
                label="Jumlah Alfa"
                value={data?.stat?.alfa_bulan_ini ?? 0}
                color="#dc2626"
                sub="Bulan ini"
                delay={2}
                icon={<IconFile />}
              />
              <StatCard
                label="Jumlah Izin"
                value={data?.stat?.izin_bulan_ini ?? 0}
                color="#7c3aed"
                sub="Bulan ini"
                delay={3}
                icon={<IconFileText />}
              />
              <StatCard
                label="Jumlah Sakit"
                value={data?.stat?.sakit_bulan_ini ?? 0}
                color="#d97706"
                sub="Bulan ini"
                delay={4}
                icon={<IconHeart />}
              />
            </>
          )}
        </div>

        {/* ── ROW 1.5: Tren Kehadiran Mingguan (Line Chart) ── */}
        <div style={{ marginBottom: '24px' }}>
          <div className="stat-card card-animate card-animate-3" style={{ padding: '24px', overflow: 'hidden' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Tren Kehadiran Mingguan</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>10 Minggu Terakhir</div>
            </div>

            {loading ? (
              <SkeletonBlock h={250} />
            ) : !data?.tren_mingguan?.length ? (
              <EmptyState icon="📈" msg="Data tren belum tersedia" />
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    key={JSON.stringify(data.tren_mingguan)}
                    data={data.tren_mingguan}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="minggu"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '20px' }}
                      iconType="circle"
                    />
                    <Line
                      name="Hadir"
                      type="monotone"
                      dataKey="hadir"
                      stroke="#01696f"
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#01696f' }}
                    />
                    <Line
                      name="Alfa"
                      type="monotone"
                      dataKey="alfa"
                      stroke="#dc2626"
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#dc2626' }}
                    />
                    <Line
                      name="Izin"
                      type="monotone"
                      dataKey="izin"
                      stroke="#2563eb"
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                    />
                    <Line
                      name="Sakit"
                      type="monotone"
                      dataKey="sakit"
                      stroke="#d97706"
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#d97706' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 2: Riwayat Kegiatan & Izin (2 Kolom) ── */}
        <div style={{ marginBottom: '32px', display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          
          {/* Riwayat Kegiatan */}
          <div className="stat-card card-animate card-animate-4" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Riwayat Kegiatan Terbaru</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>4 kegiatan terakhir</div>
              </div>
              <button
                onClick={() => navigate('/mahasiswa/kehadiran')}
                style={{ fontSize: '12px', color: BRAND, fontWeight: '600', background: `${BRAND}10`, border: `1px solid ${BRAND}30`, padding: '4px 12px', borderRadius: '20px', cursor: 'pointer' }}
              >Lihat Semua</button>
            </div>
            {loading ? (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} h={64} />)}
              </div>
            ) : !data?.riwayat_kegiatan?.length ? (
              <EmptyState icon="📅" msg="Belum ada riwayat kegiatan" />
            ) : (
              <div>
                {data.riwayat_kegiatan.map((kg, i) => (
                  <div
                    key={kg.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: i < data.riwayat_kegiatan.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                          {kg.nama_kegiatan}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {kg.tanggal} • {kg.lokasi}
                        </div>
                      </div>
                      <BadgeKehadiran status={kg.status_kehadiran} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Riwayat Izin */}
          <div className="stat-card card-animate card-animate-5" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Riwayat Izin Terbaru</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>3 pengajuan terakhir</div>
              </div>
              <button
                onClick={() => navigate('/mahasiswa/izin')}
                style={{ fontSize: '12px', color: BRAND, fontWeight: '600', background: `${BRAND}10`, border: `1px solid ${BRAND}30`, padding: '4px 12px', borderRadius: '20px', cursor: 'pointer' }}
              >Lihat Semua</button>
            </div>
            {loading ? (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => <SkeletonBlock key={i} h={64} />)}
              </div>
            ) : !data?.riwayat_izin?.length ? (
              <EmptyState icon="📄" msg="Belum ada riwayat izin" />
            ) : (
              <div>
                {data.riwayat_izin.map((iz, i) => (
                  <div
                    key={iz.id}
                    onClick={() => navigate(`/mahasiswa/izin/${iz.id}`)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: i < data.riwayat_izin.length - 1 ? '1px solid #f1f5f9' : 'none',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                          {iz.jenis_izin.replace('_', ' ')}
                          <span style={{ marginLeft: '8px', fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>· {iz.durasi_hari} hari</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {iz.tanggal_range}
                        </div>
                        {iz.status === 'DITOLAK' && iz.catatan_fasilitator && (
                          <div style={{ marginTop: '6px', fontSize: '11px', color: '#dc2626', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                            📝 {iz.catatan_fasilitator}
                          </div>
                        )}
                      </div>
                      <BadgeIzin status={iz.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Scan QR Modal */}
      {showScanModal && (
        <ScanQrModal onClose={(isSuccess) => {
          setShowScanModal(false);
          if (isSuccess) {
            fetchKegiatan();
            fetchDashboard(true);
          }
        }} />
      )}
    </DashboardLayout>
  );
}

export default DashboardMahasiswa;
