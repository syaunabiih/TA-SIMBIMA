import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetKegiatan, apiBuatKegiatan } from '../../utils/api';
import { useCountUp } from '../../hooks/useCountUp';

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
    TERJADWAL:   { label: 'Terjadwal',   bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    BERLANGSUNG: { label: 'Berlangsung', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    SELESAI:     { label: 'Selesai',     bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    DIBATALKAN:  { label: 'Dibatalkan',  bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${s.border}` }}>{s.label}</span>;
}

function inputStyle(focused) {
  return {
    width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
    background: focused ? '#ffffff' : '#f8fafc',
    border: `1.5px solid ${focused ? '#10b981' : '#e2e8f0'}`,
    color: '#1e293b', outline: 'none', boxSizing: 'border-box',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: focused ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
  };
}

function KelolaKegiatanFasilitator() {
  const [kegiatan, setKegiatan]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert]         = useState(null);
  const [focusedField, setFocusedField] = useState('');
  const [filter, setFilter]       = useState('SEMUA');

  const [form, setForm] = useState({
    nama_kegiatan: '', tanggal_kegiatan: '', waktu_mulai: '',
    waktu_selesai: '', lokasi: '', jenis_kegiatan: 'SHALAT_SUBUH',
  });

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

  const FILTERS = ['SEMUA', 'TERJADWAL', 'BERLANGSUNG', 'SELESAI', 'DIBATALKAN'];
  const filtered = filter === 'SEMUA' ? kegiatan : kegiatan.filter(k => k.status_kegiatan === filter);

  const total = kegiatan.length;
  const terjadwal = kegiatan.filter(k => k.status_kegiatan === 'TERJADWAL').length;
  const selesai = kegiatan.filter(k => k.status_kegiatan === 'SELESAI').length;
  const animatedTotal = useCountUp(total);
  const animatedTerjadwal = useCountUp(terjadwal);
  const animatedSelesai = useCountUp(selesai);

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '32px' }}>

        {/* Header */}
        <div className="section-animate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Kelola Kegiatan</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Buat, pantau, dan kelola semua kegiatan pembinaan.</p>
          </div>
          <button className="btn-cta" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Buat Kegiatan
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div className="alert-modern" style={{
            marginBottom: '16px',
            background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: alert.type === 'success' ? '#047857' : '#dc2626',
          }}>
            <span>{alert.type === 'success' ? '✓' : '⚠'}</span> {alert.msg}
          </div>
        )}

        {/* Mini Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total', value: animatedTotal, color: '#10b981' },
            { label: 'Terjadwal', value: animatedTerjadwal, color: '#2563eb' },
            { label: 'Selesai', value: animatedSelesai, color: '#7c3aed' },
          ].map((s, i) => (
            <div key={s.label} className={`stat-card card-animate card-animate-${i+1}`} style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '20px', border: '1px solid',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: filter === f ? '#10b981' : '#ffffff',
              color: filter === f ? '#ffffff' : '#64748b',
              borderColor: filter === f ? '#10b981' : '#e2e8f0',
            }}>{f === 'SEMUA' ? 'Semua' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
          ))}
        </div>

        {/* Tabel */}
        <div className="table-card card-animate card-animate-4">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Daftar Kegiatan</h2>
            <span style={{ color: '#94a3b8', fontSize: '12px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>{filtered.length} data</span>
          </div>
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: '48px', borderRadius: '8px' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Tidak ada kegiatan</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Nama Kegiatan', 'Tanggal', 'Waktu', 'Jenis', 'Lokasi', 'Petugas', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((k, i) => (
                    <tr key={k.id_kegiatan} className="table-row row-animate" style={{ animationDelay: `${0.04 * i}s` }}>
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '13px' }}>{i + 1}</td>
                      <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: '500' }}>{k.nama_kegiatan}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(k.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} – {new Date(k.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{k.jenis_kegiatan.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{k.lokasi}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                        {k.petugas?.length > 0 ? k.petugas.map(p => p.mahasiswa?.nama).join(', ') : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Belum ada</span>}
                      </td>
                      <td style={{ padding: '12px 14px' }}><BadgeStatus status={k.status_kegiatan} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(4px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px',
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{
            background: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Buat Kegiatan Baru</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Isi detail kegiatan di bawah ini</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{
                background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer',
                fontSize: '16px', padding: '6px 10px', borderRadius: '8px', transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'nama_kegiatan', label: 'Nama', type: 'text', placeholder: 'Apel Malam Senin' },
                { key: 'tanggal_kegiatan', label: 'Tanggal', type: 'date' },
                { key: 'waktu_mulai', label: 'Waktu Mulai', type: 'time' },
                { key: 'waktu_selesai', label: 'Waktu Selesai', type: 'time' },
                { key: 'lokasi', label: 'Lokasi', type: 'text', placeholder: 'Lapangan Utama' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '5px' }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder || ''} value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    onFocus={() => setFocusedField(f.key)} onBlur={() => setFocusedField('')}
                    style={inputStyle(focusedField === f.key)} required />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '5px' }}>Jenis</label>
                <select value={form.jenis_kegiatan} onChange={e => setForm({ ...form, jenis_kegiatan: e.target.value })}
                  style={{ ...inputStyle(false), cursor: 'pointer' }}>
                  {JENIS_KEGIATAN.map(j => <option key={j} value={j}>{j.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting} className="btn-cta" style={{
                marginTop: '6px', padding: '12px', width: '100%', justifyContent: 'center', fontSize: '15px', borderRadius: '10px',
                opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
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

export default KelolaKegiatanFasilitator;
