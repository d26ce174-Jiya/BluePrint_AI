import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import {
  getStoredUser,
  getStoredToken,
  setOnboardingData,
  getOnboardingData,
  setCookieConsent,
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from '../utils/cookieUtils';

/* ─── Keyframe styles ─── */
const KEYFRAMES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseSoft {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.04); opacity: 0.85; }
  }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />;
}

/* ─── Palette (Consistent across Compile) ─── */
const C = {
  bg:        '#f6f7fb',
  surface:   '#ffffff',
  surfaceAlt:'#f8fafc',
  border:    '#e4e7f0',
  borderMed: '#d0d4e8',
  primary:   '#6366f1',
  primaryDk: '#4f46e5',
  primaryLt: '#eef2ff',
  accent:    '#06b6d4',
  accentLt:  '#ecfeff',
  success:   '#10b981',
  successLt: '#d1fae5',
  warn:      '#f59e0b',
  warnLt:    '#fef3c7',
  textH:     '#0f172a',
  textB:     '#334155',
  textM:     '#64748b',
  textSub:   '#94a3b8',
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

const CHECK    = 'M20 6 9 17l-5-5';
const ARROW    = 'M5 12h14M12 5l7 7-7 7';
const ZAP      = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
const BUILDING = 'M3 21h18M3 7v14M21 7v14M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M9 7h6M9 11h6M9 15h6';
const USER     = 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z';
const TARGET   = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z';
const SPARK    = 'M12 3l1.9 5.8L20 9l-5 4.3 1.6 6-5.6-3.5L5.4 19.3 7 13.3 2 9l6.1-.2z';
const LAYERS   = 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';
const FILE     = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8';
const SHIELD   = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';

const INDUSTRIES = [
  'Finance & FinTech',
  'Supply Chain & Logistics',
  'Healthcare & Life Sciences',
  'Retail & E-Commerce',
  'Technology & SaaS',
  'Manufacturing & Energy',
  'Professional Services / Consulting',
  'Other Enterprise',
];

const ROLES = [
  'Solution Architect / Enterprise Architect',
  'Business Analyst / Strategy Consultant',
  'Product Manager / Project Lead',
  'Engineering Director / CTO',
  'Operations / Process Improvement Lead',
  'Founder / Executive',
];

const GOALS = [
  {
    id: 'process-automation',
    title: 'Process Automation & SOP Digestion',
    desc: 'Turn messy text, transcripts, and manual ops docs into executable transformation plans.',
    icon: ZAP,
  },
  {
    id: 'solution-architecture',
    title: 'High-Level Architecture (HLD)',
    desc: 'Generate cloud topologies, data flows, tech stack choices, and integration boundaries.',
    icon: LAYERS,
  },
  {
    id: 'brd-proposals',
    title: 'Client-Ready BRD & Requirements',
    desc: 'Structured gap analysis, functional specs, non-functional constraints, and sign-off sections.',
    icon: FILE,
  },
  {
    id: 'effort-costing',
    title: 'Effort Estimates & Budget Bands',
    desc: 'Person-week breakdowns by sprint phase with high/mid/low budget approximations.',
    icon: TARGET,
  },
  {
    id: 'compliance-security',
    title: 'Risk & Security Mitigation',
    desc: 'Identify encryption requirements, access control protocols, and data privacy risks.',
    icon: SHIELD,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [workspaceName, setWorkspaceName] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [role, setRole] = useState(ROLES[0]);
  const [selectedGoals, setSelectedGoals] = useState(['process-automation', 'solution-architecture', 'brd-proposals']);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const u = getStoredUser();
      // If already set up, onboarding should never be shown anywhere -> forward to dashboard
      if (hasCompletedOnboarding(u)) {
        navigate('/dashboard', { replace: true });
        return;
      }

      if (u) {
        if (u.company) setWorkspaceName(u.company);
        else if (u.name) setWorkspaceName(`${u.name}'s Workspace`);
        if (u.industry) setIndustry(u.industry);
        if (u.roleTitle) setRole(u.roleTitle);
      }

      // Restore previously saved onboarding choices from cookies if available
      const savedCookieData = getOnboardingData();
      if (savedCookieData) {
        if (savedCookieData.workspaceName) setWorkspaceName(savedCookieData.workspaceName);
        if (savedCookieData.industry) setIndustry(savedCookieData.industry);
        if (savedCookieData.role) setRole(savedCookieData.role);
        if (savedCookieData.goals && savedCookieData.goals.length) setSelectedGoals(savedCookieData.goals);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [navigate]);

  const toggleGoal = (id) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleFinish = async (targetRoute = '/dashboard') => {
    setSaving(true);
    const token = getStoredToken();
    const user = getStoredUser();

    // 1. Store ALL onboarding data and completion flag in the cookies
    const onboardingPayload = {
      workspaceName: workspaceName.trim(),
      industry,
      role,
      goals: selectedGoals,
      userId: user?.id,
      userEmail: user?.email,
    };
    setOnboardingData(onboardingPayload);
    markOnboardingCompleted(user);

    // 2. Automatically grant cookie consent upon completing onboarding
    setCookieConsent('accepted');

    try {
      if (token) {
        // Sync onboarding completion to backend
        fetch('http://localhost:5000/api/auth/onboarding', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: true }),
        }).catch(() => {});

        if (workspaceName.trim()) {
          await fetch('http://localhost:5000/api/workspaces/current', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: workspaceName.trim() }),
          });
        }
      }

      navigate(targetRoute);
    } catch (err) {
      console.warn('Could not save onboarding preferences to server:', err.message);
      navigate(targetRoute);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.textH, display: 'flex', flexDirection: 'column' }}>
      <StyleTag />
      <Navbar />

      <main className="onboard-main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 20px 48px' }}>
        <div className="onboard-card" style={{
          width: '100%',
          maxWidth: 680,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: '40px 44px',
          boxShadow: '0 8px 36px rgba(99, 102, 241, 0.08), 0 2px 8px rgba(0,0,0,0.03)',
          animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        }}>

          {/* ══ Step Progress Bar ══ */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
                Step {step} of 3
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textM }}>
                {step === 1 && 'Workspace & Role'}
                {step === 2 && 'Transformation Goals'}
                {step === 3 && 'AI Workflow & Launch'}
              </span>
            </div>
            <div style={{ height: 6, background: C.border, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(step / 3) * 100}%`,
                background: C.grad,
                borderRadius: 10,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* ═════════ STEP 1: Workspace & Team Details ═════════ */}
          {step === 1 && (
            <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
              <div style={{ marginBottom: 26 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textH, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                  Let's set up your workspace
                </h1>
                <p style={{ fontSize: 14, color: C.textM, margin: 0, lineHeight: 1.6 }}>
                  Tell us about your organization so Compile can tailor terminology, compliance requirements, and architecture patterns.
                </p>
              </div>

              {/* Workspace Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                  Workspace / Organization Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Icon d={BUILDING} size={16} color={C.textSub} />
                  </div>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. Acme Innovations"
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: 10,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 14,
                      color: C.textH,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.primary)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  />
                </div>
              </div>

              {/* Industry Selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                  Primary Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    fontSize: 14,
                    color: C.textH,
                    background: C.surface,
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                  Your Primary Role
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Icon d={USER} size={16} color={C.textSub} />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: 10,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 14,
                      color: C.textH,
                      background: C.surface,
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.primary)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    background: C.grad,
                    color: '#fff',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: 11,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Continue to Goals <Icon d={ARROW} size={16} color="#fff" />
                </button>
              </div>
            </div>
          )}

          {/* ═════════ STEP 2: Primary Transformation Goals ═════════ */}
          {step === 2 && (
            <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
              <div style={{ marginBottom: 22 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textH, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                  What are you aiming to solve?
                </h1>
                <p style={{ fontSize: 14, color: C.textM, margin: 0, lineHeight: 1.6 }}>
                  Select all outputs you care about most. Compile prioritizes these sections when synthesizing inputs.
                </p>
              </div>

              {/* Multi-select Goal Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
                {GOALS.map((goal) => {
                  const active = selectedGoals.includes(goal.id);
                  return (
                    <div
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                        padding: '14px 16px',
                        borderRadius: 14,
                        border: `1.5px solid ${active ? C.primary : C.border}`,
                        background: active ? '#fafbff' : C.surface,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        boxShadow: active ? '0 2px 12px rgba(99, 102, 241, 0.08)' : 'none',
                      }}
                    >
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: active ? C.primaryLt : C.surfaceAlt,
                        border: `1px solid ${active ? '#c7d2fe' : C.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon d={goal.icon} size={18} color={active ? C.primary : C.textM} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: active ? C.primaryDk : C.textH }}>
                            {goal.title}
                          </h4>
                          <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            border: `1.5px solid ${active ? C.primary : C.borderMed}`,
                            background: active ? C.primary : C.surface,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {active && <Icon d={CHECK} size={12} color="#fff" />}
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: C.textM, lineHeight: 1.5 }}>
                          {goal.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: `1px solid ${C.border}`,
                    color: C.textB,
                    padding: '11px 20px',
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={selectedGoals.length === 0}
                  style={{
                    background: selectedGoals.length === 0 ? C.borderMed : C.grad,
                    color: '#fff',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: 11,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: selectedGoals.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  Next: See AI Flow <Icon d={ARROW} size={16} color="#fff" />
                </button>
              </div>
            </div>
          )}

          {/* ═════════ STEP 3: Workflow Tour & Launch ═════════ */}
          {step === 3 && (
            <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: C.grad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                }}>
                  <Icon d={SPARK} size={24} color="#fff" />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textH, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                  You're all set to transform chaos!
                </h1>
                <p style={{ fontSize: 14, color: C.textM, margin: 0, lineHeight: 1.6 }}>
                  Here is how Compile takes your inputs and creates commit-ready blueprints in seconds:
                </p>
              </div>

              {/* 3-Stage Visual Pipeline */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }} className="pipeline-steps-grid">
                {[
                  { n: '1', title: 'Drop Raw Chaos', desc: 'Paste notes, upload transcripts or messy SOPs.' },
                  { n: '2', title: 'AI Discovery Q&A', desc: 'Answers 4-5 questions to fill critical gaps.' },
                  { n: '3', title: 'Full Blueprint', desc: 'Live BRD, Architecture, and Cost Bands.' },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: '16px 14px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: C.primaryLt,
                      color: C.primaryDk,
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px',
                      border: '1px solid #c7d2fe',
                    }}>
                      {item.n}
                    </div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: 13, fontWeight: 700, color: C.textH }}>{item.title}</h5>
                    <p style={{ margin: 0, fontSize: 11.5, color: C.textM, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Workspace summary chip */}
              <div style={{
                background: '#f8fafc',
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '12px 18px',
                marginBottom: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span style={{ fontSize: 13, color: C.textM }}>
                  Workspace: <strong style={{ color: C.textH }}>{workspaceName || 'My Organization'}</strong>
                </span>
                <span style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>
                  {industry} · {role.split('/')[0]}
                </span>
              </div>

              {/* Final Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleFinish('/dashboard')}
                  style={{
                    background: C.grad,
                    color: '#fff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {saving ? 'Configuring Workspace...' : 'Launch Dashboard & Create Blueprint →'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.textSub,
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    ← Review previous step
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ══ Responsive Breakpoints ══ */}
      <style>{`
        @media (max-width: 640px) {
          .onboard-main { padding: 80px 14px 32px !important; }
          .onboard-card { padding: 28px 18px !important; border-radius: 18px !important; }
          .pipeline-steps-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
        }
      `}</style>
    </div>
  );
}
