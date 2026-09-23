import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { Button, Icon, Spinner } from '../components/common/ui';
import { setStoredToken, setStoredUser, markNewAccountPendingOnboarding } from '../utils/cookieUtils';

/* ─── Icon paths ─── */
const ZAP    = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
const MAIL   = 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6';
const LOCK   = 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4';
const USER   = 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z';
const EYE    = 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z';
const EYOFF  = 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22';
const ARROW  = 'M5 12h14M12 5l7 7-7 7';
const WARN   = 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01';
const CHECK  = 'M20 6 9 17l-5-5';
const BUILD  = 'M2 20h20M6 20V10M12 20V4M18 20v-6';

/* ─── Password strength meter ─── */
function StrengthMeter({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['hsl(var(--border))', '#ef4444', '#f59e0b', '#6366f1', '#10b981'];
  if (!password) return null;
  return (
    <div className="mt-2 mb-1">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : 'hsl(var(--border))' }} />
        ))}
      </div>
      {score > 0 && (
        <p className="text-[11px] font-semibold" style={{ color: colors[score] }}>
          Strength: {labels[score]}
        </p>
      )}
    </div>
  );
}

/* ─── Field component ─── */
function Field({ label, id, type = 'text', value, onChange, placeholder, error, icon, rightEl, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 pointer-events-none">
            <Icon d={icon} size={15} color={focused ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
          </div>
        )}
        <input
          id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className={[
            'w-full py-2.5 pr-10 border rounded-[var(--radius)] bg-card text-foreground text-[0.9rem] placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring/25 transition-all duration-150',
            error ? 'border-destructive focus:ring-destructive/20 bg-destructive/5' : 'border-border focus:border-ring',
            icon ? 'pl-10' : 'pl-3.5',
          ].join(' ')}
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive font-medium">
          <Icon d={WARN} size={12} color="hsl(var(--destructive))" /> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Google SSO button ─── */
function GoogleButton({ label }) {
  return (
    <button type="button" className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-[var(--radius)] border border-border bg-card text-foreground text-sm font-semibold hover:bg-secondary hover:border-ring/40 transition-all duration-150">
      <svg width="17" height="17" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {label}
    </button>
  );
}

function OrDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ════════════════════════════════════
   SIGNUP PAGE
════════════════════════════════════ */
export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [agreed, setAgreed] = useState(false);

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
        body: JSON.stringify({ name: form.name, email: form.email, company: form.company, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setStoredToken(data.token);
      markNewAccountPendingOnboarding({ ...data.user, onboardingCompleted: false });
      navigate('/onboarding');
    } catch (err) {
      setGlobalError(err.message || 'Backend connection error. Make sure MySQL & backend are running.');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    'Complete BRD generated in < 45 seconds',
    'High-Level Architecture + Tech Stack',
    'Effort & Rough Cost Estimation band',
    'Instant PDF and DOCX exports',
  ];

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden flex flex-col relative">
      <Navbar />

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, hsl(239 84% 67% / 0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 -left-10 w-[400px] h-[400px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, hsl(189 94% 43% / 0.09) 0%, transparent 70%)' }} />
      </div>

      <main className="flex-1 flex items-center justify-center px-5 py-24 relative z-10">
        <div className="w-full max-w-[920px] animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-border bg-card shadow-xl overflow-hidden">

            {/* ── Left gradient panel ── */}
            <div className="hidden md:flex flex-col justify-between p-10 relative" style={{ background: 'var(--grad)' }}>
              {/* Floating badge */}
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-6 animate-float-slow">
                  <Icon d={ZAP} size={13} color="#fff" /> Chaos2Commit 2026 Special
                </div>
                <h2 className="text-white text-[1.65rem] font-extrabold tracking-tight leading-tight mb-4">
                  Turn raw chaos into an implementation plan.
                </h2>
                <p className="text-white/90 text-[13.5px] leading-relaxed mb-8">
                  Paste SOPs, transcripts, or rough ideas. Our AI consultant fills the gaps and builds a comprehensive blueprint.
                </p>
                <div className="flex flex-col gap-3.5">
                  {perks.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                        <Icon d={CHECK} size={11} color="#fff" />
                      </div>
                      <span className="text-white/95 text-[13.5px] font-medium">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Testimonial */}
              <div className="mt-8 p-4 rounded-xl border border-white/25 bg-white/15 backdrop-blur-sm">
                <p className="text-white/95 text-[13px] italic leading-relaxed mb-2.5">
                  &ldquo;Compile cut our sprint discovery from 4 days to 30 minutes.&rdquo;
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                    <Icon d={BUILD} size={13} color="#fff" />
                  </div>
                  <span className="text-white/90 text-[12px] font-bold">Lead Solution Architect</span>
                </div>
              </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="p-8 sm:p-10">
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-1.5">Create your account</h1>
                <p className="text-muted-foreground text-sm">Free workspace · No credit card required</p>
              </div>

              <GoogleButton label="Sign up with Google" />
              <OrDivider label="or sign up with email" />

              {globalError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-[var(--radius)] bg-destructive/10 border border-destructive/25 mb-4">
                  <Icon d={WARN} size={15} color="hsl(var(--destructive))" className="shrink-0 mt-0.5" />
                  <p className="text-destructive text-[13px] leading-relaxed">{globalError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 gap-0">
                  <Field label="Full name" id="name" value={form.name} onChange={set('name')}
                    placeholder="Jordan Miller" error={errors.name} icon={USER} />
                  <Field label="Work email" id="email" type="email" value={form.email}
                    onChange={set('email')} placeholder="jordan@company.com" error={errors.email} icon={MAIL} />
                  <Field label="Company / Organization" id="company" value={form.company}
                    onChange={set('company')} placeholder="Acme Innovations (optional)" icon={BUILD}
                    hint="First user to register for a company becomes Owner; others join as Members." />
                </div>

                <div>
                  <Field label="Password" id="password" type={showPw ? 'text' : 'password'}
                    value={form.password} onChange={set('password')} placeholder="Min. 8 characters"
                    error={errors.password} icon={LOCK}
                    rightEl={
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 flex">
                        <Icon d={showPw ? EYOFF : EYE} size={15} />
                      </button>
                    }
                  />
                  <StrengthMeter password={form.password} />
                </div>

                <div className="mt-3">
                  <Field label="Confirm password" id="confirm" type={showConfirm ? 'text' : 'password'}
                    value={form.confirm} onChange={set('confirm')} placeholder="Re-enter your password"
                    error={errors.confirm} icon={LOCK}
                    rightEl={
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 flex">
                        <Icon d={showConfirm ? EYOFF : EYE} size={15} />
                      </button>
                    }
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5 my-4">
                  <button type="button" onClick={() => setAgreed(!agreed)}
                    className={[
                      'shrink-0 w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center transition-all duration-150 mt-0.5',
                      agreed ? 'border-primary bg-primary' : errors.agreed ? 'border-destructive bg-destructive/10' : 'border-border bg-card hover:border-ring',
                    ].join(' ')}>
                    {agreed && <Icon d={CHECK} size={11} color="#fff" />}
                  </button>
                  <p className="text-[12.5px] text-muted-foreground leading-snug">
                    I agree to the{' '}
                    <span className="text-primary font-semibold cursor-pointer hover:underline">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-primary font-semibold cursor-pointer hover:underline">Privacy Policy</span>
                  </p>
                </div>
                {errors.agreed && (
                  <p className="text-xs text-destructive font-medium -mt-2 mb-3">{errors.agreed}</p>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius)] text-white font-bold text-[15px] transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{
                    background: loading ? 'hsl(var(--muted))' : 'var(--grad)',
                    boxShadow: loading ? 'none' : 'var(--shadow-primary)',
                    color: loading ? 'hsl(var(--muted-foreground))' : '#fff',
                  }}
                >
                  {loading
                    ? <><Spinner size={16} /> Creating account...</>
                    : <>Create free account <Icon d={ARROW} size={17} color="#fff" /></>
                  }
                </button>
              </form>

              <p className="text-center mt-5 text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">Sign in →</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
