import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function FormAbsensiPetugas() {
  const { kegiatan_id } = useParams();
  const navigate = useNavigate();

  const [kegiatan, setKegiatan] = useState(null);
  const [mahasiswa, setMahasiswa] = useState([]);
  const [kehadiran, setKehadiran] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lantai, setLantai] = useState(null);
  const [blok, setBlok] = useState('');
  const [successBox, setSuccessBox] = useState(false);   // ← message box sukses
  const [submitError, setSubmitError] = useState('');    // ← toast error submit
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    fetchData();
    // Refetch saat tab kembali aktif — sinkronisasi dengan perubahan fasilitator
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kegiatan_id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('simbima_token');
      const response = await fetch(`http://localhost:5000/api/kegiatan/absensi-form/${kegiatan_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 403) {
        navigate('/403', { replace: true }); // Atau bisa buat halaman 403 khusus
        return;
      }
      
      if (response.status === 404) {
        setErrorMsg('Kegiatan tidak ditemukan.');
        setLoading(false);
        return;
      }

      const resData = await response.json();
      if (response.ok) {
        setKegiatan(resData.data.kegiatan);
        setMahasiswa(resData.data.mahasiswa);
        setLantai(resData.data.lantai);
        setBlok(resData.data.blok);
        
        // Prefill state kehadiran jika sudah ada isinya (dari Fasilitator)
        const initialKehadiran = {};
        resData.data.mahasiswa.forEach(m => {
          if (m.status_kehadiran) {
            initialKehadiran[m.id_mahasiswa] = m.status_kehadiran;
          }
        });
        setKehadiran(initialKehadiran);
        
        // Cek jika sudah pernah submit
        if (resData.data.kegiatan.status_tugas === 'SELESAI') {
          setErrorMsg('Anda sudah men-submit absensi untuk kegiatan ini.');
        }
      } else {
        setErrorMsg(resData.message || 'Gagal mengambil data form absensi.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = (id_mahasiswa, status) => {
    setKehadiran(prev => ({
      ...prev,
      [id_mahasiswa]: status
    }));
  };

  const handleConfirmSubmit = () => {
    setShowConfirm(true);
  };

  const submitAbsensi = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('simbima_token');
      const payload = {
        id_kegiatan: Number(kegiatan_id),
        daftar_hadir: mahasiswa.map(m => ({
          id_mahasiswa: m.id_mahasiswa,
          status_kehadiran: kehadiran[m.id_mahasiswa],
          keterangan: "" // Bisa ditambah field keterangan jika diperlukan
        }))
      };

      const response = await fetch('http://localhost:5000/api/kegiatan/absen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        // Tampilkan message box sukses + hitung mundur
        setSuccessBox(true);
        let sisa = 3;
        setCountdown(sisa);
        const timer = setInterval(() => {
          sisa -= 1;
          setCountdown(sisa);
          if (sisa <= 0) {
            clearInterval(timer);
            navigate('/mahasiswa/dashboard');
          }
        }, 1000);
      } else {
        setSubmitError(data.message || 'Gagal submit absensi.');
        setTimeout(() => setSubmitError(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setSubmitError('Terjadi kesalahan jaringan saat submit absensi.');
      setTimeout(() => setSubmitError(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Render Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 animate-pulse font-medium">Memuat data absensi...</p>
      </div>
    );
  }

  // Render Error
  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm max-w-sm w-full text-center border border-red-100">
          <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Akses Ditolak</h2>
          <p className="text-slate-600 mb-6">{errorMsg}</p>
          <button 
            onClick={() => navigate('/mahasiswa/dashboard')}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(kehadiran).length;
  const totalCount = mahasiswa.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((answeredCount / totalCount) * 100);
  const isSubmitDisabled = answeredCount < totalCount || isSubmitting;
  
  const userInfo = JSON.parse(localStorage.getItem('user_data') || '{}');

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ====== SUCCESS MESSAGE BOX (overlay) ====== */}
      {successBox && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '40px 32px',
            maxWidth: '360px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
            animation: 'scaleIn 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {/* Ikon centang */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>
              Absensi Tersimpan!
            </h2>
            <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '14px' }}>
              Data kehadiran untuk <strong>Lantai {lantai} Blok {blok}</strong> berhasil dicatat.
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
              Total <strong>{mahasiswa.length}</strong> mahasiswa telah diabsen.
            </p>
            {/* Countdown bar */}
            <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '6px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: '99px',
                width: `${(countdown / 3) * 100}%`,
                transition: 'width 0.9s linear',
              }} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px' }}>
              Kembali ke dashboard dalam <strong>{countdown}</strong> detik...
            </p>
            <button
              onClick={() => navigate('/mahasiswa/dashboard')}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontWeight: '700', fontSize: '15px',
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
              }}
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ====== TOAST ERROR SUBMIT ====== */}
      {submitError && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: '#dc2626', color: 'white',
          padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
          boxShadow: '0 8px 24px rgba(220,38,38,0.35)',
          zIndex: 9998, maxWidth: '90%', textAlign: 'center',
          animation: 'slideInDown 0.3s ease',
        }}>
          ⚠ {submitError}
        </div>
      )}

      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Form Absensi</h1>
            {lantai && blok && (
              <p className="text-xs font-semibold text-emerald-600">Silakan Mengisi Absensi Dengan Jujur</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        
        {/* Info Kegiatan Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-5 text-white mb-6 shadow-md shadow-indigo-200">
          <h2 className="text-xl font-bold mb-1">{kegiatan?.nama_kegiatan}</h2>
          <div className="flex flex-col gap-1.5 mt-4 text-indigo-50 text-sm">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>
              <span>{formatDate(kegiatan?.tanggal_kegiatan)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2"/></svg>
              <span>{formatTime(kegiatan?.waktu_mulai)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>
              <span>{kegiatan?.gedung} • Lantai {lantai ?? kegiatan?.lantai_tugas} Blok {blok ?? kegiatan?.blok_tugas}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span className="text-slate-700">Progress Absensi</span>
            <span className={answeredCount === totalCount ? "text-emerald-500" : "text-indigo-600"}>
              {answeredCount} dari {totalCount} mahasiswa
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${answeredCount === totalCount ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Tabel Mahasiswa */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">No</th>
                  <th className="px-4 py-3">Nama Mahasiswa</th>
                  <th className="px-4 py-3">Kamar</th>
                  <th className="px-4 py-3 min-w-[140px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mahasiswa.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500 italic">
                      Tidak ada data mahasiswa di lantai ini.
                    </td>
                  </tr>
                ) : (
                  mahasiswa.map((mhs, idx) => (
                    <tr key={mhs.id_mahasiswa} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-4 font-medium text-slate-700">
                        {mhs.nama}
                        <div className="text-xs text-slate-400 font-normal mt-0.5">{mhs.nim}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{mhs.nomor_kamar}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const val = kehadiran[mhs.id_mahasiswa];
                          const styles = {
                            'HADIR': { bg: '#ecfdf5', border: '#10b981', color: '#065f46' },
                            'IZIN':  { bg: '#eff6ff', border: '#3b82f6', color: '#1e40af' },
                            'SAKIT': { bg: '#fffbeb', border: '#f59e0b', color: '#78350f' },
                            'ALPHA': { bg: '#fef2f2', border: '#ef4444', color: '#7f1d1d' },
                          };
                          const s = styles[val] || { bg: '#f8fafc', border: '#cbd5e1', color: '#64748b' };
                          return (
                            <select
                              value={val || ''}
                              onChange={(e) => handleChangeStatus(mhs.id_mahasiswa, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '7px 32px 7px 12px',
                                borderRadius: '10px',
                                border: `2px solid ${s.border}`,
                                background: s.bg,
                                color: s.color,
                                fontWeight: '600',
                                fontSize: '13px',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 8px center',
                                backgroundSize: '1.2em 1.2em',
                              }}
                            >
                              <option value="" disabled>-- Pilih --</option>
                              <option value="HADIR">Hadir</option>
                              <option value="IZIN">Izin</option>
                              <option value="SAKIT">Sakit</option>
                              <option value="ALPHA">Alfa</option>
                            </select>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Area */}
        <button
          onClick={handleConfirmSubmit}
          disabled={isSubmitDisabled}
          className={`w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-bold text-white transition-all shadow-sm
            ${isSubmitDisabled 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 active:translate-y-0 shadow-emerald-200 shadow-lg'
            }`}
        >
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {isSubmitting ? 'Memproses...' : 'Submit Absensi'}
        </button>

      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Submit</h3>
            <p className="text-slate-600 mb-8">Yakin data sudah benar? Data yang sudah disubmit <strong className="text-slate-800">tidak bisa diubah kembali</strong>.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-4 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={submitAbsensi}
                className="flex-1 py-3 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center rounded-xl transition-colors"
              >
                Ya, Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FormAbsensiPetugas;
