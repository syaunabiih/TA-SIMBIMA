import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiBuatKegiatan } from '../../utils/api';

const MENU = [
  { path: '/fasilitator/dashboard',  label: 'Dashboard',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { path: '/fasilitator/kegiatan',   label: 'Kelola Kegiatan', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg> },
  { path: '/fasilitator/perizinan',  label: 'Validasi Izin',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg> },
  { path: '/fasilitator/kepulangan', label: 'Kepulangan',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg> },
  { path: '/fasilitator/rekap',      label: 'Rekap Absensi',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/></svg> },
];

const JENIS_KEGIATAN = [
  { value: 'SHALAT_SUBUH',         label: 'Shalat Subuh' },
  { value: 'ABSENSI_MALAM',        label: 'Absensi Malam' },
  { value: 'KEGIATAN_PEMBINAAN',   label: 'Kegiatan Pembinaan' },
  { value: 'KEGIATAN_KEBERSAMAAN', label: 'Kegiatan Kebersamaan' },
  { value: 'KEGIATAN_AMA',         label: 'Kegiatan AMA' },
  { value: 'LAINNYA',              label: 'Lainnya' },
];

function TambahKegiatanPage() {
  const navigate = useNavigate();
  const [error, setError]         = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused]     = useState('');

  const [form, setForm] = useState({
    nama_kegiatan:  '',
    lokasi:         '',
    jenis_kegiatan: 'SHALAT_SUBUH',
    qr_durasi_menit: 30,
  });

  const inputStyle = (field) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    fontSize: '14px',
    background: focused === field ? '#ffffff' : '#f8fafc',
    border: `1.5px solid ${focused === field ? '#10b981' : '#e2e8f0'}`,
    color: '#1e293b',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.25s ease',
    boxShadow: focused === field ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
  });

  const handleSubmit = async () => {
    if (!form.nama_kegiatan.trim() || !form.lokasi.trim()) {
      setError('Nama kegiatan dan lokasi wajib diisi.');
      return;
    }
    const menit = Number(form.qr_durasi_menit);
    if (!menit || menit < 1 || menit > 480) {
      setError('Durasi QR harus antara 1 – 480 menit.');
      return;
    }
    setError('');
    setSubmitting(true);

    const now    = new Date();
    const pad    = (n) => String(n).padStart(2, '0');
    const today  = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const waktu  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const payload = {
      ...form,
      tanggal_kegiatan:  today,
      waktu_mulai:       waktu,
      waktu_selesai:     waktu,
      qr_durasi_menit:   Number(form.qr_durasi_menit),
      petugas:           [],
    };

    try {
      const res = await apiBuatKegiatan(payload);
      if (res.status === 'Sukses') {
        const newId = res.data?.id_kegiatan;
        sessionStorage.setItem('kegiatan_success', 'Kegiatan berhasil dibuat! QR absensi sudah tersedia.');
        setSuccessMsg('Kegiatan berhasil dibuat! Membuka QR...');
        setTimeout(() => {
          if (newId) {
            navigate(`/fasilitator/kegiatan/${newId}`, { state: { autoShowQr: true } });
          } else {
            navigate('/fasilitator/kegiatan');
          }
        }, 800);
      } else {
        setError(res.message || 'Terjadi kesalahan saat menyimpan.');
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter page-content">

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#94a3b8', fontSize: '13px' }}>
          <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => navigate('/fasilitator/kegiatan')}>Kelola Kegiatan</span>
          <span>›</span>
          <span style={{ color: '#1e293b', fontWeight: '600' }}>Buat Kegiatan</span>
        </div>

        {/* Info QR Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
          border: '1px solid #a7f3d0',
          borderRadius: '14px', padding: '14px 20px',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2"/>
              <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2"/>
              <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2"/>
              <rect x="13" y="13" width="4" height="4" rx="1" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: '700', color: '#065f46', fontSize: '14px' }}>Absensi via QR Code</div>
            <div style={{ color: '#047857', fontSize: '12px', marginTop: '2px' }}>
              QR code akan otomatis dibuat saat kegiatan disimpan. Tampilkan di layar agar mahasiswa bisa scan.
            </div>
          </div>
        </div>

        {/* Card Form */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', maxWidth: '600px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Info Kegiatan</h1>
          <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '14px' }}>Isi nama kegiatan, lokasi, dan jenis untuk memulai.</p>

          {error && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '13px', marginBottom: '20px' }}>
              ⚠ {error}
            </div>
          )}
          {successMsg && (
            <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#047857', fontSize: '13px', marginBottom: '20px' }}>
              ✓ {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Nama Kegiatan */}
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Nama Kegiatan <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="contoh: Shalat Subuh Berjamaah"
                value={form.nama_kegiatan}
                onChange={e => setForm({ ...form, nama_kegiatan: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                onFocus={() => setFocused('nama')}
                onBlur={() => setFocused('')}
                style={inputStyle('nama')}
              />
            </div>

            {/* Lokasi */}
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Lokasi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="contoh: Masjid Nurul Ilmi"
                value={form.lokasi}
                onChange={e => setForm({ ...form, lokasi: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                onFocus={() => setFocused('lokasi')}
                onBlur={() => setFocused('')}
                style={inputStyle('lokasi')}
              />
            </div>

            {/* Jenis Kegiatan */}
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Jenis Kegiatan <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={form.jenis_kegiatan}
                onChange={e => setForm({ ...form, jenis_kegiatan: e.target.value })}
                onFocus={() => setFocused('jenis')}
                onBlur={() => setFocused('')}
                style={{ ...inputStyle('jenis'), cursor: 'pointer' }}
              >
                {JENIS_KEGIATAN.map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
            </div>

            {/* Durasi QR */}
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Durasi QR Absensi <span style={{ color: '#ef4444' }}>*</span>
                <span style={{ marginLeft: '8px', color: '#94a3b8', fontWeight: '400', fontSize: '12px' }}>berapa lama QR bisa di-scan mahasiswa</span>
              </label>

              {/* Preset chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[15, 30, 45, 60, 90].map(mnt => (
                  <button
                    key={mnt}
                    type="button"
                    onClick={() => setForm({ ...form, qr_durasi_menit: mnt })}
                    style={{
                      padding: '6px 16px', borderRadius: '20px', fontSize: '13px',
                      fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                      border: '1.5px solid',
                      background: form.qr_durasi_menit === mnt ? '#10b981' : '#f8fafc',
                      color:      form.qr_durasi_menit === mnt ? 'white'   : '#64748b',
                      borderColor:form.qr_durasi_menit === mnt ? '#10b981' : '#e2e8f0',
                      boxShadow:  form.qr_durasi_menit === mnt ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
                    }}
                  >
                    {mnt} mnt
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={form.qr_durasi_menit}
                  onChange={e => setForm({ ...form, qr_durasi_menit: e.target.value === '' ? '' : Number(e.target.value) })}
                  onFocus={() => setFocused('durasi')}
                  onBlur={() => setFocused('')}
                  style={{ ...inputStyle('durasi'), maxWidth: '120px' }}
                />
                <span style={{ color: '#64748b', fontSize: '14px', whiteSpace: 'nowrap' }}>menit</span>
                {form.qr_durasi_menit > 0 && (
                  <span style={{
                    fontSize: '12px', color: '#059669', fontWeight: '600',
                    background: '#ecfdf5', border: '1px solid #a7f3d0',
                    padding: '3px 10px', borderRadius: '20px',
                  }}>
                    QR aktif selama {form.qr_durasi_menit >= 60
                      ? `${Math.floor(form.qr_durasi_menit / 60)}j${form.qr_durasi_menit % 60 > 0 ? ` ${form.qr_durasi_menit % 60}m` : ''}`
                      : `${form.qr_durasi_menit} mnt`}
                  </span>
                )}
              </div>
            </div>

          </div>{/* end fields wrapper */}

          {/* Tombol */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button
              onClick={() => navigate('/fasilitator/kegiatan')}
              disabled={submitting}
              style={{
                flexShrink: 0, padding: '12px 24px', borderRadius: '10px',
                background: '#f1f5f9', border: '1px solid #e2e8f0',
                color: '#64748b', fontWeight: '600', fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                flex: 1, padding: '12px 24px', borderRadius: '10px', border: 'none',
                background: submitting ? '#e2e8f0' : 'linear-gradient(135deg, #10b981, #059669)',
                color: submitting ? '#94a3b8' : 'white',
                fontWeight: '700', fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(16,185,129,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.45)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = submitting ? 'none' : '0 4px 16px rgba(16,185,129,0.35)'; }}
            >
              {submitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.35)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Simpan &amp; Buat QR
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default TambahKegiatanPage;
