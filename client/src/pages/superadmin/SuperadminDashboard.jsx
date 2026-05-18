import { useState, useEffect } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('simbima_token');

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, gradient, glowColor }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
      transition: 'box-shadow 0.2s ease',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 20px ${glowColor}`}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${glowColor}`,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: '#1e293b', fontSize: '26px', fontWeight: '800', lineHeight: 1 }}>{value ?? '—'}</div>
        {sub && <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState(null);
  const [fasilitatorList, setFasilitatorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [resStats, resFasilitator] = await Promise.all([
          fetch(`${API}/api/admin/dashboard-stats`, { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(`${API}/api/admin/fasilitator`, { headers: { Authorization: `Bearer ${token()}` } })
        ]);

        const [jsonStats, jsonFasilitator] = await Promise.all([
          resStats.json(),
          resFasilitator.json()
        ]);

        if (resStats.ok) setStats(jsonStats.data);
        else setError(jsonStats.message || 'Gagal memuat data statistik.');

        if (resFasilitator.ok) setFasilitatorList(jsonFasilitator.data);
      } catch {
        setError('Tidak bisa terhubung ke server.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = stats ? [
    {
      label: 'Total Mahasiswa Aktif',
      value: stats.totalMahasiswa?.toLocaleString('id-ID'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      glowColor: 'rgba(124,58,237,0.2)',
      sub: 'mahasiswa terdaftar aktif',
    },
    {
      label: 'Total Fasilitator',
      value: stats.totalFasilitator?.toLocaleString('id-ID'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      glowColor: 'rgba(37,99,235,0.2)',
      sub: 'fasilitator asrama',
    },
    {
      label: 'Total Kegiatan',
      value: stats.totalKegiatan?.toLocaleString('id-ID'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/>
          <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
      glowColor: 'rgba(8,145,178,0.2)',
      sub: 'kegiatan pembinaan',
    },
    {
      label: 'Rata-rata Kehadiran',
      value: stats.rataRataKehadiran != null ? `${Number(stats.rataRataKehadiran).toFixed(1)}%` : '—',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #059669, #047857)',
      glowColor: 'rgba(5,150,105,0.2)',
      sub: 'tingkat kehadiran global',
    },
  ] : [];

  return (
    <SuperadminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>
            Dashboard Superadmin
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Ringkasan statistik dan kondisi asrama secara keseluruhan
          </p>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Memuat data...
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {statCards.map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            {/* Two-column: Distribusi Gedung + Top Alfa */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Daftar Fasilitator & Blok Tugasnya */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                  Daftar Fasilitator & Blok Tugasnya
                </h3>
                <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Nama Fasilitator</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>NIP</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Blok Tugas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fasilitatorList.length > 0 ? (
                        fasilitatorList.map((fasil) => (
                          <tr key={fasil.id_fasilitator} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px', color: '#1e293b', fontWeight: '500' }}>{fasil.nama}</td>
                            <td style={{ padding: '10px 12px', color: '#64748b' }}>{fasil.nip}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                                {fasil.gedung?.nama_gedung || '-'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Belum ada data fasilitator</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top 5 Alfa Terbanyak */}
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                  Top 5 Mahasiswa Alpha Terbanyak
                </h3>
                {(stats.mahasiswaAlfaTerbanyak || []).length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Belum ada data kehadiran.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.mahasiswaAlfaTerbanyak.map((mhs, idx) => (
                      <div key={mhs.id_mahasiswa} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 12px', borderRadius: '10px',
                        background: idx === 0 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                          background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#cd7c4b',
                          color: '#fff', fontSize: '11px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{idx + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mhs.nama}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {mhs.nim} · {mhs.gedung?.nama_gedung}
                          </div>
                        </div>
                        <div style={{
                          background: '#fef2f2', color: '#dc2626',
                          fontSize: '12px', fontWeight: '700',
                          padding: '2px 10px', borderRadius: '20px',
                          border: '1px solid #fecaca',
                        }}>
                          {mhs.total_alfa}× alpha
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </SuperadminLayout>
  );
}
