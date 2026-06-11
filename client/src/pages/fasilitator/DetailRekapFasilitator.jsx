import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FASILITATOR_MENU } from './fasilitatorMenu';
import { apiGetRekapDetail, apiPublikasiRekap } from '../../utils/api';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconMapPin   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFileText = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;


const NAMA_BULAN = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Badge status rekap (3 nilai baru)
function BadgeStatus({ status }) {
  if (status === 'REWARD') {
    return <span style={{ background: '#fefce8', color: '#a16207', border: '1px solid #fde047', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Reward</span>;
  }
  if (status === 'DAPAT_IQAB') {
    return <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Dapat Iqob</span>;
  }
  // BEBAS_IQAB atau null
  return <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Bebas Iqob</span>;
}

function DetailRekapFasilitator() {
  // Support dua format URL:
  // Baru:  /fasilitator/rekap/2026-04-01  → tanggalMulai = '2026-04-01'
  // Lama:  /fasilitator/rekap/4/2026      → bulan='4', tahun='2026'
  const { bulan, tahun } = useParams();
  const isTanggalFormat = bulan && bulan.length > 4;
  const tanggalMulai = isTanggalFormat ? bulan : null;
  const navigate = useNavigate();
  
  const [dataRekap, setDataRekap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulan, tahun]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      // Gunakan tanggal_mulai jika format baru, fallback ke bulan/tahun
      const res = tanggalMulai
        ? await apiGetRekapDetail(tanggalMulai)   // GET /rekap/fasilitator/2026-04-01
        : await apiGetRekapDetail(bulan, tahun);   // GET /rekap/fasilitator/4/2026
      if (res.status === 'Sukses') {
        setDataRekap(res.data);
        if (res.data.length > 0) {
          setIsPublished(res.data[0].status_publikasi === 'PUBLISHED');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setShowModal(false);
    try {
      const tanggalParam = tanggalMulai || bulan;
      const res = await apiPublikasiRekap({ tanggal_mulai: tanggalParam, bulan, tahun });
      if (res.status === 'Sukses') {
        setAlertInfo({ type: 'success', text: 'Rekapitulasi berhasil dipublikasikan ke mahasiswa!' });
        await fetchDetail(); // refetch agar status_publikasi & tanggal_publikasi terupdate
      } else {
        setAlertInfo({ type: 'error', text: res.message || 'Gagal mempublikasikan' });
      }
    } catch (error) {
      setAlertInfo({ type: 'error', text: 'Terjadi kesalahan sistem' });
    } finally {
      setPublishing(false);
    }
  };


  const handleExportExcel = async () => {
    try {
      const endpoint = tanggalMulai
        ? `/api/rekap/fasilitator/${tanggalMulai}/export-excel`
        : `/api/rekap/fasilitator/${bulan}/${tahun}/export-excel`;

      const token = localStorage.getItem('simbima_token');
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Gagal export data');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      // Gunakan nama file dari backend jika memungkinkan, atau nama default
      a.download = `rekap-${tanggalMulai || bulan}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      setAlertInfo({ type: 'error', text: 'Gagal men-download file Excel.' });
    }
  };

  const strBulan = tanggalMulai
    ? '' // Akan ditampilkan dari infoPeriode.tanggal_mulai
    : (NAMA_BULAN[Number(bulan)] || bulan);

  // Info periode dari data rekap (ambil dari baris pertama)
  const infoPeriode = dataRekap[0] || null;

  return (
    <>
    <DashboardLayout menuItems={FASILITATOR_MENU}>
      <div className="page-enter page-content">
        
        {/* Navigasi & Alert */}
        <button className="no-print" onClick={() => navigate('/fasilitator/rekap')} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
          <span>←</span> Kembali
        </button>

        {alertInfo && (
           <div className="no-print" style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', background: alertInfo.type === 'success' ? '#ecfdf5' : '#fef2f2', color: alertInfo.type === 'success' ? '#059669' : '#dc2626', border: `1px solid ${alertInfo.type === 'success' ? '#a7f3d0' : '#fecaca'}`, fontWeight: '500' }}>
             {alertInfo.text}
           </div>
        )}

        {/* Header */}
        <div className="section-animate" style={{ marginBottom: '24px' }}>
          
          {/* Baris 1: Judul & Tombol Export (Flex Row) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
              Rekap: {infoPeriode?.tanggal_mulai
                ? `${new Date(infoPeriode.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} – ${new Date(infoPeriode.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : `${strBulan} ${tahun}`
              }
            </h1>
            <div className="no-print">
              <button onClick={handleExportExcel} style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                <IconFileText /> Export Excel
              </button>
            </div>
          </div>

          {/* Baris 2: Card Info Berdampingan (Grid 2 Kolom) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Card Kiri: Periode */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Periode</div>
              <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>
                {infoPeriode?.tanggal_mulai
                  ? `${new Date(infoPeriode.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(infoPeriode.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : `${strBulan} ${tahun}`
                }
              </div>
            </div>

            {/* Card Kanan: Batas Alfa */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Batas Alfa</div>
              <div style={{ fontSize: '15px', color: '#dc2626', fontWeight: '700' }}>
                {infoPeriode?.batas_alfa != null ? `${infoPeriode.batas_alfa}×` : '–'}
              </div>
            </div>
          </div>

          {/* Baris 3: Box Pengumuman Penebusan Iqab */}
          {infoPeriode?.pengumuman_iqab && (
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '13px', color: '#854d0e', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📢</span> Pengumuman Penebusan Iqab
              </div>
              <div style={{ fontSize: '14px', color: '#713f12', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {infoPeriode.pengumuman_iqab}
              </div>
            </div>
          )}

        </div>

        {/* Tabel */}
        <div className="table-card card-animate card-animate-1" style={{ border: '1px solid #e2e8f0', background: '#fff' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat rinician absensi...</div>
          ) : dataRekap.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Belum ada entri apapun di bulan ini.</div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569', width: '50px' }}>NO</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#475569' }}>MAHASISWA</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569' }}>KAMAR</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569' }}>HADIR</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569' }}>IZIN/SAKIT</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569' }}>ALPHA</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569' }}>% KEHADIRAN</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRekap.map((r, i) => {
                    // Warna baris berdasar status_iqab
                    let trBg = 'transparent';
                    if (r.status_iqab === 'REWARD')     trBg = '#fefce8'; // kuning muda
                    if (r.status_iqab === 'DAPAT_IQAB') trBg = '#fff1f2'; // merah muda

                    return (
                      <tr key={r.id_rekap} style={{ background: trBg, borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b' }}>{i + 1}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{r.mahasiswa.nama}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{r.mahasiswa.nim}</div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#334155', fontWeight: '500' }}>
                          {r.mahasiswa.nomor_kamar || '–'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', color: '#059669' }}>{r.total_hadir}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', color: '#d97706' }}>{r.total_izin}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', color: '#dc2626' }}>{r.total_alpha}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{r.persentase_kehadiran}%</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>dari {r.total_kegiatan} keg.</div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <BadgeStatus status={r.status_iqab || 'BEBAS_IQAB'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Print Style */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            .no-print { display: none !important; }
            .table-card, .table-card * { visibility: visible; }
            .table-card { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
            th { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
          }
        `}} />

      </div>
    </DashboardLayout>

    {/* Modal Konfirmasi Publikasi — di luar DashboardLayout agar overlay full viewport */}
    {showModal && createPortal((
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '16px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '36px 32px 28px',
          maxWidth: '400px', width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)', textAlign: 'center',
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0fdf4', border: '3px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round"/>
              <polyline points="22 4 12 14.01 9 11.01" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: '19px', fontWeight: '700', color: '#0f172a' }}>Publikasikan Rekap?</h2>
          <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: '1.65' }}>
            Rekap akan dapat dilihat oleh mahasiswa dan{' '}
            <strong style={{ color: '#0f172a' }}>tidak dapat dibatalkan</strong>{' '}setelah dipublikasikan.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Batal</button>
            <button onClick={handlePublish} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>Ya, Publikasikan</button>
          </div>
        </div>
      </div>
    ), document.body)}
    </>
  );
}

export default DetailRekapFasilitator;


