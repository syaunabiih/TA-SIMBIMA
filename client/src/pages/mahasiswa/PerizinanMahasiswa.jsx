import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetIzin, apiAjukanIzin } from '../../utils/api';

const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/dashboard/mahasiswa', label: 'Dashboard', icon: <IconHome /> },
  { path: '/dashboard/mahasiswa/kegiatan', label: 'Kegiatan', icon: <IconCalendar /> },
  { path: '/dashboard/mahasiswa/izin', label: 'Perizinan', icon: <IconFile /> },
];

function BadgeIzin({ status }) {
  const map = {
    MENUNGGU:   { label: 'Menunggu',   bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    DISETUJUI:  { label: 'Disetujui',  bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    DITOLAK:    { label: 'Ditolak',    bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    DIBATALKAN: { label: 'Dibatalkan', bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
    SELESAI:    { label: 'Selesai',    bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
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

const formatTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function PerizinanMahasiswa() {
  const [izinList, setIzinList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [focusedField, setFocusedField] = useState('');

  const [form, setForm] = useState({
    jenis_izin: 'PULANG_KAMPUNG',
    tanggal_mulai: '',
    tanggal_selesai: '',
    alasan: '',
  });

  const fetchIzin = () => {
    setLoading(true);
    apiGetIzin()
      .then(res => { if (res.data) setIzinList(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchIzin(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiAjukanIzin(form);
    setSubmitting(false);
    if (res.status === 'Sukses') {
      setAlert({ type: 'success', msg: 'Pengajuan izin berhasil dikirim!' });
      setShowForm(false);
      setForm({ jenis_izin: 'PULANG_KAMPUNG', tanggal_mulai: '', tanggal_selesai: '', alasan: '' });
      fetchIzin();
    } else {
      setAlert({ type: 'error', msg: res.message || 'Gagal mengajukan izin.' });
    }
    setTimeout(() => setAlert(null), 4000);
  };

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '32px' }}>

        {/* Header */}
        <div className="section-animate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Perizinan</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Ajukan izin pulang kampung atau kegiatan luar.</p>
          </div>
          <button className="btn-cta" onClick={() => setShowForm(!showForm)}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{showForm ? '✕' : '+'}</span>
            {showForm ? 'Tutup Form' : 'Ajukan Izin'}
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

        {/* Form Pengajuan */}
        {showForm && (
          <div className="stat-card card-animate card-animate-1" style={{ marginBottom: '24px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Form Pengajuan Izin</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Jenis Izin</label>
                <select value={form.jenis_izin} onChange={e => setForm({ ...form, jenis_izin: e.target.value })}
                  onFocus={() => setFocusedField('jenis')} onBlur={() => setFocusedField('')}
                  style={{ ...inputStyle(focusedField === 'jenis'), cursor: 'pointer' }}>
                  <option value="PULANG_KAMPUNG">Pulang Kampung</option>
                  <option value="KEGIATAN_LUAR">Kegiatan Luar</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Tanggal Mulai</label>
                <input type="date" value={form.tanggal_mulai} onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })}
                  onFocus={() => setFocusedField('tgl1')} onBlur={() => setFocusedField('')}
                  style={inputStyle(focusedField === 'tgl1')} required />
              </div>
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Tanggal Selesai</label>
                <input type="date" value={form.tanggal_selesai} onChange={e => setForm({ ...form, tanggal_selesai: e.target.value })}
                  onFocus={() => setFocusedField('tgl2')} onBlur={() => setFocusedField('')}
                  style={inputStyle(focusedField === 'tgl2')} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Alasan</label>
                <textarea value={form.alasan} onChange={e => setForm({ ...form, alasan: e.target.value })}
                  onFocus={() => setFocusedField('alasan')} onBlur={() => setFocusedField('')}
                  placeholder="Jelaskan alasan izin Anda..." rows={3}
                  style={{ ...inputStyle(focusedField === 'alasan'), resize: 'vertical' }} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" disabled={submitting} className="btn-cta" style={{
                  width: '100%', padding: '12px', justifyContent: 'center', fontSize: '15px', borderRadius: '10px',
                  opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
                }}>
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabel Riwayat */}
        <div className="table-card card-animate card-animate-2">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Riwayat Perizinan</h2>
            <span style={{ color: '#94a3b8', fontSize: '13px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>{izinList.length} pengajuan</span>
          </div>

          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: '50px', borderRadius: '8px' }} />)}
            </div>
          ) : izinList.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Belum ada riwayat perizinan</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Klik "Ajukan Izin" untuk membuat pengajuan baru.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Jenis', 'Dari', 'Sampai', 'Durasi', 'Alasan', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {izinList.map((iz, i) => (
                    <tr key={iz.id_perizinan} className="table-row row-animate" style={{ animationDelay: `${0.04 * i}s` }}>
                      <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: '500' }}>{iz.jenis_izin.replace('_', ' ')}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{formatTgl(iz.tanggal_mulai)}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{formatTgl(iz.tanggal_selesai)}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{iz.durasi_hari} hari</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iz.alasan}</td>
                      <td style={{ padding: '14px 16px' }}><BadgeIzin status={iz.status_pengajuan} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PerizinanMahasiswa;
