import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetDashboardFasilitator } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';

import { FASILITATOR_MENU } from './fasilitatorMenu';

const BRAND = '#01696f';

// Icon lokal untuk komponen StatCard & panel dashboard (bukan sidebar)
const IconHome        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconCheckCircle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconAlert       = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconTrendingUp  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconTrendingDown= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
const IconMinus       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;

// ================= STYLES =================
const cardStyle = { background: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '24px' };
const titleStyle = { fontSize: '16px', fontWeight: '600', color: '#1e293b' };
const subTitleStyle = { fontSize: '13px', color: '#64748b', marginTop: '4px' };


// ================= COMPONENTS =================
function StatCard({ label, value, unit = '', color, icon, onClick, delay = 0, delta = 0, isAlfa = false }) {
  const animated = useCountUp(value ?? 0);
  
  // Logic trend
  let trendType = 'neutral';
  let trendColor = '#94a3b8';
  let TrendIcon = IconMinus;

  if (delta > 0) {
    trendType = 'up';
    TrendIcon = IconTrendingUp;
    trendColor = isAlfa ? '#dc2626' : '#059669'; // Alfa naik = merah, lainnya naik = hijau
  } else if (delta < 0) {
    trendType = 'down';
    TrendIcon = IconTrendingDown;
    trendColor = isAlfa ? '#059669' : '#dc2626'; // Alfa turun = hijau, lainnya turun = merah
  }

  return (
    <div
      className={`card-animate card-animate-${delay + 1}`}
      onClick={onClick}
      style={{
        ...cardStyle, cursor: onClick ? 'pointer' : 'default', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1 }}>
          {animated}{unit}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px' }}>
          <span style={{ color: trendColor, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            <TrendIcon /> {Math.abs(delta)}{unit}
          </span>
          <span style={{ color: '#94a3b8' }}>dari minggu lalu</span>
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({ h = 80 }) {
  return <div className="skeleton-shimmer" style={{ height: `${h}px`, borderRadius: '16px' }} />;
}

function EmptyState({ icon = '📭', msg = 'Belum ada data' }) {
  return (
    <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '13px', fontWeight: '500' }}>{msg}</div>
    </div>
  );
}

export default function DashboardFasilitator() {
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const nama = localStorage.getItem('simbima_nama') || 'Fasilitator';

  const fetchDashboard = (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setIsRefreshing(true);

    apiGetDashboardFasilitator()
      .then(res => { if (res.data) setData(res.data); })
      .catch(err => console.error(err))
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchDashboard(false);
  }, []);

  // ── Realtime: refresh saat ada update absensi atau perizinan ─────────────────
  const onAbsensiUpdate = useCallback(() => fetchDashboard(true), []);
  const onPerizinanUpdate = useCallback(() => fetchDashboard(true), []);
  useSocket("absensi:update", onAbsensiUpdate);
  useSocket("perizinan:update", onPerizinanUpdate);

  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Data Pie Chart
  const donutData = data?.distribusi_kehadiran ? [
    { name: 'Hadir',  value: data.distribusi_kehadiran.hadir.jumlah, color: '#01696f', pct: data.distribusi_kehadiran.hadir.persen },
    { name: 'Alpha',  value: data.distribusi_kehadiran.alpha.jumlah, color: '#dc2626', pct: data.distribusi_kehadiran.alpha.persen },
    { name: 'Izin',   value: data.distribusi_kehadiran.izin.jumlah,  color: '#2563eb', pct: data.distribusi_kehadiran.izin.persen },
    { name: 'Sakit',  value: data.distribusi_kehadiran.sakit?.jumlah ?? 0, color: '#d97706', pct: data.distribusi_kehadiran.sakit?.persen ?? 0 },
  ].filter(d => d.value > 0) : [];
  
  const totalKehadiran = data?.distribusi_kehadiran?.total || 0;

  const customDonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: data.color }}>{data.name}</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Jumlah: <span style={{ color: '#1e293b', fontWeight: 'bold' }}>{data.value}</span> ({data.pct}%)</p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip untuk Line Chart
  const customLineTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0]?.payload; // data point mentah
    const COLORS = { Hadir: '#01696f', Alpha: '#dc2626', Izin: '#2563eb', Sakit: '#d97706' };
    const FIELDS = [
      { key: 'hadir', label: 'Hadir',  color: '#01696f' },
      { key: 'alpha', label: 'Alpha',  color: '#dc2626' },
      { key: 'izin',  label: 'Izin',   color: '#2563eb' },
      { key: 'sakit', label: 'Sakit',  color: '#d97706' },
    ];
    return (
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '12px 16px',
        minWidth: '200px', fontSize: '13px'
      }}>
        {/* Nama kegiatan */}
        {point?.nama && (
          <div style={{
            fontWeight: '700', color: '#1e293b', marginBottom: '8px',
            paddingBottom: '8px', borderBottom: '1px solid #f1f5f9',
            fontSize: '12px', lineHeight: '1.4'
          }}>
            {point.nama}
          </div>
        )}
        {/* Tanggal */}
        <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '8px', fontWeight: '500' }}>
          {point?.tanggal}
        </div>
        {/* Detail tiap status */}
        {FIELDS.map(f => (
          <div key={f.key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', padding: '3px 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.color, flexShrink: 0 }} />
              <span style={{ color: '#64748b' }}>{f.label}</span>
            </div>
            <span style={{ fontWeight: '700', color: f.color }}>
              {point?.[f.key] ?? 0} mahasiswa
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Custom Tick untuk XAxis — render label dari data point by id
  const trendDataMap = {};
  (data?.tren_kehadiran || []).forEach(item => { trendDataMap[item.id] = item.label; });
  const CustomTrendTick = ({ x, y, payload }) => {
    const lbl = trendDataMap[payload.value] || payload.value;
    const words = lbl.split(' ');
    // Bagi ke max 2 baris jika panjang
    const line1 = words.slice(0, 2).join(' ');
    const line2 = words.slice(2).join(' ');
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#64748b" fontSize={10} transform="rotate(-30)">
          {line1}
        </text>
        {line2 && (
          <text x={0} y={0} dy={16} textAnchor="end" fill="#64748b" fontSize={10} transform="rotate(-30)">
            {line2}
          </text>
        )}
      </g>
    );
  };

  return (
    <DashboardLayout menuItems={FASILITATOR_MENU}>
      <div className="page-enter page-content">

        {/* ── HEADER ── */}
        <div className="section-animate" style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Dashboard Fasilitator</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
            Halo, <strong style={{ color: BRAND }}>{nama}</strong> | {todayLabel}
          </p>
        </div>

        {/* ── ROW 1: 5 STAT CARDS ── */}
        <div className="grid-responsive-5" style={{ marginBottom: '24px', minWidth: '0' }}>
          {loading ? (
            [1,2,3,4,5].map(i => <SkeletonBlock key={i} h={132} />)
          ) : (
            <>
              <StatCard label="Total Mahasiswa" value={data?.total_mahasiswa} color="#01696f" delay={0} icon={<IconHome />} delta={data?.trends?.total_mahasiswa_delta} />
              <StatCard label="Kegiatan Bulan Ini" value={data?.kegiatan_bulan_ini} color="#2563eb" delay={1} icon={<IconCalendar />} delta={data?.trends?.kegiatan_bulan_ini_delta} />
              <StatCard label="Rata-rata Kehadiran" value={data?.kehadiran_persen} unit="%" color="#d97706" delay={2} icon={<IconCheckCircle />} delta={data?.trends?.kehadiran_persen_delta} />
              <StatCard label="Pengajuan Izin" value={data?.izin_menunggu} color="#7c3aed" delay={3} icon={<IconFile />} onClick={() => navigate('/fasilitator/perizinan')} delta={data?.trends?.izin_menunggu_delta} />
              <StatCard label="Alfa 3x Berturut-turut" value={data?.alfa_berturut} color="#dc2626" delay={4} icon={<IconAlert />} delta={data?.trends?.alfa_berturut_delta} isAlfa={true} />
            </>
          )}
        </div>

        {/* ── ROW 2: 2 CHART PANEL ── */}
        <div className="grid-responsive-2" style={{ marginBottom: '24px' }}>
          
          {/* Chart Kiri: Tren Kehadiran */}
          <div className="card-animate card-animate-3" style={{ ...cardStyle }}>
            <div style={titleStyle}>Tren Kehadiran 10 Kegiatan Terakhir</div>
            <div style={subTitleStyle}>Jumlah mahasiswa per status kehadiran</div>
            <div style={{ height: '300px', marginTop: '24px' }}>
              {loading ? <SkeletonBlock h={300} /> : (!data?.tren_kehadiran?.length ? <EmptyState icon="" msg="Belum ada kegiatan" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.tren_kehadiran}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="id"
                      tick={false}
                      axisLine={false}
                      tickLine={false}
                      height={8}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip content={customLineTooltip} cursor={{ stroke: '#e2e8f0', strokeWidth: 1.5, strokeDasharray: '4 2' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} iconType="circle" />
                    <Line type="monotone" dataKey="hadir" stroke="#01696f" strokeWidth={2.5} dot={{ fill: '#01696f', r: 4 }} name="Hadir" />
                    <Line type="monotone" dataKey="alpha" stroke="#dc2626" strokeWidth={2.5} dot={{ fill: '#dc2626', r: 4 }} name="Alpha" />
                    <Line type="monotone" dataKey="izin"  stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} name="Izin" />
                    <Line type="monotone" dataKey="sakit" stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 4 }} name="Sakit" strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              ))}
            </div>
          </div>

          {/* Chart Kanan: Distribusi Kehadiran */}
          <div className="card-animate card-animate-4" style={{ ...cardStyle }}>
            <div style={titleStyle}>Distribusi Kehadiran Bulan Ini</div>
            <div style={subTitleStyle}>Persentase mahasiswa berdasarkan status</div>
            <div style={{ height: '300px', marginTop: '24px', display: 'flex', alignItems: 'center' }}>
              {loading ? <SkeletonBlock h={300} /> : (totalKehadiran === 0 ? <EmptyState icon="" msg="Belum ada absensi bulan ini" /> : (
                <>
                  <div style={{ flex: '1', position: 'relative', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius="65%" outerRadius="85%" paddingAngle={2} dataKey="value" stroke="none">
                          {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={customDonutTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', lineHeight: 1 }}>{totalKehadiran}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Total Absensi</div>
                    </div>
                  </div>
                  <div style={{ width: '130px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {donutData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{d.name}</div>
                          <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>{d.pct}% <span style={{ color: '#94a3b8', fontWeight: '400' }}>({d.value})</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ))}
            </div>
          </div>

        </div>

        {/* ── ROW 3: 3 KOLOM PANEL BAWAH ── */}
        <div className="grid-responsive-3" style={{ gap: '16px' }}>
          
          {/* Kolom 1: Pengajuan Izin Terbaru */}
          <div className="card-animate card-animate-4" style={{ ...cardStyle, padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={titleStyle}>Pengajuan Izin Terbaru</div>
              <div style={subTitleStyle}>Izin mahasiswa yang menunggu validasi</div>
            </div>
            <div style={{ flex: 1, padding: '12px 0' }}>
              {loading ? (
                <div style={{ padding: '0 24px' }}><SkeletonBlock h={60} /></div>
              ) : !data?.izin_terbaru?.length ? (
                <EmptyState icon="📋" msg="Tidak ada izin menunggu validasi" />
              ) : (
                data.izin_terbaru.map((izin, i) => {
                  let badgeBg = '#fef3c7', badgeColor = '#d97706';
                  if (izin.status === 'DISETUJUI') { badgeBg = '#d1fae5'; badgeColor = '#059669'; }
                  if (izin.status === 'DITOLAK')   { badgeBg = '#fee2e2'; badgeColor = '#dc2626'; }
                  const statusLabel = izin.status === 'MENUNGGU' ? 'Menunggu' : izin.status === 'DISETUJUI' ? 'Disetujui' : 'Ditolak';
                  return (
                    <div key={izin.id} style={{ padding: '12px 24px', borderBottom: i < data.izin_terbaru.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      {/* Avatar Inisial */}
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                        {izin.inisial}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>{izin.nama_mahasiswa}</div>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: badgeColor, background: badgeBg, padding: '2px 7px', borderRadius: '10px', flexShrink: 0 }}>{statusLabel}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginBottom: '2px' }}>Kamar {izin.kamar} • {izin.jenis_izin}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{izin.durasi_hari} hari • Diajukan {izin.diajukan_label}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => navigate('/fasilitator/perizinan')} style={{ fontSize: '13px', color: BRAND, fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Lihat semua pengajuan →</button>
            </div>
          </div>


          {/* Kolom 2: Top 5 Mahasiswa Teraktif */}
          <div className="card-animate card-animate-5" style={{ ...cardStyle, padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={titleStyle}>Top 5 Mahasiswa Teraktif</div>
              <div style={subTitleStyle}>Berdasarkan kehadiran terbanyak bulan ini</div>
            </div>
            <div style={{ flex: 1, padding: '12px 0' }}>
              {loading ? (
                <div style={{ padding: '0 24px' }}><SkeletonBlock h={60} /></div>
              ) : !data?.top5_mahasiswa_rajin?.length ? (
                <EmptyState icon="🏆" msg="Belum ada data kehadiran" />
              ) : (
                data.top5_mahasiswa_rajin.map((m, i) => {
                  let bgAvatar = '#e2e8f0'; let colAvatar = '#475569';
                  if (m.rank === 1) { bgAvatar = '#fef3c7'; colAvatar = '#d97706'; } // Gold
                  else if (m.rank === 2) { bgAvatar = '#f1f5f9'; colAvatar = '#64748b'; } // Silver
                  else if (m.rank === 3) { bgAvatar = '#ffedd5'; colAvatar = '#c2410c'; } // Bronze
                  
                  return (
                    <div key={i} style={{ padding: '12px 24px', borderBottom: i < data.top5_mahasiswa_rajin.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '20px', fontSize: '14px', fontWeight: '800', color: m.rank === 1 ? BRAND : '#94a3b8', textAlign: 'center' }}>#{m.rank}</div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: bgAvatar, color: colAvatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>
                        {m.inisial}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nama}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Kamar {m.kamar} • {m.blok}</div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: BRAND }}>{m.jumlah_hadir}</div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => navigate('/fasilitator/rekap')} style={{ fontSize: '13px', color: BRAND, fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Lihat semua mahasiswa →</button>
            </div>
          </div>

          {/* Kolom 3: Perlu Perhatian */}
          <div className="card-animate card-animate-6" style={{ ...cardStyle, padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={titleStyle}>Perlu Perhatian</div>
              <div style={subTitleStyle}>Mahasiswa yang membutuhkan tindak lanjut</div>
            </div>
            <div style={{ flex: 1, padding: '12px 0' }}>
              {loading ? (
                <div style={{ padding: '0 24px' }}><SkeletonBlock h={60} /></div>
              ) : !data?.mahasiswa_bermasalah?.length ? (
                <EmptyState icon="" msg="Tidak ada masalah saat ini" />
              ) : (
                <div className="scroll-thin" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {data.mahasiswa_bermasalah.map((m, i) => {
                    // Format: "Lt2.A01" — blok = "Lt 2" → strip space
                    const blokCompact = m.blok.replace(/\s+/g, '');
                    const namaLokasi = `${m.nama} | ${blokCompact}.${m.kamar}`;
                    return (
                      <div key={i} style={{ padding: '12px 24px', borderBottom: i < data.mahasiswa_bermasalah.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
                          <IconAlert />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{m.keterangan}</div>
                            {m.is_baru && <div style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', flexShrink: 0 }}>Baru</div>}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <div style={{ fontSize: '13px', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>{namaLokasi}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{m.waktu}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}
