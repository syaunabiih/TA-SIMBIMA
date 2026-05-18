import { useState, useEffect, useMemo } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('simbima_token');

export default function MonitoringPage() {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filterFasilitator, setFilterFasilitator] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterJenis, setFilterJenis] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/kegiatan`, { headers: { Authorization: `Bearer ${token()}` } });
        const json = await res.json();
        if (res.ok) setKegiatan(json.data || []);
        else setError(json.message || 'Gagal memuat data kegiatan.');
      } catch {
        setError('Tidak bisa terhubung ke server.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fasilitators = useMemo(() => {
    const map = new Map();
    kegiatan.forEach(k => {
      if (k.id_fasilitator && k.fasilitator?.nama) {
        map.set(k.id_fasilitator, k.fasilitator.nama);
      }
    });
    return Array.from(map.entries()).map(([id, nama]) => ({ id: String(id), nama }));
  }, [kegiatan]);

  const jenisOptions = useMemo(() => {
    const set = new Set();
    kegiatan.forEach(k => set.add(k.jenis_kegiatan));
    return Array.from(set);
  }, [kegiatan]);

  const filteredKegiatan = useMemo(() => {
    return kegiatan.filter(k => {
      if (filterFasilitator && String(k.id_fasilitator) !== filterFasilitator) return false;
      if (filterJenis && k.jenis_kegiatan !== filterJenis) return false;
      if (filterBulan) {
        const kDate = new Date(k.tanggal_kegiatan);
        const [y, m] = filterBulan.split('-');
        if (kDate.getFullYear() !== Number(y) || kDate.getMonth() + 1 !== Number(m)) return false;
      }
      return true;
    });
  }, [kegiatan, filterFasilitator, filterBulan, filterJenis]);

  return (
    <SuperadminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>Monitoring Kegiatan</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Pantau seluruh kegiatan pembinaan dari semua fasilitator</p>
        </div>

        {/* Filter Panel */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter Fasilitator</label>
              <select value={filterFasilitator} onChange={e => setFilterFasilitator(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', background: '#fff' }}>
                <option value="">Semua Fasilitator</option>
                {fasilitators.map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter Bulan</label>
              <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', background: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Jenis Kegiatan</label>
              <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', background: '#fff' }}>
                <option value="">Semua Jenis</option>
                {jenisOptions.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px', color: '#dc2626', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Memuat data...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Nama Kegiatan</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Fasilitator</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Tanggal</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Total Hadir</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Total Alpha</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKegiatan.length > 0 ? (
                    filteredKegiatan.map(k => (
                      <tr key={k.id_kegiatan} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>
                          {k.nama_kegiatan}
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400', marginTop: '4px' }}>{k.jenis_kegiatan}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{k.fasilitator?.nama || '-'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                            {k.total_hadir || 0}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                            {k.total_alpha || 0}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: k.status_kegiatan === 'BERLANGSUNG' ? '#ecfdf5' : '#f1f5f9',
                            color: k.status_kegiatan === 'BERLANGSUNG' ? '#059669' : '#64748b',
                            fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px'
                          }}>
                            {k.status_kegiatan}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                        Tidak ada data kegiatan yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SuperadminLayout>
  );
}
