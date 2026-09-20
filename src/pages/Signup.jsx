import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { setStoredToken, setStoredUser, markNewAccountPendingOnboarding } from '../utils/cookieUtils';

/* ─── keyframes ─── */
const KEYFRAMES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatBadge {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-7px) rotate(1deg); }
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
  successLt: '#d1fae5',
};

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
const USER  = 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z';
const EYE   = 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z';
const EYOFF = 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22';
const ARROW = 'M5 12h14M12 5l7 7-7 7';
const WARN  = 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01';
const CHECK = 'M20 6 9 17l-5-5';
const BUILD = 'M2 20h20M6 20V10M12 20V4M18 20v-6';

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spinSlow 0.7s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function StrengthMeter({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#e4e7f0', '#ef4444', '#f59e0b', '#6366f1', '#10b981'];
  const color = score ? colors[score] : colors[0];

  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? color : C.border, transition: 'background 0.3s' }} />
        ))}
      </div>
      {score > 0 && <p style={{ fontSize: 11, color, fontWeight: 600, margin: 0 }}>Password Strength: {labels[score]}</p>}
    </div>
  );
}

function Field({ label, id, type = 'text', value, onChange, placeholder, error, icon, rightEl, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
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
            padding: icon ? '11px 44px 11px 42px' : '11px 14px',
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
      {hint && !error && <p style={{ fontSize: 11, color: C.textSub, marginTop: 4, margin: '4px 0 0' }}>{hint}</p>}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
          <Icon d={WARN} size={13} color={C.error} />
          <p style={{ color: C.error, fontSize: 12, fontWeight: 500, margin: 0 }}>{error}</p>
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

/* ════════════ SIGNUP PAGE ════════════ */
export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [agreed, setAgreed] = useState(false);

  /* parallax tracking */
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fn = (e) => setMouse({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    window.addEventListener('mousemove', fn, { passive: true });
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.confirm) e.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    if (!agreed) e.agreed = 'You must agree to continue';
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
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      // Store user data & token in cookies
      setStoredToken(data.token);
      const newUser = {
        ...data.user,
        onboardingCompleted: false,
      };
      markNewAccountPendingOnboarding(newUser);
      // Brand new registration goes immediately to onboarding!
      navigate('/onboarding');
    } catch (err) {
      setGlobalError(err.message || 'Backend connection error. Make sure MySQL & backend are running.');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    'Complete BRD generated in < 30s',
    'High-Level Architecture + Tech Stack',
    'Effort & Rough Cost Estimation band',
    'Instant PDF and DOCX exports',
  ];

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

      {/* Ambient background orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute',
          borderRadius: '50%',
          width: 600,
          height: 600,
          top: '-10%',
          right: '-5%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          transform: `translate(${mouse.x * 20}px, ${mouse.y * 20}px)`,
          transition: 'transform 0.8s ease',
        }} />
        <div style={{
          position: 'absolute',
          borderRadius: '50%',
          width: 500,
          height: 500,
          bottom: '5%',
          left: '-5%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)',
          transform: `translate(${mouse.x * -20}px, ${mouse.y * -20}px)`,
          transition: 'transform 0.8s ease',
        }} />
      </div>

      {/* Main container */}
      <main className="signup-main" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '96px 24px 48px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 960,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderRadius: 24,
          overflow: 'hidden',
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: '0 8px 40px rgba(99,102,241,0.09), 0 2px 6px rgba(0,0,0,0.03)',
          animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        }} className="signup-grid">
          
          {/* Left value panel with gradient & human touches */}
          <div className="signup-left" style={{
            background: C.grad,
            padding: '48px 40px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.22)',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 24,
                animation: 'floatBadge 4s ease-in-out infinite',
              }}>
                <Icon d={ZAP} size={14} color="#fff" />
                Chaos2Commit 2026 Special
              </div>

              <h2 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, marginBottom: 16, letterSpacing: '-0.5px' }}>
                Turn raw chaos into an implementation plan.
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.92, marginBottom: 32 }}>
                Paste SOPs, meeting transcripts, or rough ideas. Our AI consultant analyzes missing information, asks targeted questions, and builds a comprehensive blueprint.
              </p>

              {/* Perks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {perks.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon d={CHECK} size={12} color="#fff" />
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 500, opacity: 0.95 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Micro quote */}
            <div className="signup-quote" style={{
              marginTop: 40,
              padding: '16px 18px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
            }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 8px 0', opacity: 0.95, fontStyle: 'italic' }}>
                "Compile cut down our sprint discovery from 4 days to 30 minutes."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={BUILD} size={13} color="#fff" />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Lead Solution Architect</span>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="signup-form-panel" style={{ padding: '44px 40px' }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textH, marginBottom: 6, letterSpacing: '-0.5px' }}>
                Create your account
              </h1>
              <p style={{ fontSize: 14, color: C.textM }}>
                Free workspace during hackathon · No credit card required
              </p>
            </div>

            <GoogleButton label="Sign up with Google" />
            <Divider label="or sign up with email" />

            {/* Error banner */}
            {globalError && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', borderRadius: 10, background: C.errorLt, border: `1px solid ${C.errorBdr}`, marginBottom: 16 }}>
                <Icon d={WARN} size={15} color={C.error} />
                <p style={{ color: '#991b1b', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{globalError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Field
                label="Full name"
                id="name"
                value={form.name}
                onChange={set('name')}
                placeholder="Jordan Miller"
                error={errors.name}
                icon={USER}
              />
              <Field
                label="Work email"
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="jordan@company.com"
                error={errors.email}
                icon={MAIL}
              />
              <Field
                label="Company / Organization"
                id="company"
                type="text"
                value={form.company}
                onChange={set('company')}
                placeholder="e.g. Acme Innovations (optional)"
                icon={BUILD}
                hint="First user to register for a company is Owner; teammates join as Members."
              />
              <div>
                <Field
                  label="Password"
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  error={errors.password}
                  icon={LOCK}
                  rightEl={
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                      <Icon d={showPw ? EYOFF : EYE} size={16} color={C.textSub} />
                    </button>
                  }
                />
                <StrengthMeter password={form.password} />
              </div>

              <div style={{ marginTop: 12 }}>
                <Field
                  label="Confirm password"
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Re-enter your password"
                  error={errors.confirm}
                  icon={LOCK}
                  rightEl={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                      <Icon d={showConfirm ? EYOFF : EYE} size={16} color={C.textSub} />
                    </button>
                  }
                />
              </div>

              {/* Terms checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, margin: '14px 0 20px' }}>
                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    marginTop: 2,
                    border: `1.5px solid ${errors.agreed ? C.error : agreed ? C.primary : C.borderMed}`,
                    background: agreed ? C.primary : C.surface,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {agreed && <Icon d={CHECK} size={12} color="#fff" />}
                </button>
                <label
                  style={{ fontSize: 13, color: C.textM, lineHeight: 1.5, cursor: 'pointer' }}
                  onClick={() => setAgreed(!agreed)}
                >
                  I agree to Compile's{' '}
                  <span style={{ color: C.primary, fontWeight: 600 }}>Terms of Service</span> and{' '}
                  <span style={{ color: C.primary, fontWeight: 600 }}>Privacy Policy</span>
                </label>
              </div>
              {errors.agreed && (
                <p style={{ color: C.error, fontSize: 12, marginTop: -14, marginBottom: 14 }}>{errors.agreed}</p>
              )}

              {/* Submit CTA */}
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
                  ? <><Spinner /> Creating account...</>
                  : <>Create account <Icon d={ARROW} size={17} color="#fff" /></>
                }
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: C.textM }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 860px) {
          .signup-grid { grid-template-columns: 1fr !important; }
          .signup-left { padding: 36px 28px !important; }
          .signup-form-panel { padding: 36px 28px !important; }
        }
        @media (max-width: 540px) {
          .signup-main { padding: 80px 14px 32px !important; }
          .signup-left { padding: 24px 18px !important; }
          .signup-left h2 { font-size: 22px !important; }
          .signup-quote { display: none !important; }
          .signup-form-panel { padding: 26px 16px !important; }
        }
        @media (max-width: 380px) {
          .signup-main { padding: 72px 10px 24px !important; }
          .signup-left { padding: 20px 14px !important; }
          .signup-form-panel { padding: 20px 12px !important; }
        }
      `}</style>
    </div>
  );
}
