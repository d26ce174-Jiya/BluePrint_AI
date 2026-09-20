import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, getStoredToken, clearAuthCookies } from '../../utils/cookieUtils';

/* ─── shared palette ─── */
const C = {
  primary:   '#6366f1',
  primaryDk: '#4f46e5',
  primaryLt: '#eef2ff',
  accent:    '#06b6d4',
  textH:     '#0f172a',
  textB:     '#334155',
  textM:     '#64748b',
  textSub:   '#94a3b8',
  border:    '#e4e7f0',
  surface:   '#ffffff',
  surfaceAlt:'#f8fafc',
  grad:      'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
};

function Icon({ d, size = 18, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      <path d={d} />
    </svg>
  );
}

const ZAP   = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
const MENU  = 'M4 6h16M4 12h16M4 18h16';
const CLOSE = 'M18 6 6 18M6 6l12 12';
const ARROW = 'M5 12h14M12 5l7 7-7 7';
const USER  = 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z';
const LOGOUT= 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const isLanding = location.pathname === '/';
  const isLogin   = location.pathname === '/login';
  const isSignup  = location.pathname === '/signup';
  const isDash    = location.pathname === '/dashboard';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll, { passive: true });

    // A user is only authenticated if a valid token exists AND they are not on /login or /signup
    const token = getStoredToken();
    if (token && !isLogin && !isSignup) {
      try {
        const u = getStoredUser();
        setCurrentUser(u);
      } catch (e) {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }

    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname, isLogin, isSignup]);

  const scrollToSection = (id) => {
    setMobileOpen(false);
    if (!isLanding) {
      navigate(`/#${id}`);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    clearAuthCookies();
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: scrolled ? 'rgba(255, 255, 255, 0.92)' : 'rgba(246, 247, 251, 0.8)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${scrolled ? C.border : 'rgba(228, 231, 240, 0.6)'}`,
      boxShadow: scrolled ? '0 4px 20px rgba(15, 23, 42, 0.05)' : 'none',
      transition: 'all 0.25s ease',
    }}>
      <div style={{
        maxWidth: 1160,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate(currentUser ? '/dashboard' : '/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: C.grad,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
            transition: 'transform 0.2s',
          }}>
            <Icon d={ZAP} size={18} color="#fff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              color: C.textH,
              fontWeight: 800,
              fontSize: 19,
              letterSpacing: '-0.5px',
            }}>
              Compile
            </span>
            <span style={{
              fontSize: 10,
              padding: '2px 7px',
              borderRadius: 12,
              background: C.primaryLt,
              border: '1px solid #c7d2fe',
              color: C.primaryDk,
              fontFamily: 'monospace',
              fontWeight: 700,
            }}>
              AI
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {currentUser && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: isDash ? C.primaryLt : 'none',
                border: isDash ? '1px solid #c7d2fe' : 'none',
                color: isDash ? C.primaryDk : C.textM,
                fontSize: 14,
                fontWeight: isDash ? 700 : 500,
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: 8,
                transition: 'all 0.15s',
              }}
            >
              Dashboard
            </button>
          )}

          <button
            onClick={() => scrollToSection('features')}
            style={{
              background: 'none',
              border: 'none',
              color: C.textM,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s',
              padding: 0,
            }}
            onMouseEnter={e => e.target.style.color = C.primary}
            onMouseLeave={e => e.target.style.color = C.textM}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('howitworks')}
            style={{
              background: 'none',
              border: 'none',
              color: C.textM,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s',
              padding: 0,
            }}
            onMouseEnter={e => e.target.style.color = C.primary}
            onMouseLeave={e => e.target.style.color = C.textM}
          >
            How it works
          </button>
          <button
            onClick={() => scrollToSection('output')}
            style={{
              background: 'none',
              border: 'none',
              color: C.textM,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s',
              padding: 0,
            }}
            onMouseEnter={e => e.target.style.color = C.primary}
            onMouseLeave={e => e.target.style.color = C.textM}
          >
            Live Output
          </button>
        </nav>

        {/* Right CTA Actions based on route and login status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {currentUser ? (
            /* Logged in User Profile & Sign Out */
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px 4px 6px',
                borderRadius: 20,
                background: C.surface,
                border: `1px solid ${C.border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: C.grad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="nav-user-details" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.textH, lineHeight: 1.2 }}>
                    {currentUser.name || 'User'}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: currentUser.role === 'owner' ? '#b45309' : '#0e7490',
                    lineHeight: 1,
                  }}>
                    {currentUser.role === 'owner' ? '★ Owner' : 'Member'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign out"
                className="desktop-auth"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  color: C.textM,
                  padding: '7px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textM; e.currentTarget.style.borderColor = C.border; }}
              >
                <Icon d={LOGOUT} size={14} />
                <span>Sign out</span>
              </button>
            </div>
          ) : isLogin ? (
            <button
              onClick={() => navigate('/signup')}
              style={{
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                color: C.textB,
                fontSize: 13,
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: 9,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              Sign up <Icon d={ARROW} size={14} />
            </button>
          ) : isSignup ? (
            <button
              onClick={() => navigate('/login')}
              style={{
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                color: C.textB,
                fontSize: 13,
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: 9,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              Log in <Icon d={ARROW} size={14} />
            </button>
          ) : (
            <div className="desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.textB,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                }}
              >
                Sign in
              </button>
              <button
                onClick={() => navigate('/signup')}
                style={{
                  background: C.grad,
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '9px 18px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 3px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                Get started free
                <Icon d={ARROW} size={14} color="#fff" />
              </button>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: C.textB,
              cursor: 'pointer',
              padding: 6,
            }}
            className="mobile-nav-btn"
            aria-label="Toggle Navigation Menu"
          >
            <Icon d={mobileOpen ? CLOSE : MENU} size={22} color={C.textB} />
          </button>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileOpen && (
        <div style={{
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          padding: '16px 24px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
        }}>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: C.textH }}>{currentUser.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.textM }}>{currentUser.company || 'Workspace'}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: C.primaryLt, color: C.primaryDk }}>
                {currentUser.role === 'owner' ? 'Owner' : 'Member'}
              </span>
            </div>
          )}

          <button
            onClick={() => { setMobileOpen(false); navigate(currentUser ? '/dashboard' : '/'); }}
            style={{
              background: 'none',
              border: 'none',
              textAlign: 'left',
              color: C.textH,
              fontSize: 15,
              fontWeight: 500,
              padding: '6px 0',
              cursor: 'pointer',
            }}
          >
            {currentUser ? 'Dashboard' : 'Home'}
          </button>
          <button
            onClick={() => scrollToSection('features')}
            style={{
              background: 'none',
              border: 'none',
              textAlign: 'left',
              color: C.textH,
              fontSize: 15,
              fontWeight: 500,
              padding: '6px 0',
              cursor: 'pointer',
            }}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('howitworks')}
            style={{
              background: 'none',
              border: 'none',
              textAlign: 'left',
              color: C.textH,
              fontSize: 15,
              fontWeight: 500,
              padding: '6px 0',
              cursor: 'pointer',
            }}
          >
            How it works
          </button>

          <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
          {currentUser ? (
            <button
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: `1.5px solid #fca5a5`,
                background: '#fef2f2',
                color: '#ef4444',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setMobileOpen(false); navigate('/login'); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: `1.5px solid ${C.border}`,
                  background: C.surface,
                  color: C.textB,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
              <button
                onClick={() => { setMobileOpen(false); navigate('/signup'); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: C.grad,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Get started
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-auth { display: none !important; }
          .mobile-nav-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .desktop-auth { display: flex !important; }
          .mobile-nav-btn { display: none !important; }
        }
        @media (max-width: 480px) {
          .nav-user-details { display: none !important; }
        }
      `}</style>
    </header>
  );
}
