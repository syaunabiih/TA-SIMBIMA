import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGenerateRekap } from '../../utils/api';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconMapPin   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFileText = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/><polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/fasilitator/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { path: '/fasilitator/kegiatan', label: 'Kelola Kegiatan', icon: <IconCalendar /> },
  { path: '/fasilitator/perizinan', label: 'Validasi Izin', icon: <IconFile /> },
  { path: '/fasilitator/kepulangan', label: 'Kepulangan', icon: <IconMapPin /> },
  { path: '/fasilitator/rekap', label: 'Rekap Absensi', icon: <IconFileText /> },
];

// Style helpers
const labelStyle = { display: 'block', color: '#475569', fontSize: '14px', fontWeight: '600', marginBottom: '8px' };
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1.5px solid #e2e8f0', background: '#f8fafc',
  fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
const inputFocus = { borderColor: '#10b981', background: '#fff' };

function InputField({ label, hint, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8' }}>{hint}</p>}
    </div>
  );
}

function GenerateRekapFasilitator() {
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const [tanggalMulai,   setTanggalMulai]   = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [batasAlfa,      setBatasAlfa]      = useState('');
  const [pengumumanIqab, setPengumumanIqab] = useState('');

  const [focused,    setFocused]  = useState('');
  const [loading,    setLoading]  = useState(false);
  const [errorInline, setErrorInline] = useState('');

  // Validasi client-side
  const isValid = () => {
    if (!tanggalMulai || !tanggalSelesai) return false;
    if (new Date(tanggalSelesai) <= new Date(tanggalMulai)) return false;
    return true;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setErrorInline('');

    if (new Date(tanggalSelesai) <= new Date(tanggalMulai)) {
      setErrorInline('Tanggal selesai harus lebih besar dari tanggal mulai.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tanggal_mulai:   tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        batas_alfa:      batasAlfa ? Number(batasAlfa) : undefined,
        pengumuman_iqab: pengumumanIqab || undefined,
      };

      const res = await apiGenerateRekap(payload);
      if (res.status === 'Sukses') {
        sessionStorage.setItem('rekap_success', 'Rekap berhasil dipublikasikan dan dapat dilihat mahasiswa.');
        navigate('/fasilitator/rekap');
      } else {
        setErrorInline(res.message || 'Gagal membuat rekapitulasi.');
      }
    } catch (err) {
      console.error(err);
      setErrorInline('Terjadi gangguan sistem saat menggenerasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter page-content" style={{ maxWidth: '620px', margin: '0 auto' }}>

        {/* Navigasi Kembali */}
        <button
          onClick={() => navigate('/fasilitator/rekap')}
          style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', fontSize: '14px' }}
        >
          ← Kembali ke Daftar Rekap
        </button>

        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Generate Rekap Baru</h1>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#64748b' }}>
          Tentukan periode, batas alfa, dan pengumuman iqab untuk rekap ini.
        </p>

        <div className="table-card card-animate" style={{ padding: '28px' }}>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* Periode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <InputField label="Tanggal Mulai" hint="Inklusif hari pertama">
                <input
                  type="date"
                  required
                  max={today}
                  value={tanggalMulai}
                  onChange={e => setTanggalMulai(e.target.value)}
                  onFocus={() => setFocused('mulai')}
                  onBlur={() => setFocused('')}
                  style={{ ...inputStyle, ...(focused === 'mulai' ? inputFocus : {}) }}
                />
              </InputField>
              <InputField label="Tanggal Selesai" hint="Inklusif hari terakhir">
                <input
                  type="date"
                  required
                  max={today}
                  min={tanggalMulai || undefined}
                  value={tanggalSelesai}
                  onChange={e => setTanggalSelesai(e.target.value)}
                  onFocus={() => setFocused('selesai')}
                  onBlur={() => setFocused('')}
                  style={{
                    ...inputStyle,
                    ...(focused === 'selesai' ? inputFocus : {}),
                    ...(tanggalSelesai && tanggalMulai && new Date(tanggalSelesai) <= new Date(tanggalMulai)
                      ? { borderColor: '#ef4444', background: '#fef2f2' } : {}),
                  }}
                />
              </InputField>
            </div>

            {/* Validasi tanggal real-time */}
            {tanggalMulai && tanggalSelesai && new Date(tanggalSelesai) <= new Date(tanggalMulai) && (
              <div style={{ marginTop: '-12px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>
                Tanggal selesai harus lebih besar dari tanggal mulai.
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Konfigurasi Iqob (Opsional)
              </p>

              <InputField
                label="Batas Alfa"
                hint="Mahasiswa dengan alfa ≥ nilai ini akan mendapat status DAPAT IQAB. Kosongkan jika tidak pakai iqab."
              >
                <input
                  type="number"
                  min="1"
                  max="999"
                  placeholder="Contoh: 3"
                  value={batasAlfa}
                  onChange={e => setBatasAlfa(e.target.value)}
                  onFocus={() => setFocused('alfa')}
                  onBlur={() => setFocused('')}
                  style={{ ...inputStyle, ...(focused === 'alfa' ? inputFocus : {}) }}
                />
              </InputField>
            </div>

            <InputField
              label="Pengumuman Penebusan Iqob"
              hint="Teks ini akan tampil di halaman hasil rekap sebagai instruksi penebusan iqab."
            >
              <textarea
                rows={4}
                placeholder="Contoh: Mahasiswa yang mendapat iqab wajib melaksanakan piket lorong selama 3 hari..."
                value={pengumumanIqab}
                onChange={e => setPengumumanIqab(e.target.value)}
                onFocus={() => setFocused('pengumuman')}
                onBlur={() => setFocused('')}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  ...(focused === 'pengumuman' ? inputFocus : {}),
                }}
              />
            </InputField>

            {/* Error */}
            {errorInline && (
              <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>
                ⚠ {errorInline}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isValid()}
              style={{
                width: '100%', padding: '14px',
                background: loading || !isValid()
                  ? '#cbd5e1'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', border: 'none', borderRadius: '12px',
                fontWeight: '700', fontSize: '15px', cursor: loading || !isValid() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'all 0.2s ease',
                boxShadow: loading || !isValid() ? 'none' : '0 4px 16px rgba(16,185,129,0.35)',
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Mengalkulasi...
                </>
              ) : 'Generate Rekap Absensi'}
            </button>

          </form>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default GenerateRekapFasilitator;
