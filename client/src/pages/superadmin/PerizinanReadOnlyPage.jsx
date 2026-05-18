import { useState, useEffect } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';

const API = 'http://localhost:5000';
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

export default function PerizinanReadOnlyPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/izin`, { headers: { Authorization: `Bearer ${token()}` } });
        const json = await res.json();
        if (res.ok) setList(json.data || []);
        else setError(json.message || 'Gagal memuat data perizinan.');
      } catch { setError('Tidak bisa terhubung ke server.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = list.filter(iz => {
    if (filterStatus && iz.status_pengajuan !== filterStatus) return false;
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

  // Summary counts
  const counts = list.reduce((acc, iz) => {
    acc[iz.status_pengajuan] = (acc[iz.status_pengajuan] || 0) + 1;
    return acc;
  }, {});

  return (
    <SuperadminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>Perizinan</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Pantau semua pengajuan perizinan mahasiswa (read-only)
          </p>
        </div>

        {/* Summary bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0f0a1e, #1e1340)',
          borderRadius: '14px', padding: '16px 22px', marginBottom: '20px',
          display: 'flex', gap: '24px', flexWrap: 'wrap',
        }}>
          {[
            { label: 'Total', value: list.length, color: '#c4b5fd' },
            { label: 'Menunggu', value: counts.MENUNGGU || 0, color: '#fcd34d' },
            { label: 'Disetujui', value: counts.DISETUJUI || 0, color: '#6ee7b7' },
            { label: 'Ditolak', value: counts.DITOLAK || 0, color: '#fca5a5' },
            { label: 'Selesai', value: counts.SELESAI || 0, color: '#93c5fd' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>{item.label}</div>
              <div style={{ color: item.color, fontSize: '22px', fontWeight: '800' }}>{item.value}</div>
            </div>
          ))}
        </div>

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
                    return (
                      <tr key={iz.id_perizinan} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
                          {fmtTgl(iz.tanggal_mulai)} – {fmtTgl(iz.tanggal_selesai)}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#374151', textAlign: 'center' }}>
                          {iz.durasi_hari}h
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' }}>
                            {iz.status_pengajuan}
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
    </SuperadminLayout>
  );
}
