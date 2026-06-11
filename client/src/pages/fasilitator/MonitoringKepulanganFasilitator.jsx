import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FASILITATOR_MENU } from './fasilitatorMenu';
import { apiGetIzin } from '../../utils/api';
import Modal from '../../components/Modal';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconMapPin   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>;


function BadgeStatus({ statusDesc }) {
  let bg, color, border;
  if (statusDesc === 'Sudah Kembali') {
    bg = '#ecfdf5'; color = '#059669'; border = '#a7f3d0';
  } else if (statusDesc === 'Sudah Tiba') {
    bg = '#fffbeb'; color = '#d97706'; border = '#fde68a';
  } else {
    // Belum berangkat
    bg = '#f1f5f9'; color = '#64748b'; border = '#e2e8f0';
  }
  return (
    <span style={{ background: bg, color: color, border: `1px solid ${border}`, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {statusDesc}
    </span>
  );
}

function MonitoringKepulanganFasilitator() {
  const [dataIzin, setDataIzin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('Semua');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime: refresh saat ada update perizinan ────────────────────────────
  const onPerizinanUpdate = useCallback(() => fetchData(true), []);
  useSocket("perizinan:update", onPerizinanUpdate);

  const fetchData = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    try {
      const res = await apiGetIzin();
      if (res.status === 'Sukses') {
        const processed = processIzinData(res.data);
        setDataIzin(processed);

        // Jika URL punya parameter ?izin_id=123 — hanya cek di fetch pertama
        if (!isPoll) {
          const paramId = searchParams.get('izin_id');
          if (paramId) {
            const found = processed.find(x => x.id_perizinan.toString() === paramId);
            if (found) {
              setSelectedIzin(found);
              setShowModal(true);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  const processIzinData = (rawData) => {
    // Ambil izin yang sudah disetujui atau selesai
    const filtered = rawData.filter(x => x.status_pengajuan === 'DISETUJUI' || x.status_pengajuan === 'SELESAI');
    
    return filtered.map(item => {
      // Sistem baru: foto langsung di field foto_berangkat & foto_pulang
      const hasFotoBerangkat = !!item.foto_berangkat;
      const hasFotoPulang    = !!item.foto_pulang;

      // Fallback ke sistem lama (konfirmasis) jika foto baru belum ada
      const hasTibaLama    = item.konfirmasis?.find(k => k.jenis_konfirmasi === 'SAMPAI_TUJUAN');
      const hasKembaliLama = item.konfirmasis?.find(k => k.jenis_konfirmasi === 'KEMBALI_ASRAMA');
      
      let statusDesc = 'Belum Berangkat';
      if (hasFotoPulang || hasKembaliLama)        statusDesc = 'Sudah Kembali';
      else if (hasFotoBerangkat || hasTibaLama)  statusDesc = 'Sudah Tiba';

      return {
        ...item,
        statusDesc,
        // Sistem baru (prioritas)
        fotoBerangkat: item.foto_berangkat || null,
        fotoPulang:    item.foto_pulang    || null,
        // Sistem lama (fallback)
        buktiTiba:    hasTibaLama    || null,
        buktiKembali: hasKembaliLama || null,
      };
    });
  };



  const filteredData = dataIzin.filter(x => {
    if (filterTab === 'Semua') return true;
    return x.statusDesc === filterTab;
  });

  const formatDateStr = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatTimeStr = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout menuItems={FASILITATOR_MENU}>
      <div className="page-enter page-content">
        
        {/* Header */}
        <div className="section-animate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Monitoring Kepulangan</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
              Lihat bukti kepulangan dari mahasiswa yang izin keluar.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="section-animate" style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
          {['Semua', 'Belum Berangkat', 'Sudah Tiba', 'Sudah Kembali'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              style={{
                padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                border: filterTab === tab ? 'none' : '1px solid #e2e8f0',
                background: filterTab === tab ? '#10b981' : '#ffffff',
                color: filterTab === tab ? '#ffffff' : '#64748b',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="table-card card-animate card-animate-1">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat data kepulangan...</div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Belum ada data kepulangan.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>MAHASISWA</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>TUJUAN</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>BERANGKAT / KEMBALI</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>STATUS</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((izin, i) => (
                    <tr key={izin.id_perizinan} className="table-row row-animate" style={{ animationDelay: `${0.05 * i}s` }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{izin.mahasiswa.nama}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{izin.mahasiswa.nim}</div>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#475569' }}>{izin.alasan}</td>
                      <td style={{ padding: '14px 20px', color: '#475569' }}>
                        <div>{formatDateStr(izin.tanggal_mulai)}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>sd {formatDateStr(izin.tanggal_selesai)}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <BadgeStatus statusDesc={izin.statusDesc} />
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button 
                          onClick={() => { setSelectedIzin(izin); setShowModal(true); }}
                          style={{ background: '#f1f5f9', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#e0e7ff'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                        >
                          Lihat Bukti
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Lihat Bukti (via portal) */}
        <Modal isOpen={showModal && !!selectedIzin} onClose={() => setShowModal(false)} maxWidth="700px" noPadding>
          {selectedIzin && (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Bukti Kepulangan</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{selectedIzin.mahasiswa.nama} - {selectedIzin.mahasiswa.nim}</p>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', padding: '8px 12px', borderRadius: '12px' }}>✕</button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto' }}>
                {/* Info ringkas */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                   <div style={{ fontSize: '13px', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><strong style={{ color: '#0f172a' }}>Jenis:</strong> {selectedIzin.jenis_izin.replace('_', ' ')}</div>
                      <div><strong style={{ color: '#0f172a' }}>Tujuan Izin:</strong> {selectedIzin.alasan}</div>
                      

                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>

                  {/* ── Kartu Bukti Berangkat ── */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ background: '#f1f5f9', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                      Foto Bukti Sampai Pada Tujuan
                    </div>
                    {selectedIzin.fotoBerangkat ? (
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <img
                          src={selectedIzin.fotoBerangkat}
                          alt="Bukti Berangkat"
                          style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', background: '#f8fafc' }}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <a
                          href={selectedIzin.fotoBerangkat}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'block', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', width: '100%', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                        >
                          Lihat Foto
                        </a>
                      </div>
                    ) : selectedIzin.buktiTiba ? (
                      // Fallback sistem lama
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <img src={selectedIzin.buktiTiba.foto_bukti} alt="Bukti Tiba" style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'contain', borderRadius: '8px', marginBottom: '12px', background: '#f8fafc' }} />
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Diunggah {formatDateStr(selectedIzin.buktiTiba.waktu_konfirmasi)}</div>
                        <a href={selectedIzin.buktiTiba.foto_bukti} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', width: '100%', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>Lihat Foto</a>
                      </div>
                    ) : (
                      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Mahasiswa belum mengunggah foto.</div>
                    )}
                  </div>

                  {/* ── Kartu Bukti Pulang ── */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ background: '#f1f5f9', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                      Foto Bukti Sudah di Asrama
                    </div>
                    {selectedIzin.fotoPulang ? (
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <img
                          src={selectedIzin.fotoPulang}
                          alt="Bukti Pulang"
                          style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', background: '#f8fafc' }}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <a
                          href={selectedIzin.fotoPulang}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'block', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', width: '100%', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                        >
                          Lihat Foto
                        </a>
                      </div>
                    ) : selectedIzin.buktiKembali ? (
                      // Fallback sistem lama
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <img src={selectedIzin.buktiKembali.foto_bukti} alt="Bukti Kembali" style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'contain', borderRadius: '8px', marginBottom: '12px', background: '#f8fafc' }} />
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Diunggah {formatDateStr(selectedIzin.buktiKembali.waktu_konfirmasi)}</div>
                        <a href={selectedIzin.buktiKembali.foto_bukti} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', width: '100%', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>Lihat Foto</a>
                      </div>
                    ) : (
                      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Mahasiswa belum mengunggah foto.</div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
}

export default MonitoringKepulanganFasilitator;

