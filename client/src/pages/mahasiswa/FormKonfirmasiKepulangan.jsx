import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function FormKonfirmasiKepulangan({ jenis }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [izin, setIzin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [file, setFile] = useState(null);
  const [previewSize, setPreviewSize] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menyesuaikan label dan payload tergantung prop "jenis"
  const isTiba = jenis === 'tiba';
  const labelJenis = isTiba ? 'Sampai Tujuan' : 'Kembali Ke Asrama';
  const jenisKonfirmasiPayload = isTiba ? 'SAMPAI_TUJUAN' : 'KEMBALI_ASRAMA';

  useEffect(() => {
    fetchIzinDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, jenis]);

  const fetchIzinDetail = async () => {
    try {
      const token = localStorage.getItem('simbima_token');
      const response = await fetch(`http://localhost:5000/api/izin/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const resData = await response.json();
      if (response.ok) {
        if (resData.data.status_pengajuan !== "DISETUJUI") {
          // Jika izin belum disetujui, tolak akses dan arahkan kembali
          navigate('/mahasiswa/izin');
        } else {
          setIzin(resData.data);
        }
      } else {
        setErrorMsg(resData.message || 'Gagal mengambil data perizinan.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const processFile = (fileObj) => {
    setFileError('');
    if (!fileObj) return;

    // Batas 2MB
    const maxSize = 2 * 1024 * 1024; 
    
    // Validasi Tipe
    const validMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validMimes.includes(fileObj.type)) {
      setFileError('Format file harus beruba gambar (JPG/PNG).');
      return;
    }

    if (fileObj.size > maxSize) {
      setFileError('Ukuran gambar maksimal 2MB.');
      return;
    }

    setFile(fileObj);
    setPreviewSize((fileObj.size / (1024 * 1024)).toFixed(2) + ' MB');
    
    // Buat object URL untuk preview thumbnail
    const objectUrl = URL.createObjectURL(fileObj);
    setPreviewUrl(objectUrl);
    
    // revoke on unmount happens in useEffect cleanup usually, but JS engine handles it fine for simple forms
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl('');
    setPreviewSize('');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('simbima_token');
      
      const formData = new FormData();
      formData.append('id_perizinan', id);
      formData.append('jenis_konfirmasi', jenisKonfirmasiPayload);
      formData.append('foto_bukti', file);
      // Anda juga bisa append keterangan dll jika mau

      const response = await fetch(`http://localhost:5000/api/izin/konfirmasi`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Jangan set Content-Type untuk multipart/form-data; browser akan menyet otomatis bersama proper boundaries let
        },
        body: formData
      });

      const resData = await response.json();
      
      if (response.ok) {
        alert(isTiba ? "Bukti sampai tujuan berhasil dikirim!" : "Bukti kembali ke asrama berhasil dikirim!");
        navigate('/mahasiswa/dashboard');
      } else {
        alert(resData.message || "Gagal mengupload bukti");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat unggah.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if(!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Memuat data izin...</div>;
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-sm w-full text-center">
          <h2 className="font-bold mb-2">Terjadi Kesalahan</h2>
          <p>{errorMsg}</p>
          <button onClick={() => navigate('/mahasiswa/dashboard')} className="mt-4 px-4 py-2 bg-red-100 font-medium rounded-lg hover:bg-red-200">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Modal-like */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Konfirmasi Kepulangan
            </h1>
            <p className="text-xs text-slate-500 font-medium">Laporan Bukti {labelJenis}</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        
        {/* Info Izin Card */}
        <div className="bg-indigo-600 rounded-2xl p-5 text-white mb-6 shadow-md shadow-indigo-200">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-indigo-500/50 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
              {izin?.jenis_izin.replace('_', ' ')}
            </span>
            <span className="text-indigo-100 text-sm">Durasi: {izin?.durasi_hari} hr</span>
          </div>
          <p className="text-sm text-indigo-100 mb-1">Berangkat: {formatDate(izin?.tanggal_mulai)}</p>
          <p className="font-medium">Tujuan: {izin?.alasan}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-slate-700">
          <label className="block text-sm font-bold text-slate-800 mb-3">Upload Foto {isTiba ? "Kedatangan" : "Asrama"}</label>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Silakan lampirkan foto/selfie terbaru Anda secara {isTiba ? "di lokasi tujuan" : "di depan asrama"} sebagai bukti pendukung lapor diri.
          </p>

          {/* Area Upload/Tarik File */}
          <div 
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors relative
              ${file ? 'border-emerald-500 bg-emerald-50/30' : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/80'}
            `}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            {file ? (
               <div className="relative">
                 <img src={previewUrl} alt="Preview" className="mx-auto h-40 object-cover rounded-xl shadow-sm border border-slate-200 mb-3" />
                 <div className="text-sm font-medium text-emerald-700">{file.name}</div>
                 <div className="text-xs text-slate-500">{previewSize}</div>
                 <button type="button" onClick={clearFile} className="mt-3 text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1 bg-red-50 hover:bg-red-100 rounded-full transition-colors">Ganti File</button>
               </div>
            ) : (
              // Clicable drag drop
              <div 
                className="cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 text-indigo-600">
                   <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                </div>
                <h4 className="font-bold text-sm mb-1 text-slate-700">Klik atau Tarik gambar ke sini</h4>
                <p className="text-xs text-slate-500">Mendukung file .JPG, .PNG maksimal 2MB</p>
              </div>
            )}
            
            {/* Hidden Input File */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg, image/png, image/jpg"
              onChange={handleFileChange}
            />
          </div>

          {fileError && <p className="text-red-500 text-xs mt-2 font-medium bg-red-50 p-2 rounded-lg">{fileError}</p>}

          <button
            type="submit"
            disabled={!file || isSubmitting}
            className={`w-full mt-6 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-sm
              ${(!file || isSubmitting) 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 shadow-lg'
              }
            `}
          >
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {isSubmitting ? 'Mengunggah...' : `Kirim Bukti ${labelJenis}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FormKonfirmasiKepulangan;
