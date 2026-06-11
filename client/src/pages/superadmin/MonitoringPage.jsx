import { useState, useEffect, useMemo, useCallback } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';
import { useSocket } from '../../hooks/useSocket';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('simbima_token');

export default function MonitoringPage() {
  const [kegiatan, setKegiatan] = useState([]);
  const [asramasList, setAsramasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterAsrama, setFilterAsrama] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterJenis, setFilterJenis] = useState('');

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resKeg, resGedung] = await Promise.all([
        fetch(`${API}/api/kegiatan`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/api/admin/gedung`, { headers: { Authorization: `Bearer ${token()}` } })
      ]);

      const jsonKeg = await resKeg.json();
      const jsonGedung = await resGedung.json();

      if (resKeg.ok) setKegiatan(jsonKeg.data || []);
      else setError(jsonKeg.message || 'Gagal memuat data kegiatan.');

      if (resGedung.ok) setAsramasList(jsonGedung.data || []);
    } catch {
      setError('Tidak bisa terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Realtime: refresh saat ada update kegiatan atau absensi ───────────────
  useSocket("kegiatan:update", fetchData);
  useSocket("absensi:update",  fetchData);

  // We now use asramasList directly from the API instead of extracting from kegiatan.

  const filteredKegiatan = useMemo(() => {
    return kegiatan.filter(k => {
      if (filterAsrama && String(k.id_gedung) !== filterAsrama) return false;
      if (filterBulan) {
        const kDate = new Date(k.tanggal_kegiatan);
        const [y, m] = filterBulan.split('-');
        if (kDate.getFullYear() !== Number(y) || kDate.getMonth() + 1 !== Number(m)) return false;
      }
      if (filterJenis && k.jenisKegiatan !== filterJenis) return false;
      return true;
    });
  }, [kegiatan, filterAsrama, filterBulan, filterJenis]);

  const selectStyle = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', background: '#fff' };

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
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>Monitoring Kegiatan</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Pantau seluruh kegiatan pembinaan dari semua fasilitator</p>
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

        {/* Filter Panel */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter Asrama</label>
              <select value={filterAsrama} onChange={e => setFilterAsrama(e.target.value)} style={selectStyle}>
                <option value="">Semua Asrama</option>
                {asramasList.map(a => <option key={a.id_gedung} value={a.id_gedung}>{a.nama_gedung}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter Bulan</label>
              <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)} style={{ ...selectStyle, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter Jenis Kegiatan</label>
              <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} style={selectStyle}>
                <option value="">Semua Jenis Wajib</option>
                {[...new Map(kegiatan.filter(k => k.jenis_kegiatan).map(k => [k.jenis_kegiatan.id_jenis_kegiatan, k.jenis_kegiatan])).values()].map(j => (
                  <option key={j.id_jenis_kegiatan} value={String(j.id_jenis_kegiatan)}>{j.nama_jenis}</option>
                ))}
              </select>
            </div>
          </div>
          {(filterAsrama || filterBulan || filterJenis) && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Filter aktif:</span>
              <button onClick={() => { setFilterAsrama(''); setFilterBulan(''); setFilterJenis(''); }}
                style={{ fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '2px 10px', cursor: 'pointer' }}>
                Hapus Semua Filter
              </button>
            </div>
          )}
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px', color: '#dc2626', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Daftar Kegiatan</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f1f5f9', padding: '3px 10px', borderRadius: '20px' }}>{filteredKegiatan.length} kegiatan</span>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Memuat data...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Nama Kegiatan', 'Jenis', 'Asrama', 'Tanggal', 'Total Hadir', 'Total Alpha', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
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
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {k.jenis_kegiatan?.is_wajib ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                                {k.jenis_kegiatan.nama_jenis}
                              </span>
                              <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', fontWeight: '700', padding: '1px 7px', borderRadius: '10px', border: '1px solid #fecaca', width: 'fit-content' }}>WAJIB</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                                {k.jenis_kegiatan?.nama_jenis || 'Lainnya'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{k.gedung?.nama_gedung || '-'}</td>
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
                      <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                        Tidak ada data kegiatan yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden'
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

      </div>
    </SuperadminLayout>
  );
}
