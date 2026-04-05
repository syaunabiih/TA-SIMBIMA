import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate(); // Hook untuk berpindah halaman secara programmatic
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, message: '', type: '' });

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Simpan token & info user ke localStorage
        localStorage.setItem('simbima_token', data.token);
        localStorage.setItem('simbima_role', data.data.role);
        localStorage.setItem('simbima_nama', data.data.nama);

        setAlert({ show: true, message: `Selamat datang, ${data.data.nama}!`, type: 'success' });

        // Arahkan ke dashboard sesuai role setelah 1 detik
        setTimeout(() => {
          const role = data.data.role;
          if (role === 'MAHASISWA') navigate('/dashboard/mahasiswa');
          else if (role === 'FASILITATOR') navigate('/dashboard/fasilitator');
          else if (role === 'KETUA_POKJA') navigate('/dashboard/ketua-pokja');
        }, 1000);

      } else {
        setAlert({ show: true, message: data.message || 'NIM/NIP atau password salah.', type: 'error' });
      }
    } catch {
      setAlert({ show: true, message: 'Gagal terhubung ke server. Coba lagi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg flex items-center justify-center min-h-screen p-4">
      {/* Decorative background */}
      <div className="grid-pattern" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Login Card */}
      <div className="glass-card rounded-3xl p-8 w-full max-w-md relative z-10 fade-in-up">

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="logo-ring" />
              <div style={{
                width: '64px', height: '64px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '18px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          <h1 style={{
            fontSize: '28px', fontWeight: '800',
            background: 'linear-gradient(135deg, #ffffff 0%, #a7f3d0 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '0 0 6px 0', letterSpacing: '-0.5px',
          }}>SIMBIMA</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0, letterSpacing: '0.3px' }}>
            Sistem Monitoring Pembinaan Karakter
          </p>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className={`alert-modern ${alert.type === 'success' ? 'alert-success-modern' : 'alert-error-modern'} mb-5`}>
            {alert.type === 'success'
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            }
            <span style={{ fontSize: '14px' }}>{alert.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="fade-in-up-delay">
          {/* NIM/NIP */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
              NIM / NIP
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
              </span>
              <input
                id="identifier"
                type="text"
                placeholder="Masukkan NIM / NIP"
                className="modern-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
              Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="modern-input"
                style={{ paddingRight: '48px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" id="btn-masuk" className="btn-login" disabled={loading}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><span className="spinner" />Memproses...</span>
              : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Masuk
                </span>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '28px', marginBottom: 0 }}>
          © 2025 SIMBIMA · Sistem Pembinaan Karakter
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
