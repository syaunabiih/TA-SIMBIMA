import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * DashboardLayout — Layout utama yang dipakai semua role
 *
 * Props:
 * - menuItems: array menu yang ditampilkan di sidebar (berbeda per role)
 * - children: konten utama halaman
 *
 * Konsep: "Composition Pattern" — layout ini tidak tahu isinya apa,
 * dia cuma menyediakan kerangka (sidebar + main area).
 */
function DashboardLayout({ menuItems, children }) {
  const navigate = useNavigate();
  const location = useLocation(); // Untuk tahu URL aktif saat ini
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const nama = localStorage.getItem('simbima_nama') || 'Pengguna';
  const role = localStorage.getItem('simbima_role') || '';

  const roleLabel = {
    MAHASISWA: 'Mahasiswa',
    FASILITATOR: 'Fasilitator',
    KETUA_POKJA: 'Ketua Pokja',
  }[role] || role;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1117', fontFamily: 'Inter, sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? '240px' : '72px',
        background: 'linear-gradient(180deg, #0f2027 0%, #0d1f1a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px', flexShrink: 0,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '16px', letterSpacing: '-0.3px' }}>SIMBIMA</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>v1.0</div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={!sidebarOpen ? item.label : ''}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))'
                    : 'transparent',
                  color: isActive ? '#10b981' : 'rgba(255,255,255,0.55)',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(16,185,129,0.3)' : 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {sidebarOpen && (
            <div style={{
              padding: '10px 12px', marginBottom: '8px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '10px',
            }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nama}</div>
              <div style={{
                display: 'inline-block', marginTop: '4px',
                background: 'rgba(16,185,129,0.15)', color: '#10b981',
                fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
              }}>{roleLabel}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Keluar' : ''}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', background: 'transparent',
              color: 'rgba(239,68,68,0.7)', fontSize: '14px', fontWeight: '500',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute', top: '22px', right: '-12px',
            width: '24px', height: '24px', borderRadius: '50%',
            background: '#1a3a2a', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', zIndex: 101,
          }}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '240px' : '72px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        background: '#0d1117',
      }}>
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
