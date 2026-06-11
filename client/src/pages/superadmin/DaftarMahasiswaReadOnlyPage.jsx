import { useState, useEffect, useCallback } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';
import Modal from '../../components/Modal';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('simbima_token');

export default function DaftarMahasiswaReadOnlyPage() {
  const [mahasiswas, setMahasiswas] = useState([]);
  const [gedungs, setGedungs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterGedung, setFilterGedung] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const q = filterGedung ? `?gedung=${filterGedung}` : '';
      const res = await fetch(`${API}/api/admin/mahasiswa${q}`, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      if (res.ok) setMahasiswas(json.data || []);
      else setError(json.message || 'Gagal memuat daftar mahasiswa.');
    } catch (err) { setError('Tidak bisa terhubung ke server.'); }
    finally { setLoading(false); }
  }, [filterGedung]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/gedung`, { headers: { Authorization: `Bearer ${token()}` } });
        const json = await res.json();
        if (res.ok) setGedungs(json.data || []);
      } catch {}
    })();
  }, []);

  const filteredList = mahasiswas.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()) || m.nim.toLowerCase().includes(search.toLowerCase()));

  const openDetail = (m) => {
    setSelected(m);
    setModalOpen(true);
  };

  return (
    <SuperadminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>Daftar Mahasiswa</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Daftar mahasiswa asrama</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Cari Nama atau NIM..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{
                padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px',
                fontSize: '13px', color: '#1e293b', outline: 'none', minWidth: '250px'
              }}
            />
            <select 
              value={filterGedung} 
              onChange={e => setFilterGedung(e.target.value)} 
              style={{
                padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px',
                fontSize: '13px', color: '#475569', background: '#fff', outline: 'none'
              }}
            >
              <option value="">Semua Asrama</option>
              {gedungs.map(g => <option key={g.id_gedung} value={g.id_gedung}>{g.nama_gedung}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Memuat data mahasiswa...
          </div>
        ) : error ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626' }}>{error}</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Asrama', 'Nama', 'NIM', 'Fakultas / Jurusan', 'Kamar', 'Status', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Tidak ada data mahasiswa ditemukan.</td></tr>
                  ) : (
                    filteredList.map(m => (
                      <tr key={m.id_mahasiswa} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                          {m.gedung ? m.gedung.nama_gedung : '-'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{m.nama}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>{m.nim}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{m.fakultas ? m.fakultas.nama : '-'}</div>
                          <div style={{ fontSize: '12px', marginTop: '2px' }}>{m.jurusan ? m.jurusan.nama : '-'}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>Lt.{m.lantai} / {m.nomor_kamar}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                          <span style={{ background: m.status_hunian === 'AKTIF' ? '#ecfdf5' : '#fef2f2', color: m.status_hunian === 'AKTIF' ? '#059669' : '#dc2626', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${m.status_hunian === 'AKTIF' ? '#a7f3d0' : '#fecaca'}` }}>
                            {m.status_hunian}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => openDetail(m)} style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Detail</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Detail Mahasiswa</h3>
            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '24px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', fontSize: '14px' }}>
              <div style={{ color: '#64748b', fontWeight: '500' }}>Asrama</div>
              <div style={{ color: '#059669', fontWeight: '700' }}>{selected.gedung ? selected.gedung.nama_gedung : '-'}</div>

              <div style={{ color: '#64748b', fontWeight: '500' }}>NIM</div>
              <div style={{ color: '#1e293b', fontWeight: '600', fontFamily: 'monospace' }}>{selected.nim}</div>
              
              <div style={{ color: '#64748b', fontWeight: '500' }}>Nama Lengkap</div>
              <div style={{ color: '#1e293b', fontWeight: '600' }}>{selected.nama}</div>
              
              <div style={{ color: '#64748b', fontWeight: '500' }}>Email</div>
              <div style={{ color: '#1e293b', fontWeight: '600' }}>{selected.email}</div>
              
              <div style={{ color: '#64748b', fontWeight: '500' }}>Fakultas / Jurusan</div>
              <div style={{ color: '#1e293b', fontWeight: '600' }}>
                {selected.fakultas ? selected.fakultas.nama : '-'} / {selected.jurusan ? selected.jurusan.nama : '-'}
              </div>
              
              <div style={{ color: '#64748b', fontWeight: '500' }}>Kamar</div>
              <div style={{ color: '#1e293b', fontWeight: '600' }}>Lantai {selected.lantai} - Kamar {selected.nomor_kamar}</div>
              
              <div style={{ color: '#64748b', fontWeight: '500' }}>Status Hunian</div>
              <div>
                <span style={{ background: selected.status_hunian === 'AKTIF' ? '#ecfdf5' : '#fef2f2', color: selected.status_hunian === 'AKTIF' ? '#059669' : '#dc2626', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${selected.status_hunian === 'AKTIF' ? '#a7f3d0' : '#fecaca'}` }}>
                  {selected.status_hunian}
                </span>
              </div>
              
              <div style={{ color: '#64748b', fontWeight: '500' }}>No. Telepon</div>
              <div style={{ color: '#1e293b', fontWeight: '600' }}>{selected.no_telp || '-'}</div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <button onClick={() => setModalOpen(false)} style={{ width: '100%', padding: '12px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </SuperadminLayout>
  );
}
