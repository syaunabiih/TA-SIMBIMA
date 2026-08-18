import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FASILITATOR_MENU } from './fasilitatorMenu';
import { apiBuatKegiatan, apiGetJenisKegiatan } from '../../utils/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const API = import.meta.env.VITE_API_URL || '';
const token = () => localStorage.getItem('simbima_token');





function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function TambahKegiatanPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState('');
  const [loadingJenis, setLoadingJenis] = useState(true);
  const [errorJenis, setErrorJenis] = useState('');
  const [form, setForm] = useState({
    nama_kegiatan: '',
    lokasi: '',
    qr_durasi_menit: 30,
    id_jenis_kegiatan: '',
    useGeofence: true,
    latitude: '',
    longitude: '',
    radius_meter: 50,
  });
  const [jenisList, setJenisList] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Derived: jenis kegiatan yang sedang dipilih
  const selectedKegiatan = jenisList.find(j => j.id_jenis_kegiatan == form.id_jenis_kegiatan);
  const isLokasiRequired = !selectedKegiatan?.is_wajib;

  useEffect(() => {
    setLoadingJenis(true);
    setErrorJenis('');
    apiGetJenisKegiatan()
      .then(data => {
        if (data.status === 'Sukses' && Array.isArray(data.data)) {
          setJenisList(data.data);
          if (data.data.length > 0) {
            const first = data.data[0];
            setForm(prev => ({
              ...prev,
              id_jenis_kegiatan: first.id_jenis_kegiatan,
              nama_kegiatan: first.is_wajib ? first.nama_jenis : prev.nama_kegiatan,
            }));
          } else {
            setErrorJenis('Belum ada jenis kegiatan. Hubungi Ketua Pokja untuk menambahkannya.');
          }
        } else {
          setErrorJenis(data.message || 'Gagal memuat jenis kegiatan.');
        }
      })
      .catch(() => setErrorJenis('Gagal terhubung ke server. Coba muat ulang halaman.'))
      .finally(() => setLoadingJenis(false));
  }, []);

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
    // Kegiatan wajib: nama otomatis diambil dari nama jenis
    if (!selectedKegiatan?.is_wajib && !form.nama_kegiatan.trim()) {
      setError('Nama kegiatan wajib diisi.');
      return;
    }
    if (isLokasiRequired && !form.lokasi.trim()) {
      setError('Lokasi wajib diisi untuk jenis kegiatan ini.');
      return;
    }
    const menit = Number(form.qr_durasi_menit);
    if (!menit || menit < 1 || menit > 480) {
      setError('Durasi QR harus antara 1 – 480 menit.');
      return;
    }

    if (!form.latitude || !form.longitude) {
      setError('Latitude dan Longitude wajib diisi (Gunakan tombol Lokasi Saat Ini).');
      return;
    }
    if (!form.radius_meter || form.radius_meter < 10) {
      setError('Radius minimal 10 meter.');
      return;
    }

    setError('');
    setSubmitting(true);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const waktu = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const payload = {
      ...form,
      // Untuk kegiatan wajib, nama_kegiatan diambil dari nama jenis
      nama_kegiatan: selectedKegiatan?.is_wajib ? selectedKegiatan.nama_jenis : form.nama_kegiatan,
      tanggal_kegiatan: today,
      waktu_mulai: waktu,
      waktu_selesai: waktu,
      qr_durasi_menit: Number(form.qr_durasi_menit),
      id_jenis_kegiatan: form.id_jenis_kegiatan,
      // Geofencing data
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius_meter: Number(form.radius_meter),
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

  const handleGetLocation = () => {
    setGettingLocation(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung Geolocation.');
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(8),
          longitude: pos.coords.longitude.toFixed(8)
        }));
        setGettingLocation(false);
      },
      (err) => {
        let msg = 'Gagal mendapatkan lokasi.';
        if (err.code === 1) msg = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di browser.';
        setError(msg);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <DashboardLayout menuItems={FASILITATOR_MENU}>
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
              <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2" />
              <rect x="13" y="13" width="4" height="4" rx="1" fill="white" />
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
          <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '14px' }}>Isi nama kegiatan dan lokasi untuk memulai.</p>

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

            {/* Jenis Kegiatan */}
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Jenis Kegiatan <span style={{ color: '#ef4444' }}>*</span>
              </label>

              {loadingJenis ? (
                <div style={{
                  ...inputStyle('jenis'),
                  display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <circle cx="12" cy="12" r="10" stroke="#cbd5e1" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Memuat jenis kegiatan...
                </div>
              ) : errorJenis ? (
                <div>
                  <div style={{
                    padding: '10px 14px', background: '#fef2f2', border: '1.5px solid #fecaca',
                    borderRadius: '10px', color: '#dc2626', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    ⚠ {errorJenis}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoadingJenis(true);
                      setErrorJenis('');
                      apiGetJenisKegiatan()
                        .then(data => {
                          if (data.status === 'Sukses' && Array.isArray(data.data)) {
                            setJenisList(data.data);
                            if (data.data.length > 0) {
                              const first = data.data[0];
                              setForm(prev => ({
                                ...prev,
                                id_jenis_kegiatan: first.id_jenis_kegiatan,
                                nama_kegiatan: first.is_wajib ? first.nama_jenis : prev.nama_kegiatan,
                              }));
                            } else {
                              setErrorJenis('Belum ada jenis kegiatan. Hubungi Ketua Pokja untuk menambahkannya.');
                            }
                          } else {
                            setErrorJenis(data.message || 'Gagal memuat jenis kegiatan.');
                          }
                        })
                        .catch(() => setErrorJenis('Gagal terhubung ke server. Coba muat ulang halaman.'))
                        .finally(() => setLoadingJenis(false));
                    }}
                    style={{
                      marginTop: '8px', padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                      background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569',
                      cursor: 'pointer', fontWeight: '500',
                    }}
                  >
                    🔄 Coba lagi
                  </button>
                </div>
              ) : (
                <>
                  <select
                    value={form.id_jenis_kegiatan}
                    onChange={e => {
                      const val = e.target.value;
                      const selectedJenis = jenisList.find(j => j.id_jenis_kegiatan == val);
                      setForm({
                        ...form,
                        id_jenis_kegiatan: val,
                        nama_kegiatan: selectedJenis?.is_wajib ? selectedJenis.nama_jenis : ''
                      });
                    }}
                    style={{ ...inputStyle('jenis'), cursor: 'pointer' }}
                    onFocus={() => setFocused('jenis')}
                    onBlur={() => setFocused('')}
                  >
                    {jenisList.map(j => (
                      <option key={j.id_jenis_kegiatan} value={j.id_jenis_kegiatan}>
                        {j.nama_jenis} {j.is_wajib ? '🔴' : ''}
                      </option>
                    ))}
                  </select>
                  {jenisList.find(j => j.id_jenis_kegiatan == form.id_jenis_kegiatan)?.is_wajib && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '12px', border: '1px solid #fecaca' }}>🔴 Kegiatan Wajib</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>berlaku untuk semua gedung</span>
                    </div>
                  )}
                </>
              )}
            </div>


            {/* Nama Kegiatan */}
            {!jenisList.find(j => j.id_jenis_kegiatan == form.id_jenis_kegiatan)?.is_wajib && (
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Nama Kegiatan
                </label>
                <input
                  type="text"
                  value={form.nama_kegiatan}
                  onChange={e => setForm({ ...form, nama_kegiatan: e.target.value })}
                  placeholder="Contoh: Diskusi Kelompok"
                  style={inputStyle('nama')}
                  onFocus={() => setFocused('nama')}
                  onBlur={() => setFocused('')}
                />
              </div>
            )}

            {/* Lokasi */}
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Lokasi {isLokasiRequired && <span style={{ color: '#ef4444' }}>*</span>}
                {!isLokasiRequired && <span style={{ marginLeft: '6px', color: '#059669', fontWeight: '400', fontSize: '11px' }}>(opsional)</span>}
              </label>
              <input
                type="text"
                placeholder={isLokasiRequired ? 'Masukkan lokasi kegiatan' : 'Opsional untuk kegiatan wajib'}
                value={form.lokasi}
                onChange={e => setForm({ ...form, lokasi: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                onFocus={() => setFocused('lokasi')}
                onBlur={() => setFocused('')}
                style={inputStyle('lokasi')}
              />
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
                      color: form.qr_durasi_menit === mnt ? 'white' : '#64748b',
                      borderColor: form.qr_durasi_menit === mnt ? '#10b981' : '#e2e8f0',
                      boxShadow: form.qr_durasi_menit === mnt ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
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

            {/* Geofencing */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#1e293b', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                  Lokasi Presensi (Geofencing) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13px' }}>
                  Pilih titik lokasi kegiatan. Mahasiswa hanya bisa absen jika berada dalam radius dari titik ini.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: '8px', background: '#f8fafc', color: '#3b82f6',
                      border: '1px solid #bfdbfe', fontSize: '13px', fontWeight: '600', cursor: gettingLocation ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      opacity: gettingLocation ? 0.7 : 1, transition: 'all 0.2s'
                    }}
                  >
                    {gettingLocation ? 'Mengambil koordinat...' : 'Gunakan Lokasi Perangkat Saat Ini'}
                  </button>
                </div>

                <div style={{
                  height: '250px', width: '100%', borderRadius: '12px', overflow: 'hidden',
                  border: '1px solid #e2e8f0', marginBottom: '16px', zIndex: 0
                }}>
                  <MapContainer
                    center={form.latitude && form.longitude ? [Number(form.latitude), Number(form.longitude)] : [-0.9145, 100.4607]}
                    zoom={15}
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
                      url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    />
                    <LocationPicker
                      position={form.latitude && form.longitude ? { lat: Number(form.latitude), lng: Number(form.longitude) } : null}
                      setPosition={(pos) => setForm({ ...form, latitude: pos.lat.toFixed(8), longitude: pos.lng.toFixed(8) })}
                    />
                  </MapContainer>
                </div>
                <p style={{ margin: '-10px 0 16px', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                  Atau klik/tap pada peta di atas untuk memilih lokasi secara manual.
                </p>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', color: '#475569', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={e => setForm({ ...form, latitude: e.target.value })}
                      placeholder="-0.9145"
                      style={inputStyle('lat')}
                      onFocus={() => setFocused('lat')}
                      onBlur={() => setFocused('')}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', color: '#475569', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={e => setForm({ ...form, longitude: e.target.value })}
                      placeholder="100.4607"
                      style={inputStyle('lng')}
                      onFocus={() => setFocused('lng')}
                      onBlur={() => setFocused('')}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#475569', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                    Radius Validasi (meter)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={form.radius_meter}
                    onChange={e => setForm({ ...form, radius_meter: e.target.value })}
                    style={{ ...inputStyle('radius'), maxWidth: '120px' }}
                    onFocus={() => setFocused('radius')}
                    onBlur={() => setFocused('')}
                  />
                </div>
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
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
