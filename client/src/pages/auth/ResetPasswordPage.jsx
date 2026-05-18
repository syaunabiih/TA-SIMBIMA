import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiResetPassword } from '../../utils/api';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'error' | 'success', text: string }

  useEffect(() => {
     if (!token) {
        setStatus({ type: 'error', text: 'Token tidak ditemukan di URL. Link tidak valid.' });
     }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (passwordBaru !== konfirmasi) {
       return setStatus({ type: 'error', text: 'Konfirmasi password tidak cocok!' });
    }
    if (passwordBaru.length < 8) {
       return setStatus({ type: 'error', text: 'Password min. 8 karakter!' });
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await apiResetPassword({ token, password_baru: passwordBaru });
      if (res.status === 'Sukses') {
         setStatus({ type: 'success', text: res.message });
      } else {
         setStatus({ type: 'error', text: res.message });
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
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 2l-2 2m-7.61 7.61v0a5.503 5.503 0 0 0-7.78 7.78 5.5 5.5 0 0 0 7.78-7.78v0l8-8v-3h-3l-2.39 2.39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Buat Sandi Baru</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
            Pastikan sandi baru Anda kuat dan belum pernah digunakan sebelumnya.
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
              <button onClick={() => navigate('/')} className="btn-cta" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 'bold' }}>
                Masuk Sekarang
              </button>
           </div>
        ) : (
           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Password Baru</label>
                <input 
                  type="password" 
                  required disabled={!token}
                  value={passwordBaru} onChange={e => setPasswordBaru(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Konfirmasi Password Baru</label>
                <input 
                  type="password" 
                  required disabled={!token}
                  value={konfirmasi} onChange={e => setKonfirmasi(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <button className="btn-cta" type="submit" disabled={loading || !token} style={{ padding: '12px', borderRadius: '12px', fontWeight: '600', fontSize: '15px' }}>
                {loading ? 'Menyimpan...' : 'Atur Ulang Sandi'}
              </button>
           </form>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
