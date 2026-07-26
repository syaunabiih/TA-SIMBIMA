import { useState, useEffect, useCallback } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';
import { useSocket } from '../../hooks/useSocket';

const API = import.meta.env.VITE_API_URL || '';
const token = () => localStorage.getItem('simbima_token');

const STATUS_COLOR = {
  MENUNGGU:   { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
  DISETUJUI:  { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  DITOLAK:    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  DIBATALKAN: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  SELESAI:    { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
};

const JENIS_LABEL = {
  PULANG_KAMPUNG: 'Pulang Kampung',
  KEGIATAN_LUAR:  'Kegiatan Luar',
};

function fmtTgl(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const isTerlambatBalik = (izin) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const batas = new Date(izin.tanggal_selesai); batas.setHours(0, 0, 0, 0);
  return izin.status_pengajuan === 'DISETUJUI' && today > batas && !izin.returned_at;
};

const hariTerlambat = (endDate) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const batas = new Date(endDate); batas.setHours(0, 0, 0, 0);
  return Math.floor((today - batas) / (1000 * 60 * 60 * 24));
};

// ── Animasi counter angka ──────────────────────────────────────────────────────
function useCountUp(target, duration = 1000) {
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

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, rawValue, sub, icon, color, delay = 0, hasBorderHighlight = false }) {
  const [visible, setVisible] = useState(false);
  const counted = useCountUp(visible ? (rawValue ?? 0) : 0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        border: hasBorderHighlight ? `1px solid ${color}` : '1px solid #e2e8f0',
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1 }}>
          {counted.toLocaleString('id-ID')}
        </div>
        {sub && <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function PerizinanReadOnlyPage() {
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [search, setSearch] = useState('');

  const fetchIzin = useCallback(async () => {
    setLoading(true);
    try {
      const [resIzin, resSummary] = await Promise.all([
        fetch(`${API}/api/izin`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/api/izin/summary`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const [jsonIzin, jsonSummary] = await Promise.all([resIzin.json(), resSummary.json()]);

      if (resIzin.ok) setList(jsonIzin.data || []);
      else setError(jsonIzin.message || 'Gagal memuat data perizinan.');

      if (resSummary.ok) setSummary(jsonSummary.data);
    } catch { setError('Tidak bisa terhubung ke server.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchIzin(); }, [fetchIzin]);

  // ── Realtime: refresh saat ada update perizinan ───────────────────────
  useSocket("perizinan:update", fetchIzin);

  const filtered = list.filter(iz => {
    if (filterStatus === 'TERLAMBAT_BALIK') {
      if (!isTerlambatBalik(iz)) return false;
    } else if (filterStatus && iz.status_pengajuan !== filterStatus) {
      return false;
    }
    if (filterJenis && iz.jenis_izin !== filterJenis) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        iz.mahasiswa?.nama?.toLowerCase().includes(q) ||
        iz.mahasiswa?.nim?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statCards = summary ? [
    {
      label: 'Total Mahasiswa',
      rawValue: summary.totalMahasiswa,
      sub: 'mahasiswa terdaftar aktif',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: '#10b981',
      delay: 0,
    },
    {
      label: 'Ada di Asrama',
      rawValue: summary.adaDiAsrama,
      sub: 'mahasiswa saat ini di asrama',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: '#2563eb',
      delay: 100,
    },
    {
      label: 'Sedang Tidak di Asrama',
      rawValue: summary.sedangTidakDiAsrama,
      sub: 'memiliki izin aktif saat ini',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: '#f59e0b',
      delay: 200,
    },
  ] : [];

  return (
    <SuperadminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', animation: 'fadeSlideUp 0.5s ease both' }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>Perizinan</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Pantau semua pengajuan perizinan mahasiswa (read-only)
          </p>
        </div>

        {/* Stat Cards */}
        {!loading && summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {statCards.map((c, i) => <StatCard key={i} {...c} />)}
          </div>
        )}

        {/* Skeleton stat cards saat loading */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', height: '110px', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Cari nama / NIM..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b' }}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', background: '#fff' }}>
            <option value="">Semua Status</option>
            {Object.keys(STATUS_COLOR).map(s => <option key={s} value={s}>{s}</option>)}
            <option value="TERLAMBAT_BALIK">Terlambat Balik</option>
          </select>
          <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', background: '#fff' }}>
            <option value="">Semua Jenis</option>
            {Object.entries(JENIS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{filtered.length} izin</span>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Memuat...</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px', color: '#dc2626' }}>{error}</div>}

        {!loading && !error && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Mahasiswa', 'Jenis Izin', 'Periode', 'Durasi', 'Status', 'Fasilitator', 'Tanggal Ajuan'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Tidak ada data.</td></tr>
                  ) : filtered.map(iz => {
                    const sc = STATUS_COLOR[iz.status_pengajuan] || STATUS_COLOR.MENUNGGU;
                    const terlambat = isTerlambatBalik(iz);
                    return (
                      <tr key={iz.id_perizinan} style={{ borderBottom: '1px solid #f1f5f9', background: terlambat ? '#fef2f2' : 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = terlambat ? '#fee2e2' : '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = terlambat ? '#fef2f2' : 'transparent'}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{iz.mahasiswa?.nama}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{iz.mahasiswa?.nim}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{iz.mahasiswa?.gedung?.nama_gedung}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' }}>
                            {JENIS_LABEL[iz.jenis_izin] || iz.jenis_izin}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#374151', whiteSpace: 'nowrap' }}>
                          <div>{fmtTgl(iz.tanggal_mulai)} – {fmtTgl(iz.tanggal_selesai)}</div>
                          {terlambat && (
                            <div style={{ color: '#dc2626', fontSize: '10px', marginTop: '4px', fontWeight: '600' }}>
                              ⚠ Terlambat {hariTerlambat(iz.tanggal_selesai)} hari
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#374151', textAlign: 'center' }}>
                          {iz.durasi_hari}h
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: terlambat ? '#fef2f2' : sc.bg, color: terlambat ? '#dc2626' : sc.color, border: `1px solid ${terlambat ? '#fecaca' : sc.border}`, fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' }}>
                            {terlambat ? '⚠ TERLAMBAT BALIK' : iz.status_pengajuan}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b' }}>
                          {iz.fasilitator?.nama || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {fmtTgl(iz.tanggal_pengajuan)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </SuperadminLayout>
  );
}
