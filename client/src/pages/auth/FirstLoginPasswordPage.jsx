import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FirstLoginPasswordPage() {
  const navigate = useNavigate();
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const token = localStorage.getItem('temp_token');

  if (!token) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordBaru !== konfirmasiPassword) {
      setAlert({ show: true, message: 'Konfirmasi password tidak cocok.', type: 'error' });
      return;
    }
    if (passwordBaru.length < 6) {
      setAlert({ show: true, message: 'Password minimal 6 karakter.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/first-login/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ passwordBaru })
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ show: true, message: 'Password berhasil diubah. Silakan login kembali.', type: 'success' });
        localStorage.removeItem('temp_token');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setAlert({ show: true, message: data.message || 'Gagal mengubah password.', type: 'error' });
      }
    } catch {
      setAlert({ show: true, message: 'Gagal terhubung ke server.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg flex items-center justify-center min-h-screen p-4">
      <div className="grid-pattern" />
      <div className="orb orb-1" />
      <div className="glass-card rounded-3xl p-8 w-full max-w-md relative z-10 fade-in-up">
        <div className="text-center mb-8">
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Ganti Password Awal</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>Demi keamanan, harap ganti password default Anda.</p>
        </div>

        {alert.show && (
          <div className={`alert-modern ${alert.type === 'success' ? 'alert-success-modern' : 'alert-error-modern'} mb-5`}>
            <span style={{ fontSize: '14px' }}>{alert.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Password Baru</label>
            <input
              type="password"
              className="modern-input"
              value={passwordBaru}
              onChange={e => setPasswordBaru(e.target.value)}
              required
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#475569', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Konfirmasi Password Baru</label>
            <input
              type="password"
              className="modern-input"
              value={konfirmasiPassword}
              onChange={e => setKonfirmasiPassword(e.target.value)}
              required
              placeholder="Ketik ulang password baru"
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
          </button>
        </form>
      </div>
    </div>
  );
}
