import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLupaPassword } from '../../utils/api';

function LupaPasswordPage() {
  const navigate = useNavigate();
  const [kontak, setKontak] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await apiLupaPassword({ kontak });
      if (res.status === 'Sukses') {
         setStatus({ type: 'success', text: res.message, token: res.debug_token });
      } else {
         setStatus({ type: 'error', text: res.message || 'Terjadi kesalahan sistem.' });
      }
    } catch(err) {
      setStatus({ type: 'error', text: 'Gagal terhubung ke server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
      <div className="card-animate page-enter" style={{ background: '#fff', width: '100%', maxWidth: '440px', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', background: '#ecfdf5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Lupa Password?</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
            Jangan khawatir, masukkan email yang terdaftar di akun Anda untuk memulihkan akses.
          </p>
        </div>

        {status && status.type === 'error' && (
           <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', fontWeight: '500', border: '1px solid #fecaca' }}>
             {status.text}
           </div>
        )}

        {status && status.type === 'success' ? (
           <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', border: '1px solid #a7f3d0' }}>
                {status.text}
              </div>
              <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', marginBottom: '24px', wordBreak: 'break-all', fontSize: '12px', fontFamily: 'monospace', color: '#334155' }}>
                <strong>TOKEN SIMULASI:</strong><br/>{status.token}
              </div>
              <button onClick={() => navigate(`/reset-password?token=${status.token}`)} className="btn-cta" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 'bold' }}>
                Simulasi Lanjut ke URL Email
              </button>
           </div>
        ) : (
           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Alamat Email</label>
                <input 
                  type="email" 
                  required
                  value={kontak}
                  onChange={e => setKontak(e.target.value)}
                  placeholder="Bagus@mahasiswa.ac.id"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', transition: 'all 0.2s', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <button className="btn-cta" type="submit" disabled={loading} style={{ padding: '12px', borderRadius: '12px', fontWeight: '600', fontSize: '15px' }}>
                {loading ? 'Memproses...' : 'Kirim Link Reset'}
              </button>
              
              <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>
                 ← Kembali ke Login
              </button>
           </form>
        )}
      </div>
    </div>
  );
}

export default LupaPasswordPage;
