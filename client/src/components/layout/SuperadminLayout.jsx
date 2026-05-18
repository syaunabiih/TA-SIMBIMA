import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── SVG Icon Primitives ────────────────────────────────────────────────────────
const Icon = ({ d, d2, extraPath, size = 18, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ flexShrink: 0 }}>
    <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {d2 && <path d={d2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    {extraPath}
  </svg>
);

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconDatabase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2" />
    <path d="M3 5v5c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 10v5c0 1.66 4.03 3 9 3s9-1.34 9-3v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconActivity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconFileText = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconFileCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="9 15 11 17 15 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconLogOut = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Warna tema SUPERADMIN — Violet/Indigo Premium
const THEME = {
  primary:        '#7c3aed',
  primaryLight:   '#8b5cf6',
  primaryGlow:    'rgba(124,58,237,0.18)',
  primaryBg:      'linear-gradient(135deg, #ede9fe, #ddd6fe)',
  sidebarBg:      '#0f0a1e',
  sidebarBorder:  'rgba(139,92,246,0.15)',
  textPrimary:    '#f1f5f9',
  textMuted:      '#94a3b8',
  activeBg:       'rgba(139,92,246,0.15)',
  activeColor:    '#c4b5fd',
  activeBorder:   'rgba(139,92,246,0.4)',
  hoverBg:        'rgba(255,255,255,0.05)',
  badgeBg:        'rgba(139,92,246,0.2)',
  badgeColor:     '#c4b5fd',
  badgeBorder:    'rgba(139,92,246,0.35)',
};

const MENU_ITEMS = [
  { path: '/superadmin/dashboard',   label: 'Dashboard',      icon: <IconDashboard /> },
  { path: '/superadmin/master-data', label: 'Master Data',    icon: <IconDatabase /> },
  { path: '/superadmin/akun',        label: 'Kelola Akun',    icon: <IconUsers /> },
  { path: '/superadmin/monitoring',  label: 'Monitoring',     icon: <IconActivity /> },
  { path: '/superadmin/rekap',       label: 'Rekap Absensi',  icon: <IconFileText /> },
  { path: '/superadmin/perizinan',   label: 'Perizinan',      icon: <IconFileCheck /> },
];

/**
 * SuperadminLayout — Layout sidebar khusus SUPERADMIN
 * Tema: Dark Violet/Indigo Premium
 */
function SuperadminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const nama = localStorage.getItem('simbima_nama') || 'Superadmin';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Inter, sans-serif' }}>

      {/* ── SIDEBAR BACKDROP (mobile) ── */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 95 }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}
        style={{
          width: '260px',
          background: THEME.sidebarBg,
          borderRight: `1px solid ${THEME.sidebarBorder}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : '-260px',
          height: '100vh',
          zIndex: 100,
          transition: 'left 0.3s ease',
          boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: `1px solid ${THEME.sidebarBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px', flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${THEME.primaryGlow}`,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: THEME.textPrimary, fontWeight: '700', fontSize: '16px', letterSpacing: '-0.3px' }}>
              SIMBIMA
            </div>
            <div style={{
              display: 'inline-block', marginTop: '3px',
              background: THEME.badgeBg, color: THEME.badgeColor,
              fontSize: '10px', fontWeight: '700',
              padding: '1px 8px', borderRadius: '20px',
              border: `1px solid ${THEME.badgeBorder}`,
              letterSpacing: '0.5px',
            }}>
              SUPERADMIN
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  borderRadius: '10px',
                  border: isActive ? `1px solid ${THEME.activeBorder}` : '1px solid transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  background: isActive ? THEME.activeBg : 'transparent',
                  color: isActive ? THEME.activeColor : THEME.textMuted,
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = THEME.hoverBg; e.currentTarget.style.color = THEME.textPrimary; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = THEME.textMuted; }}
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
                    background: 'linear-gradient(180deg, #8b5cf6, #7c3aed)',
                  }} />
                )}
                <span style={{
                  flexShrink: 0,
                  transition: 'transform 0.2s ease',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div style={{ padding: '12px 8px', borderTop: `1px solid ${THEME.sidebarBorder}` }}>
          {/* User card */}
          <div style={{
            padding: '10px 12px', marginBottom: '8px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            border: `1px solid ${THEME.sidebarBorder}`,
          }}>
            <div style={{ color: THEME.textPrimary, fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nama}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px',
              background: THEME.badgeBg, color: THEME.badgeColor,
              fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
              border: `1px solid ${THEME.badgeBorder}`,
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill={THEME.badgeColor}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Ketua Pokja
            </div>
          </div>

          {/* Profil */}
          <button
            onClick={() => navigate('/profil')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '9px 12px', marginBottom: '4px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', background: 'transparent',
              color: THEME.textMuted, fontSize: '14px', fontWeight: '400',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = THEME.hoverBg; e.currentTarget.style.color = THEME.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = THEME.textMuted; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Profil Saya</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '9px 12px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', background: 'transparent',
              color: '#f87171', fontSize: '14px', fontWeight: '400',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f87171'; }}
          >
            <IconLogOut />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content" style={{ marginLeft: sidebarOpen ? '260px' : '0' }}>
        {/* Top Navbar */}
        <header style={{
          height: '60px', background: '#ffffff', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
          position: 'sticky', top: 0, zIndex: 90, gap: '12px',
        }}>
          {/* Hamburger */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
              color: THEME.primary, fontSize: '11px', fontWeight: '700',
              padding: '3px 10px', borderRadius: '20px',
              border: '1px solid rgba(124,58,237,0.2)',
              letterSpacing: '0.3px',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill={THEME.primary}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              SUPERADMIN
            </span>
          </div>

          {/* Profile */}
          <button
            onClick={() => navigate('/profil')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: '500', fontSize: '14px' }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.primary,
              border: `2px solid rgba(124,58,237,0.2)`,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="topbar-name">{nama}</span>
          </button>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default SuperadminLayout;
