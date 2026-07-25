import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FASILITATOR_MENU } from './fasilitatorMenu';
import { apiGetRekapFasilitator } from '../../utils/api';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconMapPin   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>;


const NAMA_BULAN = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function RekapFasilitator() {
  const navigate = useNavigate();
  const [rekapList, setRekapList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const msg = sessionStorage.getItem('rekap_success');
    if (msg) {
      setAlert({ type: 'success', msg });
      sessionStorage.removeItem('rekap_success');
      setTimeout(() => setAlert(null), 5000);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await apiGetRekapFasilitator();
      if (res.status === 'Sukses') {
        // Sort by tanggal_generate descending (terbaru di atas)
        const sorted = (res.data || []).sort((a, b) =>
          new Date(b.tanggal_generate || 0) - new Date(a.tanggal_generate || 0)
        );
        setRekapList(sorted);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (status) => {
    if (status === 'PUBLISHED') return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'Terpublikasi' };
    return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', label: 'Draft' };
  };

  return (
    <DashboardLayout menuItems={FASILITATOR_MENU}>
      <div className="page-enter page-content">
        
        {/* Header */}
        <div className="section-animate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Rekapitulasi Absensi</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
              Lihat dan buat laporan absensi bulanan untuk dievaluasi.
            </p>
          </div>
          <button className="btn-cta" onClick={() => navigate('/fasilitator/rekap/generate')}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Generate Rekap Baru
          </button>
        </div>

        {/* Alert toast (dari generate rekap) */}
        {alert && (
          <div style={{
            marginBottom: '16px', padding: '12px 16px', borderRadius: '10px',
            background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: alert.type === 'success' ? '#047857' : '#dc2626',
            fontSize: '14px', fontWeight: '500',
          }}>
            {alert.type === 'success' ? '✓' : '⚠'} {alert.msg}
          </div>
        )}

        {/* Tabel */}
        <div className="table-card card-animate card-animate-1">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat riwayat rekap...</div>
          ) : rekapList.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Belum ada rekap dibuat</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Klik tombol "Generate Rekap Baru" untuk memulai evaluasi bulanan.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>PERIODE</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>STATUS</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>TERAKHIR DIGENERATE</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', color: '#64748b', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {rekapList.map((rekap, i) => {
                    const badge = getBadgeStyle(rekap.status_publikasi);
                    return (
                      <tr key={i} className="table-row row-animate" style={{ animationDelay: `${0.05 * i}s` }}>
                        <td style={{ padding: '14px 20px', fontWeight: '600', color: '#1e293b' }}>
                          {rekap.tanggal_mulai
                            ? `${new Date(rekap.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(rekap.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : `${NAMA_BULAN[rekap.bulan]} ${rekap.tahun}`
                          }
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#64748b' }}>
                          {new Date(rekap.tanggal_generate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              // Gunakan tanggal_mulai jika ada (format baru), fallback ke bulan/tahun
                              const path = rekap.tanggal_mulai
                                ? `/fasilitator/rekap/${rekap.tanggal_mulai.split('T')[0]}`
                                : `/fasilitator/rekap/${rekap.bulan}/${rekap.tahun}`;
                              navigate(path);
                            }}
                            style={{ background: '#f1f5f9', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e0e7ff'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default RekapFasilitator;

