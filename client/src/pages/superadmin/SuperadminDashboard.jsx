import { useState, useEffect, useCallback } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList, Cell, Legend } from 'recharts';
import { useSocket } from '../../hooks/useSocket';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('simbima_token');

// ── Animasi counter angka ──────────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target == null || isNaN(target)) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

// ── Stat Card dengan animasi ───────────────────────────────────────────────────
function StatCard({ label, value, rawValue, sub, icon, color, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const counted = useCountUp(visible ? (rawValue ?? 0) : 0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const displayVal = rawValue != null && !isNaN(rawValue)
    ? counted.toLocaleString('id-ID')
    : value;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      animation: `fadeSlideUp 0.5s ease ${delay}ms both`,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${color}40`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: `${color}15`, color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1 }}>{displayVal ?? '—'}</div>
        {sub && <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px' }}>{sub}</div>}
      </div>
    </div>
  );
}



// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
  const [stats, setStats] = useState(null);
  const [kehadiranGedung, setKehadiranGedung] = useState([]);
  const [fasilitatorList, setFasilitatorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPeriode, setExportPeriode] = useState('');
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [exportSections, setExportSections] = useState({
    summary: true, asrama: true, kegiatan: true, 
    perizinan: true, 'perhatian-khusus': true, rekomendasi: true
  });
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState({ type: '', text: '' });
  const [exportWarning, setExportWarning] = useState('');

  useEffect(() => {
    const now = new Date();
    setExportPeriode(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [resStats, resFasilitator, resKehadiran] = await Promise.all([
          fetch(`${API}/api/admin/dashboard-stats`, { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(`${API}/api/admin/fasilitator`, { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(`${API}/api/admin/dashboard/kehadiran-per-gedung`, { headers: { Authorization: `Bearer ${token()}` } }),
        ]);
        const [jsonStats, jsonFasilitator, jsonKehadiran] = await Promise.all([resStats.json(), resFasilitator.json(), resKehadiran.json()]);

        if (resStats.ok) setStats(jsonStats.data);
        else setError(jsonStats.message || 'Gagal memuat statistik.');

        if (resFasilitator.ok) setFasilitatorList(jsonFasilitator.data);
        if (resKehadiran.ok) setKehadiranGedung(jsonKehadiran);

      } catch {
        setError('Tidak bisa terhubung ke server.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Realtime: refresh dashboard saat ada perubahan data ─────────────────
  const refetchDashboard = useCallback(async () => {
    try {
      const [resStats, resKehadiran] = await Promise.all([
        fetch(`${API}/api/admin/dashboard-stats`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/api/admin/dashboard/kehadiran-per-gedung`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const [jsonStats, jsonKehadiran] = await Promise.all([resStats.json(), resKehadiran.json()]);
      if (resStats.ok) setStats(jsonStats.data);
      if (resKehadiran.ok) setKehadiranGedung(jsonKehadiran);
    } catch (_) {}
  }, []);

  useSocket("absensi:update",   refetchDashboard);
  useSocket("perizinan:update", refetchDashboard);
  useSocket("kegiatan:update",  refetchDashboard);

  const statCards = stats ? [
    {
      label: 'Total Mahasiswa Aktif',
      rawValue: stats.totalMahasiswa,
      sub: 'mahasiswa terdaftar aktif',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      color: '#10b981',
      delay: 0,
    },
    {
      label: 'Total Fasilitator',
      rawValue: stats.totalFasilitator,
      sub: 'fasilitator aktif',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      color: '#2563eb',
      delay: 100,
    },
    {
      label: 'Total Gedung',
      rawValue: stats.totalGedung,
      sub: 'gedung / asrama',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      color: '#f59e0b',
      delay: 200,
    },
    {
      label: 'Total Kegiatan',
      rawValue: stats.totalKegiatan,
      sub: 'kegiatan pembinaan',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      color: '#8b5cf6',
      delay: 300,
    },
    {
      label: 'Rata-rata Kehadiran',
      value: stats.rataRataKehadiran != null ? `${Number(stats.rataRataKehadiran).toFixed(1)}%` : '—',
      sub: 'tingkat kehadiran global',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      color: '#0891b2',
      delay: 400,
    },
  ] : [];

  const handleExport = async () => {
    setExporting(true);
    setExportMsg({ type: '', text: '' });
    try {
      const activeSections = Object.keys(exportSections).filter(k => exportSections[k]);
      const params = new URLSearchParams({
        periode: exportPeriode,
        format: exportFormat
      });
      activeSections.forEach(s => params.append('sections', s));
      
      const res = await fetch(`${API}/api/admin/laporan/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          const msg = json.message || 'Gagal export laporan';
          setShowExportModal(false);
          setExportWarning(msg);
        } else {
          throw new Error('Gagal export laporan');
        }
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Monitoring_${exportPeriode}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
    } catch (err) {
      setExportMsg({ type: 'error', text: err.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <SuperadminLayout>
      <div className="page-enter page-content">

        {/* Header */}
        <div style={{ marginBottom: '28px', animation: 'fadeSlideUp 0.5s ease both', padding: '0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>
              Dashboard Ketua Pokja
            </h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
              Ringkasan statistik dan kondisi seluruh asrama secara real-time
            </p>
          </div>
          <button 
            onClick={() => setShowExportModal(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
              border: 'none', borderRadius: '10px', padding: '10px 18px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            <span>⬇</span> Export Laporan
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: '14px' }}>Memuat data dashboard...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {statCards.map((c, i) => <StatCard key={i} {...c} />)}
            </div>

            {/* Row 1: Line Chart + Bar Chart Kehadiran */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>

              {/* Line Chart — Tren Kehadiran */}
              <div className="chart-card line-chart-card" style={{ animation: 'fadeSlideUp 0.5s ease 0.2s both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                      Tren Kehadiran Semua Asrama
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>8 kegiatan terakhir (semua gedung)</p>
                  </div>
                  <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
                    Live
                  </span>
                </div>
                <div style={{ height: '260px', width: '100%', marginTop: '20px' }}>
                  {(!stats.tren_kehadiran_global || stats.tren_kehadiran_global.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>Belum ada data kegiatan wajib</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.tren_kehadiran_global} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px', minWidth: '180px' }}>
                                <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#1e293b' }}>{d.label}</p>
                                <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#64748b' }}>{label}</p>
                                {[
                                  { key: 'hadir', color: '#059669', label: 'Hadir' },
                                  { key: 'alpha', color: '#dc2626', label: 'Alpha' },
                                  { key: 'izin', color: '#2563eb', label: 'Izin' },
                                  { key: 'sakit', color: '#d97706', label: 'Sakit' },
                                ].map(r => (
                                  <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                                      <span style={{ color: '#475569', fontSize: '12px' }}>{r.label}</span>
                                    </div>
                                    <span style={{ fontWeight: '700', color: r.color, fontSize: '12px' }}>{d[r.key]}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="hadir" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Hadir" />
                        <Line type="monotone" dataKey="alpha" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Alpha" />
                        <Line type="monotone" dataKey="izin" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Izin" />
                        <Line type="monotone" dataKey="sakit" stroke="#d97706" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Sakit" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Bar Chart — Kehadiran per Asrama */}
              <div className="chart-card bar-chart-card" style={{ animation: 'fadeSlideUp 0.5s ease 0.3s both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                      Kehadiran per Asrama
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Persentase mahasiswa yang hadir</p>
                  </div>
                  <span style={{ background: '#f8fafc', color: '#64748b', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    Target: 80%
                  </span>
                </div>

                <div style={{ height: '320px', width: '100%' }}>
                  {kehadiranGedung.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>Belum ada data kehadiran</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={kehadiranGedung.map(g => {
                          let fill = '#ef4444';
                          if (g.persentase >= 80) fill = '#22c55e';
                          else if (g.persentase >= 60) fill = '#eab308';
                          return { ...g, fill };
                        })}
                        layout="vertical"
                        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="gedung" width={130} tick={{ fontSize: 12, fill: '#475569', fontWeight: '600' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px' }}>
                                <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#1e293b' }}>
                                  {d.gedung}
                                </p>
                                <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '800', color: d.fill }}>
                                  {d.persentase}% Kehadiran
                                </p>
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '12px', color: '#64748b' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                    <span>✅ Hadir: <b style={{color:'#22c55e'}}>{d.hadir}</b></span>
                                    <span>❌ Alpha: <b style={{color:'#ef4444'}}>{d.alpha ?? '-'}</b></span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '4px' }}>
                                    <span>📋 Izin: <b style={{color:'#2563eb'}}>{d.izin ?? '-'}</b></span>
                                    <span>🏥 Sakit: <b style={{color:'#d97706'}}>{d.sakit ?? '-'}</b></span>
                                  </div>
                                  <div style={{ marginTop: '4px', color: '#94a3b8' }}>
                                    Total absen: {d.total} · {d.jumlah_kegiatan ?? '-'} kegiatan bulan ini
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <ReferenceLine x={80} stroke="#cbd5e1" strokeDasharray="4 4" label={{ position: 'top', value: 'Target 80%', fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                        <Bar dataKey="persentase" radius={[0, 6, 6, 0]} barSize={18}>
                          {kehadiranGedung.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill || '#22c55e'} />
                          ))}
                          <LabelList dataKey="persentase" position="right" formatter={(v) => `${v}%`} style={{ fontSize: '11px', fontWeight: '700', fill: '#475569' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Distribusi Gedung (Bar) */}
            <div style={{ marginBottom: '20px' }}>

              {/* Distribusi Per Gedung — Horizontal Bar */}
              <div className="chart-card" style={{ animation: 'fadeSlideUp 0.5s ease 0.35s both' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                  Distribusi Mahasiswa per Gedung
                </h3>
                {(stats.distribusiGedung || []).length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Belum ada data gedung.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.distribusiGedung.map((g, i) => {
                      const maxMhs = Math.max(...stats.distribusiGedung.map(x => x.jumlahMahasiswa), 1);
                      const pct = (g.jumlahMahasiswa / maxMhs) * 100;
                      const colors = ['#10b981', '#2563eb', '#f59e0b', '#8b5cf6', '#ef4444'];
                      const color = colors[i % colors.length];
                      return (
                        <div key={g.id_gedung} style={{ animation: `fadeSlideUp 0.4s ease ${i * 0.08}s both` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>{g.nama_gedung}</span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {g.jumlahMahasiswa} mahasiswa · {g.jumlahFasilitator} fasilitator
                            </span>
                          </div>
                          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', background: color, borderRadius: '4px',
                              width: `${pct}%`,
                              transition: 'width 1s ease',
                              animation: 'none',
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Row 3: Daftar Fasilitator */}
            <div className="chart-card" style={{ animation: 'fadeSlideUp 0.5s ease 0.5s both' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                Daftar Fasilitator &amp; Blok Tugasnya
              </h3>
              <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Nama Fasilitator', 'NIP', 'Blok Tugas'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fasilitatorList.length > 0 ? fasilitatorList.map((fasil) => (
                      <tr key={fasil.id_fasilitator} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 12px', color: '#1e293b', fontWeight: '500' }}>{fasil.nama}</td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace' }}>{fasil.nip}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: '1px solid #a7f3d0' }}>
                            {fasil.gedung?.nama_gedung || '-'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Belum ada data fasilitator</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Export Laporan Monitoring</h3>
              <button onClick={() => !exporting && setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px' }}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              {exportMsg.text && (
                <div style={{ padding: '12px', background: exportMsg.type === 'error' ? '#fef2f2' : '#ecfdf5', color: exportMsg.type === 'error' ? '#dc2626' : '#059669', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  {exportMsg.text}
                </div>
              )}
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Pilih Periode</label>
                <input type="month" value={exportPeriode} onChange={e => setExportPeriode(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Pilih Format</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input type="radio" name="format" value="xlsx" checked={exportFormat === 'xlsx'} onChange={() => setExportFormat('xlsx')} /> Excel (.xlsx)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input type="radio" name="format" value="pdf" checked={exportFormat === 'pdf'} onChange={() => setExportFormat('pdf')} /> PDF (.pdf)
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Pilih Isi Laporan</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {Object.entries({
                    summary: 'Ringkasan Umum',
                    asrama: 'Kehadiran per Asrama',
                    kegiatan: 'Rekap Kegiatan',
                    perizinan: 'Rekap Perizinan',
                    'perhatian-khusus': 'Perhatian Khusus',
                    rekomendasi: 'Rekomendasi'
                  }).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={exportSections[key]} onChange={e => setExportSections(prev => ({ ...prev, [key]: e.target.checked }))} /> {label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowExportModal(false)} disabled={exporting} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Batal</button>
                <button onClick={handleExport} disabled={exporting} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.7 : 1 }}>
                  {exporting ? 'Memproses...' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Message Box — Periode tidak ada aktivitas */}
      {exportWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: '380px', borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden',
            animation: 'fadeSlideUp 0.2s ease both'
          }}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: '#fef9c3', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px'
              }}>⚠️</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                Tidak Ada Data
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                {exportWarning}
              </p>
              <button
                onClick={() => setExportWarning('')}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
                  border: 'none', borderRadius: '8px', padding: '10px 32px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .chart-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .line-chart-card {
          flex: 1 1 60%;
          min-width: 250px;
        }
        .bar-chart-card {
          flex: 1 1 30%;
          min-width: 250px;
        }
        @media (max-width: 768px) {
          .line-chart-card, .bar-chart-card {
            flex: 1 1 100%;
            min-width: 0;
          }
          .chart-card {
            padding: 16px;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pieIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </SuperadminLayout>
  );
}
