import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLupaPassword } from '../../utils/api';

function LupaPasswordPage() {
  const navigate = useNavigate();
  const [kontak, setKontak] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | { type: 'success' | 'error', text: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await apiLupaPassword({ kontak });
      if (res.status === 'Sukses') {
        setStatus({ type: 'success', text: res.message });
      } else {
        setStatus({ type: 'error', text: res.message || 'Terjadi kesalahan sistem.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Gagal terhubung ke server.' });
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS STATE ─────────────────────────────────────────
  if (status && status.type === 'success') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <div className="card-animate page-enter" style={{ background: '#fff', width: '100%', maxWidth: '440px', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#fff', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Email Terkirim!</h2>
          <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px', lineHeight: '1.7' }}>
            Jika email <strong style={{ color: '#1e293b' }}>{kontak}</strong> terdaftar di sistem,
            kami telah mengirimkan link reset password ke inbox Anda.
          </p>
          <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px', marginBottom: '28px', textAlign: 'left' }}>
            <p style={{ margin: 0, color: '#92400e', fontSize: '13px', lineHeight: '1.7' }}>
              <strong>Link berlaku 1 jam.</strong>
              Pastikan membuka link di <strong>komputer yang sama</strong> saat Anda mengakses SIMBIMA.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ background: 'none', border: '1.5px solid #e2e8f0', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: '11px 24px', borderRadius: '12px', width: '100%', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor = '#10b981'; e.target.style.color = '#10b981'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#475569'; }}
          >
            ← Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  // ── FORM STATE (default + saat error) ────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
      <div className="card-animate page-enter" style={{ background: '#fff', width: '100%', maxWidth: '440px', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', background: '#ecfdf5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Lupa Password?</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
            Masukkan email yang terdaftar. Kami akan mengirimkan link untuk membuat password baru.
          </p>
        </div>

        {/* Error Alert — form tetap tampil di bawahnya */}
        {status && status.type === 'error' && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', fontWeight: '500', border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
            <span>{status.text}</span>
          </div>
        )}

        {/* Form — selalu muncul (default & saat error) */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={kontak}
              onChange={e => setKontak(e.target.value)}
              placeholder="contoh@mahasiswa.ac.id"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', transition: 'all 0.2s', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <button
            className="btn-cta"
            type="submit"
            disabled={loading}
            style={{ padding: '12px', borderRadius: '12px', fontWeight: '600', fontSize: '15px' }}
          >
            {loading ? 'Mengirim Email...' : 'Kirim Link Reset'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}
          >
            ← Kembali ke Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LupaPasswordPage;
