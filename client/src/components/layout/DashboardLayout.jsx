import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiGetNotifikasi } from '../../utils/api';
import { useSocket } from '../../hooks/useSocket';
import { subscribePush } from '../../utils/pushSubscription';

/**
 * DashboardLayout — Layout utama yang dipakai semua role (Light Theme)
 */
function DashboardLayout({ menuItems, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch count setiap kali lokasi berubah (navigasi)
    const fetchNotif = async () => {
      try {
        const res = await apiGetNotifikasi();
        if (res?.data?.belum_dibaca !== undefined) {
          setUnreadCount(res.data.belum_dibaca);
        }
      } catch (err) { }
    };
    fetchNotif();
    
    // Pastikan user subscribe ke push notification setiap kali masuk dashboard
    subscribePush();
  }, [location.pathname]);

  // ── Realtime: update badge saat ada perizinan baru/diupdate ───────────
  const refetchNotif = useCallback(async () => {
    try {
      const res = await apiGetNotifikasi();
      if (res?.data?.belum_dibaca !== undefined) {
        setUnreadCount(res.data.belum_dibaca);
      }
    } catch (_) {}
  }, []);
  useSocket("perizinan:update", refetchNotif);

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

  const rolePrefix = role === 'KETUA_POKJA' ? '/pokja' : role === 'FASILITATOR' ? '/fasilitator' : '/mahasiswa';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Inter, sans-serif' }}>

      {/* ── SIDEBAR BACKDROP (mobile only) ── */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 95
          }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{
        width: '260px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : '-260px',
        height: '100vh',
        zIndex: 100,
        transition: 'left 0.3s ease',
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
          <div>
              <div style={{ color: '#1e293b', fontWeight: '700', fontSize: '16px', letterSpacing: '-0.3px' }}>SIMBIMA</div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>v1.0</div>
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); if (window.innerWidth <= 768) setSidebarOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  borderRadius: '10px',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  background: isActive
                    ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
                    : 'transparent',
                  color: isActive ? '#059669' : '#64748b',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'left',
                  transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(16,185,129,0.25)' : 'none',
                  whiteSpace: 'nowrap',
                  minHeight: '42px',
                }}
              >
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
                  }} />
                )}
                <div style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    display: 'flex',
                  }}>{item.icon}</span>
                </div>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #e2e8f0' }}>
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
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', background: 'transparent',
              color: '#ef4444', fontSize: '14px', fontWeight: '500',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              opacity: 0.7,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Navbar */}
        <header style={{
            height: '60px', background: '#ffffff', borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
            position: 'sticky', top: 0, zIndex: 90, gap: '12px'
        }}>
          {/* Hamburger toggle untuk semua device */}
          <button
            className="hamburger-btn-desktop"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '8px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={{ flex: 1 }} />

          {/* Notification + Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => navigate(`${rolePrefix}/notifikasi`)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {unreadCount > 0 && (
                 <span style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {unreadCount > 9 ? '9+' : unreadCount}
                 </span>
              )}
            </button>
            <button onClick={() => navigate('/profil')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="topbar-name">Profil Saya</span>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
