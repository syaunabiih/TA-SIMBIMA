import { useState, useEffect } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';

const API = import.meta.env.VITE_API_URL || '';
const token = () => localStorage.getItem('simbima_token');

const STATUS_COLOR = {
  PUBLISHED: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  DRAFT:     { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
  ARCHIVED:  { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
};

const IQAB_COLOR = {
  REWARD:     { bg: '#ecfdf5', color: '#059669' },
  BEBAS_IQAB: { bg: '#eff6ff', color: '#2563eb' },
  DAPAT_IQAB: { bg: '#fef2f2', color: '#dc2626' },
};

export default function RekapPage() {
  const [gedungs, setGedungs] = useState([]);
  const [selectedGedung, setSelectedGedung] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [rekapList, setRekapList] = useState([]);
  const [selectedRekap, setSelectedRekap] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/gedung`, { headers: { Authorization: `Bearer ${token()}` } });
        const json = await res.json();
        if (res.ok) setGedungs(json.data || []);
      } catch {}
    })();
  }, []);

  const loadRekap = async () => {
    setLoading(true); setError(''); setRekapList([]); setSelectedRekap(null); setDetailData([]);
    try {
      const q = selectedGedung ? `?id_gedung=${selectedGedung}` : '';
      const res = await fetch(`${API}/api/rekap/fasilitator${q}`, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      if (res.ok) setRekapList(json.data || []);
      else setError(json.message || 'Gagal memuat rekap.');
    } catch { setError('Tidak bisa terhubung ke server.'); }
    finally { setLoading(false); }
  };

  const loadDetail = async (rekap) => {
    setSelectedRekap(rekap);
    setLoadingDetail(true); setDetailData([]);
    try {
      const tgl = rekap.tanggal_mulai ? rekap.tanggal_mulai.substring(0, 10) : `${rekap.bulan}`;
      const q = selectedGedung ? `?id_gedung=${selectedGedung}` : '';
      const res = await fetch(`${API}/api/rekap/fasilitator/${tgl}${q}`, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      if (res.ok) setDetailData(json.data || []);
    } catch {}
    finally { setLoadingDetail(false); }
  };

  const handleExport = async () => {
    if (!selectedRekap) return;
    setExporting(true);
    try {
      const tgl = selectedRekap.tanggal_mulai ? selectedRekap.tanggal_mulai.substring(0, 10) : `${selectedRekap.bulan}`;
      const q = selectedGedung ? `?id_gedung=${selectedGedung}` : '';
      
      const res = await fetch(`${API}/api/rekap/fasilitator/${tgl}/export-excel${q}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) throw new Error('Gagal mengekspor data.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rekap_Absensi_${tgl}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  };

  const fmtTgl = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const filteredRekapList = rekapList.filter(r => {
    if (filterBulan && r.bulan !== Number(filterBulan)) return false;
    if (filterTahun && String(r.tahun) !== filterTahun) return false;
    return true;
  });

  return (
    <SuperadminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>Rekap Absensi</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Lihat rekapitulasi kehadiran mahasiswa per periode dan gedung</p>
        </div>

        {/* Filter */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter Gedung</label>
            <select value={selectedGedung} onChange={e => setSelectedGedung(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', background: '#fff' }}>
              <option value="">Semua Gedung</option>
              {gedungs.map(g => <option key={g.id_gedung} value={String(g.id_gedung)}>{g.nama_gedung}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter Bulan</label>
            <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', background: '#fff' }}>
              <option value="">Semua Bulan</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(b => (
                <option key={b} value={b}>{new Date(2000, b - 1, 1).toLocaleDateString('id-ID', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter Tahun</label>
            <input type="number" placeholder="Contoh: 2026" value={filterTahun} onChange={e => setFilterTahun(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', boxSizing: 'border-box' }} />
          </div>
          <button onClick={loadRekap} disabled={loading} style={{
            padding: '9px 24px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          }}>
            {loading ? 'Memuat...' : 'Tampilkan Rekap'}
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px', color: '#dc2626', marginBottom: '16px' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: selectedRekap ? '320px 1fr' : '1fr', gap: '20px' }}>
          {/* List Rekap */}
          {rekapList.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>Daftar Periode</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{filteredRekapList.length} periode</span>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
                {filteredRekapList.map((r, i) => {
                  const sc = STATUS_COLOR[r.status_publikasi] || STATUS_COLOR.DRAFT;
                  const isActive = selectedRekap?.tanggal_mulai === r.tanggal_mulai;
                  return (
                    <div
                      key={i}
                      onClick={() => loadDetail(r)}
                      style={{
                        padding: '14px 18px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                        background: isActive ? 'linear-gradient(135deg, #ede9fe, #ddd6fe)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: isActive ? '#7c3aed' : '#1e293b' }}>
                            {fmtTgl(r.tanggal_mulai)} – {fmtTgl(r.tanggal_selesai)}
                          </div>
                          {r.gedung && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{r.gedung.nama_gedung}</div>}
                        </div>
                        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' }}>
                          {r.status_publikasi}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detail Rekap */}
          {selectedRekap && (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                  Detail: {fmtTgl(selectedRekap.tanggal_mulai)} – {fmtTgl(selectedRekap.tanggal_selesai)}
                </span>
                <button onClick={handleExport} disabled={exporting} style={{
                  background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}>
                  {exporting ? 'Mengunduh...' : 'Export Excel'}
                </button>
              </div>
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat detail...</div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Nama', 'NIM', 'Kamar', 'Hadir', 'Izin', 'Alpha', '%', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map(r => {
                        const ic = IQAB_COLOR[r.status_iqab] || { bg: '#f1f5f9', color: '#64748b' };
                        return (
                          <tr key={r.id_rekap} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{r.mahasiswa?.nama}</td>
                            <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{r.mahasiswa?.nim}</td>
                            <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>{r.mahasiswa?.nomor_kamar}</td>
                            <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '600', color: '#059669' }}>{r.total_hadir}</td>
                            <td style={{ padding: '10px 14px', fontSize: '13px', color: '#2563eb' }}>{r.total_izin}</td>
                            <td style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}>{r.total_alpha}</td>
                            <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>{Number(r.persentase_kehadiran).toFixed(1)}%</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ background: ic.bg, color: ic.color, fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' }}>
                                {r.status_iqab}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {rekapList.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            Klik "Tampilkan Rekap" untuk melihat data rekapitulasi.
          </div>
        )}
      </div>
    </SuperadminLayout>
  );
}
