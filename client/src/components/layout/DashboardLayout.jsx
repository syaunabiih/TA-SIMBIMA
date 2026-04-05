import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * DashboardLayout — Layout utama yang dipakai semua role (Light Theme)
 */
function DashboardLayout({ menuItems, children }) {
  const navigate = useNavigate();
  const location = useLocation();
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Inter, sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? '260px' : '72px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
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
        boxShadow: '2px 0 8px rgba(0,0,0,0.03)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #e2e8f0',
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
              <div style={{ color: '#1e293b', fontWeight: '700', fontSize: '16px', letterSpacing: '-0.3px' }}>SIMBIMA</div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>v1.0</div>
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
                  position: 'relative',
                  background: isActive
                    ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
                    : 'transparent',
                  color: isActive ? '#059669' : '#64748b',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
                  textAlign: 'left',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(16,185,129,0.25)' : 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: '-8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '4px',
                    height: '24px',
                    borderRadius: '0 4px 4px 0',
                    background: 'linear-gradient(180deg, #10b981, #059669)',
                    animation: 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                )}
                <span style={{
                  flexShrink: 0,
                  transition: 'transform 0.2s ease',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #e2e8f0' }}>
          {sidebarOpen && (
            <div style={{
              padding: '10px 12px', marginBottom: '8px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ color: '#1e293b', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nama}</div>
              <div style={{
                display: 'inline-block', marginTop: '4px',
                background: '#ecfdf5', color: '#059669',
                fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                border: '1px solid #a7f3d0',
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
              color: '#ef4444', fontSize: '14px', fontWeight: '500',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              opacity: 0.7,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
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
            background: '#ffffff', border: '1px solid #e2e8f0',
            color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', zIndex: 101,
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          }}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '72px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        background: '#f0f4f8',
      }}>
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
