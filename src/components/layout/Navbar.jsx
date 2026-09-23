import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, getStoredToken, clearAuthCookies, getUserRole, setUserRole, getUserCredits, syncUserCreditsWithBackend } from '../../utils/cookieUtils';
import { getCurrentLanguage, setCurrentLanguage, useTranslation } from '../../utils/i18n';

/* ─── High-Fidelity SVG Icons (matches DashboardSidebar) ─── */
function Icon({ d, size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={style}
    >
      <path d={d} />
    </svg>
  );
}

const ZAP = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
const MENU = 'M4 6h16M4 12h8M4 18h16';
const CLOSE = 'M18 6 6 18M6 6l12 12';
const ARROW = 'M5 12h14M12 5l7 7-7 7';
const LOGOUT = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9';
const GLOBE = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z';
const SHIELD = 'M12 2 3 6v6c0 5 4 8 9 10 5-2 9-5 9-10V6z';

/* ─── Nav link button (sidebar nav-item treatment, horizontal) ─── */
function NavLink({ children, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      className={[
        'relative text-[13px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer border-none whitespace-nowrap',
        'transition-all duration-150 ease-out focus-visible:outline-none',
        active
          ? 'bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-cyan-50/60 text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_10px_rgba(99,102,241,0.12)]'
          : 'bg-transparent text-slate-600 hover:bg-slate-100/90 hover:text-slate-800',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* ─── Compact pill wrapper — shared height/shape for every right-cluster control ─── */
function Pill({ children, as = 'div', className = '', ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`h-9 flex items-center bg-white/70 backdrop-blur border border-slate-200/80 rounded-lg shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 3-Role Governance & Credits State
  const [userRole, setUserRoleState] = useState(() => getUserRole());
  const [credits, setCredits] = useState(() => getUserCredits());
  const [activeLang, setActiveLang] = useState(() => getCurrentLanguage());

  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';
  const isDash = location.pathname === '/dashboard';
  const isPricing = location.pathname === '/pricing';

  useEffect(() => {
    syncUserCreditsWithBackend().then((bal) => setCredits(bal));
    const handleRole = (e) => setUserRoleState(e.detail.role);
    const handleCredits = (e) => setCredits(e.detail.credits);
    const handleLang = (e) => setActiveLang(e.detail.lang);
    window.addEventListener('role_changed', handleRole);
    window.addEventListener('credits_changed', handleCredits);
    window.addEventListener('language_changed', handleLang);
    return () => {
      window.removeEventListener('role_changed', handleRole);
      window.removeEventListener('credits_changed', handleCredits);
      window.removeEventListener('language_changed', handleLang);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    const token = getStoredToken();
    if (token && !isLogin && !isSignup) {
      try { setCurrentUser(getStoredUser()); }
      catch { setCurrentUser(null); }
    } else {
      setCurrentUser(null);
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname, isLogin, isSignup]);

  /* Close mobile menu on route change */
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const scrollToSection = (id) => {
    setMobileOpen(false);
    if (!isLanding) {
      navigate(`/#${id}`);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    clearAuthCookies();
    setCurrentUser(null);
    navigate('/login');
  };

  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'C';
  const roleBadgeClass = currentUser?.role === 'owner'
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-sky-700 bg-sky-50 border-sky-200';

  const roleEmoji = { admin: '👑', developer: '💻', viewer: '👁️' }[userRole] || '👤';

  const languages = [
    { code: 'en', label: '🇬🇧 EN' },
    { code: 'hi', label: '🇮🇳 हिन्दी' },
    { code: 'gu', label: '🇮🇳 ગુજરાતી' },
    { code: 'es', label: '🇪🇸 ES' },
    { code: 'fr', label: '🇫🇷 FR' },
  ];

  return (
    <>
      {/* ── Header (glass, matches DashboardSidebar) ── */}
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-2xl transition-all duration-300',
          scrolled
            ? 'bg-white/90 border-slate-200/70 shadow-[0_6px_32px_rgba(15,23,42,0.08)]'
            : 'bg-white/80 border-slate-200/50 shadow-[0_2px_16px_rgba(15,23,42,0.04)]',
        ].join(' ')}
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-3">

          {/* ── Logo ── */}
          <button
            onClick={() => navigate(currentUser ? '/dashboard' : '/')}
            className="flex items-center gap-2.5 cursor-pointer group select-none border-none bg-transparent shrink-0"
            aria-label="Go home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-[0_0_0_2px_rgba(99,102,241,0.18),0_4px_14px_rgba(99,102,241,0.35)] transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_0_0_3px_rgba(99,102,241,0.28),0_6px_18px_rgba(99,102,241,0.45)]">
              <Icon d={ZAP} size={16} color="#fff" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[15px] font-extrabold tracking-[0.1px] text-slate-900 whitespace-nowrap">
                Compile
              </span>
              <span className="inline-flex text-[9.5px] font-bold px-1.5 py-0.5 rounded-md tracking-[0.3px] border text-indigo-700 bg-indigo-50 border-indigo-200">
                AI
              </span>
            </div>
          </button>

          {/* ── Desktop Navigation Links (center cluster) ── */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center min-w-0">
            {currentUser && (
              <NavLink onClick={() => navigate('/dashboard')} active={isDash}>
                {t('dashboard') || 'Dashboard'}
              </NavLink>
            )}
            <NavLink onClick={() => scrollToSection('features')}>Features</NavLink>
            <NavLink onClick={() => scrollToSection('howitworks')}>How it works</NavLink>
            <NavLink onClick={() => scrollToSection('output')}>Live Output</NavLink>
            <NavLink onClick={() => navigate('/pricing')} active={isPricing}>
              {t('pricing') || 'Pricing'}
            </NavLink>
          </nav>

          {/* ── Desktop Right Actions ── */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">

            {/* Language + Role cluster — reveals at xl to keep lg tidy */}
            <div className="hidden xl:flex items-center gap-2">
              <Pill as="select"
                value={activeLang}
                onChange={(e) => {
                  const lang = e.target.value;
                  setCurrentLanguage(lang);
                  setActiveLang(lang);
                }}
                className="px-2.5 text-[11.5px] font-semibold text-slate-600 cursor-pointer focus:outline-none"
                title="Select Language"
              >
                {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </Pill>

              <Pill className="pl-2.5 pr-1" title="Switch user role (testing control)">
                <Icon d={SHIELD} size={12} color="#94a3b8" className="mr-1.5" />
                <select
                  value={userRole}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setUserRole(newRole);
                    setUserRoleState(newRole);
                  }}
                  className="h-full bg-transparent font-bold text-slate-800 cursor-pointer focus:outline-none text-[11.5px] pr-1.5"
                >
                  <option value="admin">👑 Admin</option>
                  <option value="developer">💻 Developer</option>
                  <option value="viewer">👁️ Viewer</option>
                </select>
              </Pill>

              <span className="w-px h-5 bg-slate-200" />
            </div>

            {/* Credits Counter Badge */}
            <button
              onClick={() => navigate('/pricing')}
              className="h-9 flex items-center gap-1.5 text-[11px] font-bold px-3 rounded-full border tracking-[0.3px] text-amber-700 bg-amber-50 border-amber-200 cursor-pointer whitespace-nowrap transition-all duration-200 hover:bg-amber-100 hover:-translate-y-px"
              title="Current AI Blueprint Credits — click to recharge"
            >
              <span>🪙</span>
              <span>{credits}</span>
            </button>

            {currentUser ? (
              /* Authenticated state */
              <div className="flex items-center gap-2">
                <div className="h-9 flex items-center gap-2 pl-1 pr-3 rounded-full border border-slate-200/80 bg-white/70 backdrop-blur shadow-[0_1px_3px_rgba(15,23,42,0.04)] max-w-[160px]">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-extrabold text-[12px] flex items-center justify-center shrink-0 shadow-[0_0_0_2px_rgba(99,102,241,0.18)]">
                    {userInitial}
                  </div>
                  <div className="flex flex-col leading-none min-w-0">
                    <span className="text-[12px] font-bold text-slate-900 truncate">{currentUser.name || 'User'}</span>
                    <span className={`text-[9.5px] font-bold mt-0.5 tracking-[0.3px] ${userRole === 'admin' ? 'text-amber-600' : userRole === 'developer' ? 'text-indigo-600' : 'text-slate-500'}`}>
                      {userRole.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="h-9 flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/60 text-slate-500 cursor-pointer text-[12.5px] font-semibold px-2.5 whitespace-nowrap shrink-0 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <Icon d={LOGOUT} size={14} color="currentColor" />
                  <span className="hidden 2xl:inline">Sign out</span>
                </button>
              </div>
            ) : isLogin ? (
              <button
                onClick={() => navigate('/signup')}
                className="h-9 flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/60 text-slate-600 cursor-pointer text-[13px] font-semibold px-3.5 whitespace-nowrap transition-all duration-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-200"
              >
                Sign up <Icon d={ARROW} size={13} color="currentColor" />
              </button>
            ) : isSignup ? (
              <button
                onClick={() => navigate('/login')}
                className="h-9 flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/60 text-slate-600 cursor-pointer text-[13px] font-semibold px-3.5 whitespace-nowrap transition-all duration-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-200"
              >
                Log in <Icon d={ARROW} size={13} color="currentColor" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="h-9 flex items-center rounded-lg border-none bg-transparent text-slate-600 cursor-pointer text-[13px] font-semibold px-3 whitespace-nowrap transition-all duration-200 hover:bg-slate-100/90 hover:text-slate-800"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="sidebar-cta-btn h-9 flex items-center gap-1.5 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white border-none font-bold text-[13px] cursor-pointer rounded-xl px-3.5 whitespace-nowrap shadow-[0_4px_16px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  Get started <Icon d={ARROW} size={13} color="#ffffff" />
                </button>
              </div>
            )}
          </div>

          {/* ── Mobile / Tablet Hamburger (shown below lg) ── */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200/80 bg-white/60 text-slate-400 cursor-pointer shrink-0 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
            aria-label="Toggle menu"
          >
            <Icon d={mobileOpen ? CLOSE : MENU} size={18} color="currentColor" />
          </button>
        </div>
      </header>

      {/* ── Mobile / Tablet Drawer (glass, matches DashboardSidebar mobile drawer) ── */}
      {mobileOpen && (
        <div
          className="navbar-mobile-drawer-overlay fixed inset-0 z-40 lg:hidden bg-slate-900/45 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <nav
            className="navbar-mobile-drawer absolute top-16 left-0 right-0 max-h-[calc(100vh-64px)] overflow-y-auto bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_16px_48px_rgba(15,23,42,0.18)] px-4 py-4 flex flex-col gap-1.5 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div
              aria-hidden
              className="absolute -top-14 -right-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, transparent 70%)' }}
            />

            {currentUser && (
              <div className="flex items-center gap-2.5 py-2.5 px-2.5 mb-1.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-extrabold text-[15px] flex items-center justify-center shrink-0 shadow-[0_0_0_2px_rgba(99,102,241,0.18),0_4px_14px_rgba(99,102,241,0.35)]">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[13.5px] font-bold text-slate-900 leading-tight truncate">{currentUser.name}</p>
                  <p className="m-0 text-[11px] text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">{currentUser.company || 'Workspace'}</p>
                </div>
                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md tracking-[0.3px] border shrink-0 ${roleBadgeClass}`}>
                  {currentUser.role === 'owner' ? '★ Owner' : 'Member'}
                </span>
              </div>
            )}

            {/* Primary nav items */}
            {[
              { label: currentUser ? 'Dashboard' : 'Home', action: () => navigate(currentUser ? '/dashboard' : '/'), active: isDash },
              { label: 'Features', action: () => scrollToSection('features') },
              { label: 'How it works', action: () => scrollToSection('howitworks') },
              { label: 'Live Output', action: () => scrollToSection('output') },
              { label: 'Pricing', action: () => navigate('/pricing'), active: isPricing },
            ].map(({ label, action, active }) => (
              <button
                key={label}
                onClick={() => { setMobileOpen(false); action(); }}
                className={[
                  'relative text-left px-3 py-2.5 text-[13px] rounded-xl border-none cursor-pointer transition-all duration-150',
                  active
                    ? 'bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-cyan-50/60 text-indigo-700 font-bold'
                    : 'bg-transparent text-slate-700 font-semibold hover:bg-slate-100/90',
                ].join(' ')}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-gradient-to-b from-indigo-500 to-cyan-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                )}
                {label}
              </button>
            ))}

            <div className="h-px bg-slate-200/70 my-1.5" />

            {/* Settings row: language + role + credits — full parity with desktop */}
            <div className="text-[10px] font-bold uppercase tracking-[1.1px] text-slate-400 px-2.5 pb-1.5">
              Workspace Controls
            </div>
            <div className="grid grid-cols-2 gap-2 px-1 pb-1.5">
              <label className="flex items-center gap-1.5 h-10 rounded-xl border border-slate-200/80 bg-white/70 px-2.5">
                <Icon d={GLOBE} size={13} color="#94a3b8" />
                <select
                  value={activeLang}
                  onChange={(e) => { const lang = e.target.value; setCurrentLanguage(lang); setActiveLang(lang); }}
                  className="bg-transparent text-[12px] font-semibold text-slate-700 cursor-pointer focus:outline-none w-full"
                >
                  {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1.5 h-10 rounded-xl border border-slate-200/80 bg-white/70 px-2.5">
                <Icon d={SHIELD} size={13} color="#94a3b8" />
                <select
                  value={userRole}
                  onChange={(e) => { const newRole = e.target.value; setUserRole(newRole); setUserRoleState(newRole); }}
                  className="bg-transparent text-[12px] font-bold text-slate-700 cursor-pointer focus:outline-none w-full"
                >
                  <option value="admin">👑 Admin</option>
                  <option value="developer">💻 Developer</option>
                  <option value="viewer">👁️ Viewer</option>
                </select>
              </label>
            </div>
            <button
              onClick={() => { setMobileOpen(false); navigate('/pricing'); }}
              className="flex items-center justify-center gap-1.5 h-10 mx-1 mb-1.5 text-[12.5px] font-bold rounded-xl border tracking-[0.3px] text-amber-700 bg-amber-50 border-amber-200"
            >
              <span>🪙</span><span>{credits} credits — recharge</span>
            </button>

            <div className="h-px bg-slate-200/70 my-1.5" />

            {currentUser ? (
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 text-red-600 cursor-pointer text-[13px] font-semibold py-2.5 transition-all duration-200 hover:bg-red-50"
              >
                <Icon d={LOGOUT} size={15} color="currentColor" />
                Sign out
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => { setMobileOpen(false); navigate('/login'); }}
                  className="w-full rounded-xl border border-slate-200/80 bg-white/60 text-slate-600 cursor-pointer text-[13px] font-semibold py-2.5 transition-all duration-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-200"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setMobileOpen(false); navigate('/signup'); }}
                  className="sidebar-cta-btn w-full flex items-center justify-center gap-1.5 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white border-none font-bold text-[13px] cursor-pointer rounded-xl py-2.5 shadow-[0_4px_16px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  Get started free <Icon d={ARROW} size={15} color="#ffffff" />
                </button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* ─── Shared animation + hover styles (matches DashboardSidebar) ─── */}
      <style>{`
        @keyframes drawerSlideDown {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }

        .navbar-mobile-drawer {
          animation: drawerSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .sidebar-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255,255,255,0.3) !important;
          filter: brightness(1.05);
        }

        .sidebar-cta-btn:active {
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .navbar-mobile-drawer {
            animation: none !important;
          }
          .sidebar-cta-btn,
          header {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}