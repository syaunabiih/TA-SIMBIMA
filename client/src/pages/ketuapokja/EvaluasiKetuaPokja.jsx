import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiTambahEvaluasi } from '../../utils/api';

const IconHome     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconChart    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconClipboard= () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2"/><rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU = [
  { path: '/dashboard/ketua-pokja', label: 'Dashboard', icon: <IconHome /> },
  { path: '/dashboard/ketua-pokja/monitoring', label: 'Monitoring', icon: <IconChart /> },
  { path: '/dashboard/ketua-pokja/evaluasi', label: 'Evaluasi', icon: <IconClipboard /> },
];

const BULAN_OPTIONS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

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

function EvaluasiKetuaPokja() {
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert]           = useState(null);
  const [focusedField, setFocusedField] = useState('');

  const now = new Date();
  const [form, setForm] = useState({
    id_fasilitator: '',
    id_gedung: '',
    catatan_evaluasi: '',
    tindak_lanjut: '',
    bulan_periode: now.getMonth() + 1,
    tahun_periode: now.getFullYear(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      id_fasilitator: Number(form.id_fasilitator),
      id_gedung: Number(form.id_gedung),
      bulan_periode: Number(form.bulan_periode),
      tahun_periode: Number(form.tahun_periode),
    };
    const res = await apiTambahEvaluasi(payload);
    setSubmitting(false);
    if (res.status === 'Sukses') {
      setAlert({ type: 'success', msg: 'Evaluasi berhasil dikirim ke Fasilitator!' });
      setForm({ ...form, catatan_evaluasi: '', tindak_lanjut: '' });
    } else {
      setAlert({ type: 'error', msg: res.message || 'Gagal mengirim evaluasi.' });
    }
    setTimeout(() => setAlert(null), 5000);
  };

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '32px' }}>

        {/* Header */}
        <div className="section-animate" style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Evaluasi Pembinaan</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Kirim catatan evaluasi ke fasilitator asrama.</p>
        </div>

        {/* Alert */}
        {alert && (
          <div className="alert-modern" style={{
            marginBottom: '20px',
            background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: alert.type === 'success' ? '#047857' : '#dc2626',
          }}>
            <span>{alert.type === 'success' ? '✓' : '⚠'}</span> {alert.msg}
          </div>
        )}

        {/* Form Evaluasi */}
        <div className="stat-card card-animate card-animate-1" style={{ padding: '28px', maxWidth: '680px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Form Evaluasi</h2>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#94a3b8' }}>Lengkapi data evaluasi periode pembinaan.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Row: ID Fasilitator + ID Gedung */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>ID Fasilitator</label>
                <input type="number" value={form.id_fasilitator}
                  onChange={e => setForm({ ...form, id_fasilitator: e.target.value })}
                  onFocus={() => setFocusedField('fas')} onBlur={() => setFocusedField('')}
                  placeholder="1"
                  style={inputStyle(focusedField === 'fas')} required />
              </div>
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>ID Gedung</label>
                <input type="number" value={form.id_gedung}
                  onChange={e => setForm({ ...form, id_gedung: e.target.value })}
                  onFocus={() => setFocusedField('ged')} onBlur={() => setFocusedField('')}
                  placeholder="1"
                  style={inputStyle(focusedField === 'ged')} required />
              </div>
            </div>

            {/* Row: Bulan + Tahun */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Bulan Periode</label>
                <select value={form.bulan_periode}
                  onChange={e => setForm({ ...form, bulan_periode: e.target.value })}
                  onFocus={() => setFocusedField('bln')} onBlur={() => setFocusedField('')}
                  style={{ ...inputStyle(focusedField === 'bln'), cursor: 'pointer' }}
                >
                  {BULAN_OPTIONS.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Tahun Periode</label>
                <input type="number" value={form.tahun_periode}
                  onChange={e => setForm({ ...form, tahun_periode: e.target.value })}
                  onFocus={() => setFocusedField('thn')} onBlur={() => setFocusedField('')}
                  style={inputStyle(focusedField === 'thn')} required />
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Catatan Evaluasi</label>
              <textarea value={form.catatan_evaluasi}
                onChange={e => setForm({ ...form, catatan_evaluasi: e.target.value })}
                onFocus={() => setFocusedField('cat')} onBlur={() => setFocusedField('')}
                placeholder="Tuliskan hasil evaluasi pembinaan untuk periode ini..."
                rows={4}
                style={{ ...inputStyle(focusedField === 'cat'), resize: 'vertical' }} required />
            </div>

            {/* Tindak Lanjut */}
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Tindak Lanjut (opsional)</label>
              <textarea value={form.tindak_lanjut}
                onChange={e => setForm({ ...form, tindak_lanjut: e.target.value })}
                onFocus={() => setFocusedField('tindak')} onBlur={() => setFocusedField('')}
                placeholder="Saran atau tindakan yang perlu dilakukan..."
                rows={3}
                style={{ ...inputStyle(focusedField === 'tindak'), resize: 'vertical' }} />
            </div>

            <button type="submit" disabled={submitting} className="btn-cta" style={{
              marginTop: '4px', padding: '13px', justifyContent: 'center', fontSize: '15px',
              borderRadius: '10px', opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? 'Mengirim...' : '📤 Kirim Evaluasi'}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="info-card card-animate" style={{ marginTop: '20px', animationDelay: '0.2s', maxWidth: '680px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '600', color: '#047857' }}>💡 Tips Evaluasi</h3>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>
            <li>Evaluasi mencakup kinerja fasilitator dalam mengelola kegiatan pembinaan</li>
            <li>Catatan evaluasi bersifat resmi dan akan diterima oleh fasilitator terkait</li>
            <li>Isi <strong style={{ color: '#1e293b' }}>tindak lanjut</strong> jika diperlukan perbaikan</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default EvaluasiKetuaPokja;
