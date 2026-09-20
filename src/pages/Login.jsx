import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { setStoredToken, setStoredUser, getStoredUser, markOnboardingCompleted, getOnboardingData } from '../utils/cookieUtils';

/* ─── keyframes injected once ─── */
const KEYFRAMES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatSlow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-8px) rotate(1deg); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
    70%  { transform: scale(1); box-shadow: 0 0 0 10px rgba(99,102,241,0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  }
  @keyframes spinSlow {
    to { transform: rotate(360deg); }
  }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />;
}

/* ─── shared palette ─── */
const C = {
  bg:        '#f6f7fb',
  surface:   '#ffffff',
  surfaceAlt:'#f0f2f9',
  border:    '#e4e7f0',
  borderMed: '#d0d4e8',
  primary:   '#6366f1',
  primaryDk: '#4f46e5',
  primaryLt: '#eef2ff',
  grad:      'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
  textH:     '#0f172a',
  textB:     '#334155',
  textM:     '#64748b',
  textSub:   '#94a3b8',
  error:     '#ef4444',
  errorLt:   '#fef2f2',
  errorBdr:  '#fca5a5',
  success:   '#10b981',
};

/* ─── icon helper ─── */
function Icon({ d, size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const ZAP   = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
const MAIL  = 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6';
const LOCK  = 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4';
const EYE   = 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z';
const EYOFF = 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22';
const ARROW = 'M5 12h14M12 5l7 7-7 7';
const WARN  = 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01';
const SPARK = 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83';

/* ─── card tilt ─── */
function TiltCard({ children, style = {} }) {
  const ref = useRef(null);
  const move = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.01)`;
  }, []);
  const leave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
  }, []);
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave}
      style={{ transition: 'transform 0.2s ease', willChange: 'transform', ...style }}>
      {children}
    </div>
  );
}

/* ─── field component ─── */
function Field({ label, id, type = 'text', value, onChange, placeholder, error, icon, rightEl }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon d={icon} size={16} color={focused ? C.primary : C.textSub} />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: icon ? '11px 42px 11px 42px' : '11px 42px 11px 14px',
            borderRadius: 10,
            border: `1.5px solid ${error ? C.error : focused ? C.primary : C.border}`,
            background: error ? C.errorLt : focused ? '#fafbff' : C.surface,
            fontSize: 14,
            color: C.textH,
            outline: 'none',
            transition: 'all 0.2s',
            boxShadow: focused && !error ? '0 0 0 3px rgba(99,102,241,0.14)' : 'none',
            boxSizing: 'border-box',
          }}
        />
        {rightEl && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            {rightEl}
          </div>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
          <Icon d={WARN} size={13} color={C.error} />
          <p style={{ color: C.error, fontSize: 12, fontWeight: 500 }}>{error}</p>
        </div>
      )}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ color: C.textSub, fontSize: 12, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function GoogleButton({ label }) {
  return (
    <button
      type="button"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surface, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C.textB, transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {label}
    </button>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spinSlow 0.7s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/* ════════════ LOGIN PAGE ════════════ */
export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  /* subtle mouse parallax for ambient background orbs */
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fn = (e) => setMouse({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    window.addEventListener('mousemove', fn, { passive: true });
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Store session token in cookies
      setStoredToken(data.token);

      // Merge backend user with any stored workspace/onboarding preferences
      const existingUser = getStoredUser() || {};
      const obData = getOnboardingData() || {};
      const mergedUser = {
        ...existingUser,
        ...data.user,
        company: data.user.company || existingUser.company || obData.workspaceName,
        onboardingCompleted: true,
      };
      setStoredUser(mergedUser);
      // Mark onboarding as completed for this user account so it is never shown again on login
      markOnboardingCompleted(mergedUser);

      // Directly to dashboard per requirement: onboarding is NOT shown when logging into an account
      navigate('/dashboard');
    } catch (err) {
      setGlobalError(err.message || 'Backend connection error. Make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      fontFamily: 'system-ui,-apple-system,sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <StyleTag />
      {/* Shared common Navbar */}
      <Navbar />

      {/* Ambient animated parallax background orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute',
          borderRadius: '50%',
          width: 580,
          height: 580,
          top: '-10%',
          left: '-5%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 68%)',
          transform: `translate(${mouse.x * -20}px, ${mouse.y * -20}px)`,
          transition: 'transform 0.8s ease',
        }} />
        <div style={{
          position: 'absolute',
          borderRadius: '50%',
          width: 480,
          height: 480,
          bottom: '5%',
          right: '-5%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 68%)',
          transform: `translate(${mouse.x * 20}px, ${mouse.y * 20}px)`,
          transition: 'transform 0.8s ease',
        }} />
      </div>

      {/* Main container */}
      <main className="login-main" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 24px 48px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: 440, animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards' }}>
          
          <TiltCard className="login-card" style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 22,
            padding: '38px 34px',
            boxShadow: '0 8px 36px rgba(99,102,241,0.08), 0 2px 6px rgba(0,0,0,0.04)',
          }}>
            {/* Header badge & icon */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: C.grad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 4px 18px rgba(99,102,241,0.32)',
                animation: 'pulseRing 3s infinite',
              }}>
                <Icon d={ZAP} size={22} color="#fff" />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textH, marginBottom: 6, letterSpacing: '-0.5px' }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 14, color: C.textM }}>
                Sign in to your Compile workspace
              </p>
            </div>

            {/* Google SSO */}
            <GoogleButton label="Continue with Google" />
            <Divider label="or sign in with email" />

            {/* Error banner */}
            {globalError && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', borderRadius: 10, background: C.errorLt, border: `1px solid ${C.errorBdr}`, marginBottom: 18 }}>
                <Icon d={WARN} size={15} color={C.error} />
                <p style={{ color: '#991b1b', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{globalError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Field
                label="Email address"
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@company.com"
                error={errors.email}
                icon={MAIL}
              />
              <Field
                label="Password"
                id="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                error={errors.password}
                icon={LOCK}
                rightEl={
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: C.textSub }}>
                    <Icon d={showPw ? EYOFF : EYE} size={16} color={C.textSub} />
                  </button>
                }
              />

              {/* Forgot password */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 22 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit button with hover shimmer effect */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '13px',
                  borderRadius: 11,
                  background: loading ? C.borderMed : C.grad,
                  border: 'none',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 18px rgba(99,102,241,0.35)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.48)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(99,102,241,0.35)';
                }}
              >
                {loading
                  ? <><Spinner /> Signing in...</>
                  : <>Sign in <Icon d={ARROW} size={17} color="#fff" /></>
                }
              </button>
            </form>
          </TiltCard>

          {/* Bottom links */}
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <p style={{ fontSize: 14, color: C.textM }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>
                Sign up free →
              </Link>
            </p>
            <p style={{ marginTop: 10, fontSize: 12, color: C.textSub }}>
              Protected by enterprise-grade 256-bit encryption · MySQL Database
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 480px) {
          .login-main { padding: 84px 14px 32px !important; }
          .login-card { padding: 24px 18px !important; border-radius: 16px !important; }
        }
        @media (max-width: 360px) {
          .login-main { padding: 72px 10px 24px !important; }
          .login-card { padding: 20px 14px !important; }
        }
      `}</style>
    </div>
  );
}
