import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetKegiatan } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';
import ScanQrModal from '../../components/ScanQrModal';

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

// ─── Badge status kegiatan (untuk BERLANGSUNG / TERJADWAL) ─────
function BadgeStatusKegiatan({ status }) {
  const map = {
    TERJADWAL:   { label: 'Terjadwal',         bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    BERLANGSUNG: { label: 'Sedang Berlangsung', bg: '#84d5faff', color: '#050596ff', border: '#3e95f2ff' },
    DIBATALKAN:  { label: 'Dibatalkan',         bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
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

// ─── Badge kehadiran mahasiswa (untuk SELESAI) ─────────────────
function BadgeKehadiran({ status }) {
  if (!status) {
    // Belum ada data kehadiran → mungkin belum di-input fasil
    return (
      <span style={{
        background: '#f8fafc', color: '#94a3b8', fontSize: '11px',
        fontWeight: '500', padding: '3px 10px', borderRadius: '20px',
        border: '1px solid #e2e8f0', fontStyle: 'italic',
      }}>
        Belum diisi
      </span>
    );
  }
  const map = {
    HADIR: { label: 'Hadir', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    ALPHA: { label: 'Alfa',  bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    IZIN:  { label: 'Izin',  bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    SAKIT: { label: 'Sakit', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  };
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: '11px',
      fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
      border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

// ─── Komponen Utama ────────────────────────────────────────────
function KegiatanMahasiswa() {
  const [kegiatan, setKegiatan]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('SEMUA');
  const [showScanModal, setShowScanModal] = useState(false);

  const fetchKegiatan = (isPoll = false) => {
    if (!isPoll) setLoading(true);
    apiGetKegiatan()
      .then(res => { if (res.data) setKegiatan(res.data); })
      .finally(() => { if (!isPoll) setLoading(false); });
  };

  useEffect(() => { fetchKegiatan(false); }, []);

  // ── Realtime: refresh saat ada update kegiatan / absensi ────────────────────
  const onUpdate = useCallback(() => fetchKegiatan(true), []);
  useSocket("kegiatan:update", onUpdate);
  useSocket("absensi:update",  onUpdate);

  const FILTERS  = ['SEMUA', 'BERLANGSUNG', 'SELESAI'];
  const filtered = filter === 'SEMUA' ? kegiatan : kegiatan.filter(k => k.status_kegiatan === filter);

  const total       = kegiatan.length;
  const berlangsung = kegiatan.filter(k => k.status_kegiatan === 'BERLANGSUNG').length;
  const selesai     = kegiatan.filter(k => k.status_kegiatan === 'SELESAI').length;
  const animTotal       = useCountUp(total);
  const animBerlangsung = useCountUp(berlangsung);
  const animSelesai     = useCountUp(selesai);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter page-content">

        {/* Header */}
        <div className="section-animate" style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Jadwal Kegiatan</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
              Daftar semua kegiatan pembinaan yang dijadwalkan untukmu.
            </p>
          </div>

          {/* Tombol Scan QR Absen */}
          <button
            onClick={() => setShowScanModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: '12px',
              color: 'white', fontWeight: '700', fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M3 17v2a2 2 0 0 0 2 2h2M17 3h2a2 2 0 0 1 2 2v2M17 21h2a2 2 0 0 0 2-2v-2" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <rect x="7" y="7" width="4" height="4" rx="1" fill="white"/>
              <rect x="13" y="7" width="4" height="4" rx="1" fill="white"/>
              <rect x="7" y="13" width="4" height="4" rx="1" fill="white"/>
            </svg>
            Scan QR Absen
          </button>
        </div>

        {/* Mini Stats */}
        <div className="grid-responsive-3" style={{ marginBottom: '20px' }}>
          {[
            { label: 'Total Kegiatan',     value: animTotal,       color: '#10b981' },
            { label: 'Sedang Berlangsung', value: animBerlangsung, color: '#059669' },
            { label: 'Selesai',            value: animSelesai,     color: '#64748b' },
          ].map((s, i) => (
            <div key={s.label} className={`stat-card card-animate card-animate-${i + 1}`}
              style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '20px', border: '1px solid',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              transition: 'all 0.2s ease',
              background:  filter === f ? '#10b981' : '#ffffff',
              color:       filter === f ? '#ffffff' : '#64748b',
              borderColor: filter === f ? '#10b981' : '#e2e8f0',
            }}>
              {f === 'SEMUA' ? 'Semua' : f === 'BERLANGSUNG' ? 'Sedang Berlangsung' : 'Selesai'}
            </button>
          ))}
        </div>

        {/* Tabel */}
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
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Tidak ada kegiatan ditemukan</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Coba ubah filter atau cek kembali nanti.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Nama Kegiatan', 'Tanggal', 'Waktu', 'Lokasi', 'Status'].map(h => (
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
                      <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: '500' }}>{k.nama_kegiatan}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(k.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{k.lokasi}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {/* Kegiatan SELESAI → tampilkan kehadiran mahasiswa */}
                        {k.status_kegiatan === 'SELESAI'
                          ? <BadgeKehadiran status={k.status_kehadiran_saya} />
                          : <BadgeStatusKegiatan status={k.status_kegiatan} />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Scan QR Modal */}
      {showScanModal && (
        <ScanQrModal onClose={(isSuccess) => {
          setShowScanModal(false);
          if (isSuccess) {
            fetchKegiatan();
          }
        }} />
      )}
    </DashboardLayout>
  );
}

export default KegiatanMahasiswa;
