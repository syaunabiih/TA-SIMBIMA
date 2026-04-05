import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetKegiatan, apiBuatKegiatan } from '../../utils/api';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/dashboard/fasilitator', label: 'Dashboard', icon: <IconHome /> },
  { path: '/dashboard/fasilitator/kegiatan', label: 'Kelola Kegiatan', icon: <IconCalendar /> },
  { path: '/dashboard/fasilitator/izin', label: 'Validasi Izin', icon: <IconFile /> },
];

const JENIS_KEGIATAN = ['SHALAT_SUBUH','APEL_MALAM','KAJIAN','SENAM','GOTONG_ROYONG','LAINNYA'];

function BadgeStatus({ status }) {
  const map = {
    TERJADWAL:   { label: 'Terjadwal',   bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
    BERLANGSUNG: { label: 'Berlangsung', bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    SELESAI:     { label: 'Selesai',     bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
    DIBATALKAN:  { label: 'Dibatalkan',  bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
  };
  const s = map[status] || { label: status, bg: 'rgba(255,255,255,0.1)', color: 'white' };
  return <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>{s.label}</span>;
}

function inputStyle(focused) {
  return {
    width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
    background: 'rgba(255,255,255,0.06)', border: `1px solid ${focused ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
    color: 'white', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
}

function DashboardFasilitator() {
  const [kegiatan, setKegiatan]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert]           = useState(null);
  const [focusedField, setFocusedField] = useState('');

  const [form, setForm] = useState({
    nama_kegiatan: '', tanggal_kegiatan: '', waktu_mulai: '',
    waktu_selesai: '', lokasi: '', jenis_kegiatan: 'SHALAT_SUBUH',
  });

  const nama = localStorage.getItem('simbima_nama') || 'Fasilitator';

  const fetchKegiatan = () => {
    setLoading(true);
    apiGetKegiatan()
      .then(res => { if (res.data) setKegiatan(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKegiatan(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiBuatKegiatan(form);
    setSubmitting(false);
    if (res.status === 'Sukses') {
      setAlert({ type: 'success', msg: 'Kegiatan berhasil dibuat!' });
      setShowModal(false);
      setForm({ nama_kegiatan: '', tanggal_kegiatan: '', waktu_mulai: '', waktu_selesai: '', lokasi: '', jenis_kegiatan: 'SHALAT_SUBUH' });
      fetchKegiatan();
    } else {
      setAlert({ type: 'error', msg: res.message || 'Gagal membuat kegiatan.' });
    }
    setTimeout(() => setAlert(null), 4000);
  };

  const kegiatanTerjadwal = kegiatan.filter(k => k.status_kegiatan === 'TERJADWAL').length;
  const kegiatanSelesai   = kegiatan.filter(k => k.status_kegiatan === 'SELESAI').length;

  return (
    <DashboardLayout menuItems={MENU}>
      <div style={{ padding: '32px', color: 'white' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Dashboard Fasilitator</h1>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
              Halo, <strong style={{ color: '#10b981' }}>{nama}</strong>. Kelola kegiatan pembinaan di sini.
            </p>
          </div>
          <button onClick={() => setShowModal(true)} style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', borderRadius: '10px', padding: '10px 20px',
            color: 'white', fontWeight: '600', fontSize: '14px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          }}>
            <span>+</span> Buat Kegiatan
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
            background: alert.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${alert.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
            color: alert.type === 'success' ? '#34d399' : '#f87171', fontSize: '14px',
          }}>{alert.msg}</div>
        )}

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Kegiatan', value: kegiatan.length, color: '#10b981' },
            { label: 'Terjadwal', value: kegiatanTerjadwal, color: '#60a5fa' },
            { label: 'Selesai', value: kegiatanSelesai, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px 24px' }}>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: '28px', fontWeight: '700', letterSpacing: '-1px' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabel Kegiatan */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Daftar Kegiatan</h2>
          </div>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Memuat data...</div>
          ) : kegiatan.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px' }}>Belum ada kegiatan. Klik "Buat Kegiatan" untuk mulai.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Nama Kegiatan', 'Tanggal', 'Waktu', 'Jenis', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kegiatan.map(k => (
                    <tr key={k.id_kegiatan} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', color: 'white', fontWeight: '500' }}>{k.nama_kegiatan}</td>
                      <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(k.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(k.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.6)' }}>{k.jenis_kegiatan.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '14px 20px' }}><BadgeStatus status={k.status_kegiatan} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL BUAT KEGIATAN ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            background: '#111827', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>Buat Kegiatan Baru</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'nama_kegiatan', label: 'Nama Kegiatan', type: 'text', placeholder: 'Contoh: Apel Malam Senin' },
                { key: 'tanggal_kegiatan', label: 'Tanggal', type: 'date' },
                { key: 'waktu_mulai', label: 'Waktu Mulai', type: 'time' },
                { key: 'waktu_selesai', label: 'Waktu Selesai', type: 'time' },
                { key: 'lokasi', label: 'Lokasi', type: 'text', placeholder: 'Contoh: Lapangan Utama' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '6px' }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder || ''}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    onFocus={() => setFocusedField(f.key)}
                    onBlur={() => setFocusedField('')}
                    style={inputStyle(focusedField === f.key)}
                    required
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '6px' }}>Jenis Kegiatan</label>
                <select
                  value={form.jenis_kegiatan}
                  onChange={e => setForm({ ...form, jenis_kegiatan: e.target.value })}
                  onFocus={() => setFocusedField('jenis')}
                  onBlur={() => setFocusedField('')}
                  style={{ ...inputStyle(focusedField === 'jenis'), cursor: 'pointer' }}
                >
                  {JENIS_KEGIATAN.map(j => <option key={j} value={j} style={{ background: '#1f2937' }}>{j.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting} style={{
                marginTop: '8px', padding: '12px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontWeight: '600', fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? 'Menyimpan...' : 'Simpan Kegiatan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default DashboardFasilitator;
