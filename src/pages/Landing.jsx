import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

/* ─── keyframes injected once ─── */
const KEYFRAMES = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse-soft {
    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); }
    50%       { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400% center; }
    100% { background-position: 400% center; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes wiggle {
    0%, 100% { transform: rotate(-1.5deg); }
    50%       { transform: rotate(1.5deg); }
  }
  @keyframes scanBar {
    0%   { top: 0; opacity: 0.6; }
    80%  { opacity: 0.6; }
    100% { top: 100%; opacity: 0; }
  }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />;
}

/* ─── palette ─── */
const C = {
  bg:       '#f6f7fb',        // page background — very light blue-gray
  surface:  '#ffffff',        // cards / panels
  surfaceAlt:'#f0f2f9',       // subtle alt surface
  border:   '#e4e7f0',        // dividers
  borderMed:'#d0d4e8',        // medium borders
  primary:  '#6366f1',        // indigo
  primaryDk:'#4f46e5',        // darker indigo
  primaryLt:'#eef2ff',        // light indigo tint
  accent:   '#06b6d4',        // cyan
  accentLt: '#ecfeff',
  success:  '#10b981',
  successLt:'#d1fae5',
  warn:     '#f59e0b',
  warnLt:   '#fef3c7',
  textH:    '#0f172a',        // headings — near black
  textB:    '#334155',        // body
  textM:    '#64748b',        // muted
  textSub:  '#94a3b8',        // very muted
  grad:     'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
  gradSoft: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)',
};

/* ─── icon helper ─── */
function Icon({ d, size = 20, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      <path d={d} />
    </svg>
  );
}
const ZAP      = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
const FILE     = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8';
const UPLOAD   = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12';
const DOLLAR   = 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';
const DOWNLOAD = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
const ARROW    = 'M5 12h14M12 5l7 7-7 7';
const CHECK    = 'M20 6 9 17l-5-5';
const SHIELD   = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
const REFRESH  = 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5';
const LAYERS   = 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';
const MENU     = 'M4 6h16M4 12h16M4 18h16';
const CLOSE    = 'M18 6 6 18M6 6l12 12';
const BRAIN    = 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z';
const HOME     = 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10';
const CLOCK    = 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2';
const SPARKLE  = 'M12 3l1.9 5.8L20 9l-5 4.3 1.6 6-5.6-3.5L5.4 19.3 7 13.3 2 9l6.1-.2z';

/* ─── scroll reveal hook ─── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

/* ─── typewriter ─── */
function useTypewriter(words, speed = 65, pause = 2000) {
  const [display, setDisplay] = useState('');
  const state = useRef({ wIdx: 0, cIdx: 0, del: false });
  useEffect(() => {
    const tick = () => {
      const { wIdx, cIdx, del } = state.current;
      const word = words[wIdx];
      if (!del && cIdx <= word.length) {
        setDisplay(word.slice(0, cIdx));
        state.current.cIdx += 1;
        return del ? speed / 2 : speed;
      }
      if (!del && cIdx > word.length) {
        state.current.del = true;
        return pause;
      }
      if (del && cIdx > 0) {
        setDisplay(word.slice(0, cIdx - 1));
        state.current.cIdx -= 1;
        return speed / 2;
      }
      state.current = { wIdx: (wIdx + 1) % words.length, cIdx: 0, del: false };
      return 120;
    };
    let id;
    const schedule = () => { id = setTimeout(() => { const next = tick(); schedule(); }, next); };
    // eslint-disable-next-line prefer-const
    let next = speed;
    const loop = () => { id = setTimeout(() => { const n = tick(); id = setTimeout(loop, n); }, next); };
    loop();
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return display;
}

/* ─── animated counter (scroll-triggered) ─── */
function Counter({ target, suffix = '' }) {
  const [ref, vis] = useReveal(0.5);
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!vis || done.current) return;
    done.current = true;
    const dur = 1500, step = target / (dur / 16);
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setN(Math.floor(cur));
      if (cur >= target) clearInterval(id);
    }, 16);
  }, [vis, target]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/* ─── card tilt ─── */
function TiltCard({ children, style = {} }) {
  const ref = useRef(null);
  const move = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) scale(1.02)`;
  }, []);
  const leave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'perspective(700px) rotateY(0) rotateX(0) scale(1)';
  }, []);
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave}
      style={{ transition: 'transform 0.18s ease', willChange: 'transform', ...style }}>
      {children}
    </div>
  );
}

/* ─── scroll reveal wrapper ─── */
function Reveal({ children, delay = 0, fromX = 0, fromY = 32 }) {
  const [ref, vis] = useReveal(0.1);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translate(0,0)' : `translate(${fromX}px,${fromY}px)`,
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ─── terminal (light-styled) ─── */
const LINES = [
  { delay: 0,    color: C.textM,    text: '$ compile analyze --input "Q3_ops_SOP.pdf"' },
  { delay: 700,  color: C.primary,  text: '  ✦  Parsing 47 pages...' },
  { delay: 1300, color: C.textSub,  text: '     12 process gaps found' },
  { delay: 1900, color: C.primary,  text: '  ✦  Discovery mode — generating questions' },
  { delay: 2500, color: '#0e9f6e',  text: '  ?  Who owns the approval step?' },
  { delay: 3000, color: C.textB,    text: '     > Finance Director + Compliance' },
  { delay: 3600, color: C.primary,  text: '  ✦  Running BRD engine...' },
  { delay: 4200, color: C.primary,  text: '  ✦  Designing solution architecture...' },
  { delay: 4800, color: C.primary,  text: '  ✦  Estimating effort + costs...' },
  { delay: 5400, color: C.success,  text: '  ✓  Done in 23.4s — blueprint ready' },
  { delay: 5900, color: C.textSub,  text: '     → exporting PDF...' },
];

function Terminal() {
  const [vis, setVis] = useState(0);
  const refs = useRef([]);
  const run = useCallback(() => {
    refs.current.forEach(clearTimeout);
    setVis(0);
    refs.current = LINES.map((l, i) => setTimeout(() => setVis(i + 1), l.delay + 200));
    refs.current.push(setTimeout(run, LINES[LINES.length - 1].delay + 2800));
  }, []);
  useEffect(() => { run(); return () => refs.current.forEach(clearTimeout); }, [run]);

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fca5a5' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fcd34d' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6ee7b7' }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: C.textSub, fontFamily: 'monospace' }}>compile / terminal</span>
      </div>
      <div style={{ padding: '18px 20px', fontFamily: 'monospace', fontSize: 12.5, minHeight: 268, lineHeight: 1.75 }}>
        {LINES.map((l, i) => (
          <div key={i} style={{
            color: l.color,
            opacity: i < vis ? 1 : 0,
            transform: i < vis ? 'translateY(0)' : 'translateY(5px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}>{l.text}</div>
        ))}
        <span style={{ display: 'inline-block', width: 7, height: 13, background: C.primary, marginTop: 4, animation: 'blink 1s step-end infinite', borderRadius: 1 }} />
      </div>
    </div>
  );
}

/* ─── output tabs (light) ─── */
function OutputPreview() {
  const [tab, setTab] = useState('BRD');
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
        {['BRD', 'Architecture', 'Estimate'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '11px 8px', fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer',
            color: tab === t ? C.primary : C.textM,
            background: tab === t ? C.surface : 'transparent',
            borderBottom: tab === t ? `2px solid ${C.primary}` : '2px solid transparent',
            transition: 'all 0.2s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: 20, fontSize: 13, minHeight: 260 }}>
        {tab === 'BRD' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ color: C.primary, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, marginBottom: 5, fontWeight: 700 }}>OBJECTIVES</p>
              <p style={{ color: C.textB, lineHeight: 1.65 }}>Automate procurement approvals — reduce cycle time from 14 days to &lt;48h.</p>
            </div>
            <div>
              <p style={{ color: C.primary, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, marginBottom: 7, fontWeight: 700 }}>STAKEHOLDERS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Finance Director', 'Procurement', 'Compliance', 'IT Admin'].map((s) => (
                  <span key={s} style={{ padding: '3px 10px', borderRadius: 20, background: C.primaryLt, border: `1px solid #c7d2fe`, color: C.primaryDk, fontSize: 11, fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ color: C.primary, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, marginBottom: 7, fontWeight: 700 }}>GAP ANALYSIS</p>
              {['Manual email approvals (no SLA enforcement)', 'No audit trail for rejected POs', 'Duplicate vendors across 3 systems'].map((g) => (
                <div key={g} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.warn, marginTop: 5, flexShrink: 0 }} />
                  <span style={{ color: C.textM }}>{g}</span>
                </div>
              ))}
            </div>
            <p style={{ color: C.textSub, fontSize: 11, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>⚠ AI advisory — review before use</p>
          </div>
        )}
        {tab === 'Architecture' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ color: C.primary, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>TECH STACK</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['Frontend', 'React + Vite', 'Fast SPA'], ['Backend', 'Node.js', 'Async-native'], ['Database', 'PostgreSQL', 'ACID + audit'], ['Auth', 'JWT + OAuth2', 'SSO-ready']].map(([l, c, r]) => (
                  <div key={l} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 11px' }}>
                    <p style={{ color: C.textSub, fontSize: 10 }}>{l}</p>
                    <p style={{ color: C.textH, fontWeight: 700, fontSize: 13 }}>{c}</p>
                    <p style={{ color: C.textSub, fontSize: 10 }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: C.warnLt, borderRadius: 8, padding: '10px 12px', border: `1px solid #fde68a` }}>
              <Icon d={SHIELD} size={14} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#92400e', fontSize: 12 }}>AES-256 at rest, row-level Postgres security for multi-tenant isolation.</p>
            </div>
            <p style={{ color: C.textSub, fontSize: 11, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>⚠ AI advisory — review before use</p>
          </div>
        )}
        {tab === 'Estimate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ color: C.primary, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>PHASE BREAKDOWN</p>
              {[['Discovery & Design', 2, 25], ['Build core flows', 5, 62], ['QA & Testing', 1, 13], ['Deployment', 0.5, 6]].map(([ph, w, pct]) => (
                <div key={ph} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: C.textB }}>
                    <span>{ph}</span><span style={{ color: C.textSub }}>{w}w</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: C.grad }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['$28k', C.success, '#065f46', C.successLt, '#a7f3d0', 'Low'], ['$45k', C.warn, '#92400e', C.warnLt, '#fde68a', 'Mid'], ['$68k', '#ef4444', '#7f1d1d', '#fee2e2', '#fca5a5', 'High']].map(([v, col, textCol, bg, bdr, l]) => (
                <div key={l} style={{ background: bg, border: `1px solid ${bdr}`, borderRadius: 9, padding: '10px 6px', textAlign: 'center' }}>
                  <p style={{ color: textCol, fontWeight: 800, fontSize: 18 }}>{v}</p>
                  <p style={{ color: textCol, fontSize: 10, opacity: 0.7 }}>{l}</p>
                </div>
              ))}
            </div>
            <p style={{ color: C.textSub, fontSize: 11, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>⚠ AI advisory — review before use</p>
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderTop: `1px solid ${C.border}`, background: C.surfaceAlt }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['Regenerate', REFRESH], ['Edit', FILE]].map(([label, path]) => (
            <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, background: C.surface, border: `1px solid ${C.borderMed}`, color: C.textM, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
              <Icon d={path} size={11} color={C.textM} /> {label}
            </button>
          ))}
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 7, background: C.grad, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          <Icon d={DOWNLOAD} size={11} color="#fff" /> Export PDF
        </button>
      </div>
    </div>
  );
}

/* ─── feature card ─── */
function FeatureCard({ icon, iconBg, title, desc, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={delay}>
      <TiltCard style={{
        background: hov ? '#fff' : C.surface,
        border: `1px solid ${hov ? '#c7d2fe' : C.border}`,
        borderRadius: 16, padding: 24, cursor: 'default',
        boxShadow: hov ? '0 8px 32px rgba(99,102,241,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.25s ease',
      }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon d={icon} size={20} color="#fff" />
        </div>
        <h3 style={{ color: C.textH, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</h3>
        <p style={{ color: C.textM, fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
      </TiltCard>
    </Reveal>
  );
}



/* ════════════════════════
   MAIN PAGE
════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const typed = useTypewriter(['a blueprint.', 'an architecture.', 'a BRD.', 'a plan.'], 65, 2200);

  /* subtle mouse parallax on hero illustration */
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fn = (e) => setMouse({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    window.addEventListener('mousemove', fn, { passive: true });
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.textH, overflowX: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <StyleTag />
      <Navbar />

      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 24px 72px' }}>
        {/* soft indigo blob background */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: 680, height: 680, top: '-12%', left: '-8%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 68%)',
            transform: `translate(${mouse.x * -24}px, ${mouse.y * -24}px)`,
            transition: 'transform 1s ease',
          }} />
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: 480, height: 480, top: '15%', right: '-5%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 68%)',
            transform: `translate(${mouse.x * 18}px, ${mouse.y * 18}px)`,
            transition: 'transform 1s ease',
          }} />
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: 380, height: 380, bottom: '8%', left: '38%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 68%)',
          }} />
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', position: 'relative' }}>
          {/* eyebrow badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              borderRadius: 24, background: C.primaryLt, border: '1px solid #c7d2fe',
              color: C.primaryDk, fontSize: 13, fontWeight: 500,
              animation: 'fadeUp 0.8s ease forwards', opacity: 0,
            }}>
              <Icon d={SPARKLE} size={13} color={C.primary} />
              Chaos2Commit 2026 · AI Solution Builder
            </div>
          </div>

          {/* headline */}
          <h1 style={{
            textAlign: 'center', fontSize: 'clamp(2.4rem,6vw,4.4rem)',
            fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2.5px',
            color: C.textH, marginBottom: 18,
            animation: 'fadeUp 0.9s ease 0.08s forwards', opacity: 0,
          }}>
            Turn messy business input
            <br />
            into{' '}
            <span style={{
              background: C.grad,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {typed}
            </span>
            <span style={{
              display: 'inline-block', width: 3, height: '0.82em', verticalAlign: 'middle',
              background: C.primary, marginLeft: 3, borderRadius: 2,
              animation: 'blink 0.9s step-end infinite',
            }} />
          </h1>

          {/* sub */}
          <p style={{
            textAlign: 'center', color: C.textM, fontSize: 'clamp(1rem,2.3vw,1.15rem)',
            maxWidth: 600, margin: '0 auto 14px', lineHeight: 1.75,
            animation: 'fadeUp 1s ease 0.18s forwards', opacity: 0,
          }}>
            Paste a SOP, upload a doc, or just describe the problem.
            Compile's AI consultant asks the right questions — then generates a BRD,
            solution architecture, and effort estimate your dev team can actually ship from.
          </p>

          <p style={{
            textAlign: 'center', color: C.textSub, fontSize: 13, marginBottom: 36,
            animation: 'fadeUp 1s ease 0.22s forwards', opacity: 0,
          }}>
            No consultants were harmed in the making of this. 🙃
          </p>

          {/* CTAs */}
          <div className="hero-cta-wrap" style={{
            display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap',
            animation: 'fadeUp 1s ease 0.28s forwards', opacity: 0,
          }}>
            <button
              onClick={() => navigate('/signup')}
              className="hero-cta-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 11, background: C.grad, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.35)', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)'; }}>
              Start building free
              <Icon d={ARROW} size={17} color="#fff" />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="hero-cta-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 11, background: C.surface, border: `1px solid ${C.borderMed}`, color: C.textB, fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMed; e.currentTarget.style.color = C.textB; }}>
              See how it works ↓
            </button>
          </div>

          {/* hero visuals */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 56,
            animation: 'fadeUp 1.1s ease 0.38s forwards', opacity: 0,
          }} className="hero-grid">
            <div>
              <p style={{ fontSize: 11, color: C.textSub, fontFamily: 'monospace', marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 }}>// live processing demo</p>
              <Terminal />
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.textSub, fontFamily: 'monospace', marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 }}>// generated output (interactive)</p>
              <OutputPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ══ */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface, padding: '44px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }} className="stats-grid">
          {[
            { n: 6,    suf: '',  label: 'AI pipeline modules' },
            { n: 35,   suf: 's', label: 'Avg compile time' },
            { n: 5,    suf: '',  label: 'MVP deliverables' },
            { n: 2,    suf: '',  label: 'Export formats' },
          ].map(({ n, suf, label }) => (
            <div key={label}>
              <p style={{ fontSize: 34, fontWeight: 800, color: C.primary, marginBottom: 4 }}>
                <Counter target={n} suffix={suf} />
              </p>
              <p style={{ color: C.textM, fontSize: 13 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ display: 'inline-block', fontSize: 12, fontFamily: 'monospace', color: C.primary, marginBottom: 10, letterSpacing: 1, fontWeight: 600 }}>// five things compile does</span>
              <h2 style={{ fontSize: 'clamp(1.9rem,4vw,2.9rem)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 12, color: C.textH }}>
                Not magic — just{' '}
                <span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  really fast AI.
                </span>
              </h2>
              <p style={{ color: C.textM, maxWidth: 520, margin: '0 auto', lineHeight: 1.7, fontSize: 15 }}>
                Five modules wired together into one pipeline. Raw input in, implementation-ready blueprint out.
              </p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }} className="features-grid">
            <FeatureCard delay={0}   icon={UPLOAD}   iconBg="linear-gradient(135deg,#6366f1,#4338ca)" title="Multi-format Intake"        desc="PDF, DOCX, PPTX, free text, or meeting transcript. Drop it in — we parse it into a unified context object." />
            <FeatureCard delay={80}  icon={BRAIN}    iconBg="linear-gradient(135deg,#06b6d4,#0e7490)" title="AI Discovery Consultant"    desc="Finds what's missing before generating. Asks up to 7 targeted questions, then stops asking." />
            <FeatureCard delay={160} icon={FILE}     iconBg="linear-gradient(135deg,#8b5cf6,#06b6d4)" title="Auto-generated BRD"         desc="Gap analysis, stakeholders, functional & non-functional requirements — structured for sign-off." />
            <FeatureCard delay={240} icon={HOME}     iconBg="linear-gradient(135deg,#6366f1,#8b5cf6)" title="Solution Architecture HLD"  desc="Components, integrations, data flow, tech stack with rationale, and flagged security risks." />
            <FeatureCard delay={320} icon={DOLLAR}   iconBg="linear-gradient(135deg,#06b6d4,#6366f1)" title="Effort & Cost Estimate"     desc="Phase-by-phase person-weeks and a low/mid/high cost band. Real enough to put in a proposal." />
            <FeatureCard delay={400} icon={DOWNLOAD} iconBg="linear-gradient(135deg,#6366f1,#ec4899)" title="Edit, Regenerate & Export"  desc="Edit any section, regenerate just one tab, track version history, export PDF or Word." />
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="howitworks" style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '96px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }} className="how-grid">
          {/* steps */}
          <div>
            <Reveal>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.primary, letterSpacing: 1, fontWeight: 600 }}>// four steps</span>
              <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.8px', margin: '12px 0 40px', lineHeight: 1.2, color: C.textH }}>
                From "I have no idea where to start" to{' '}
                <span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  commit-ready.
                </span>
              </h2>
            </Reveal>
            {[
              { n: '01', title: 'Drop in your raw input', desc: 'SOP, transcript, bullet points, vague email chain — anything goes. No template required.' },
              { n: '02', title: 'AI asks smart questions', desc: 'Up to 7 targeted questions to fill context gaps. Answer inline or skip and it flags assumptions.' },
              { n: '03', title: 'Three outputs in parallel', desc: 'BRD, architecture, and estimate run simultaneously. Typical compile time under 45 seconds.' },
              { n: '04', title: 'Review, tweak, ship it', desc: 'Edit any section, regenerate one tab without touching the rest, export as PDF or Word.' },
            ].map(({ n, title, desc }, i) => (
              <Reveal key={n} delay={i * 90}>
                <div style={{ display: 'flex', gap: 18, marginBottom: 28 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.primaryLt, border: `1.5px solid #c7d2fe`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: C.primary }}>
                      {n}
                    </div>
                    {i < 3 && <div style={{ width: 1, height: 28, background: `linear-gradient(to bottom, #c7d2fe, transparent)`, margin: '6px auto' }} />}
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    <h3 style={{ color: C.textH, fontWeight: 700, fontSize: 16, marginBottom: 5 }}>{title}</h3>
                    <p style={{ color: C.textM, fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* scope checklist */}
          <Reveal fromX={32} fromY={0}>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(99,102,241,0.06)', position: 'sticky', top: 86 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary, animation: 'pulse-soft 2s infinite' }} />
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.textSub, letterSpacing: 1, fontWeight: 600 }}>MVP SCOPE</span>
              </div>
              {[
                [true,  'AI Business Consultant'],
                [true,  'Business Analysis Engine (BRD)'],
                [true,  'Solution Architecture Builder'],
                [true,  'AI Planning Engine (estimates)'],
                [true,  'PDF + Word export'],
                [true,  'Version history per session'],
                [false, 'Multi-user collaboration'],
                [false, 'BPMN process diagrams'],
                [false, 'Wireframe generator'],
                [false, 'ER / API design module'],
              ].map(([done, label], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11, opacity: done ? 1 : 0.5 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? C.successLt : C.surfaceAlt,
                    border: done ? '1px solid #6ee7b7' : `1px solid ${C.border}`,
                  }}>
                    {done
                      ? <Icon d={CHECK} size={11} color={C.success} />
                      : <span style={{ fontSize: 10, color: C.textSub }}>–</span>}
                  </div>
                  <span style={{ fontSize: 13, color: done ? C.textB : C.textSub }}>
                    {label}
                    {!done && <span style={{ fontSize: 10, color: C.textSub, marginLeft: 5, fontFamily: 'monospace' }}>(planned)</span>}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 10, background: C.primaryLt, border: '1px solid #c7d2fe' }}>
                <p style={{ color: C.primaryDk, fontSize: 12, lineHeight: 1.65 }}>
                  💡 New modules plug in as pipeline stages — no rearchitecting needed.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ OUTPUT PREVIEW ══ */}
      <section id="output" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.primary, letterSpacing: 1, fontWeight: 600 }}>// click around — it's live</span>
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.7rem)', fontWeight: 800, letterSpacing: '-0.8px', margin: '12px 0 12px', color: C.textH }}>See the actual output.</h2>
              <p style={{ color: C.textM, maxWidth: 460, margin: '0 auto', lineHeight: 1.7, fontSize: 15 }}>
                Three tabs, three artefacts, one input. Every section independently editable and re-generatable.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div style={{ maxWidth: 660, margin: '0 auto' }}><OutputPreview /></div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 32 }} className="trio-grid">
            {[
              { icon: REFRESH, title: 'Regenerate any section', desc: 'Re-run just architecture without touching the BRD or estimate.' },
              { icon: LAYERS,  title: 'Full version history',   desc: 'Every generation snapshotted. Roll back at any point.' },
              { icon: SHIELD,  title: 'Advisory by design',     desc: 'AI outputs are labelled advisory. Your edits are never overwritten.' },
            ].map(({ icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="trio-card" style={{ textAlign: 'center', padding: '22px 16px', borderRadius: 13, background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Icon d={icon} size={20} color={C.primary} />
                  </div>
                  <h3 style={{ color: C.textH, fontWeight: 700, fontSize: 14, marginBottom: 5 }}>{title}</h3>
                  <p style={{ color: C.textM, fontSize: 13, lineHeight: 1.65 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ NFR STRIP ══ */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: '52px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontFamily: 'monospace', color: C.textSub, marginBottom: 32, letterSpacing: 1, fontWeight: 600 }}>// performance commitments</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }} className="nfr-grid">
            {[
              { icon: CLOCK,  val: '< 5s',      sub: 'Discovery questions' },
              { icon: ZAP,    val: '< 45s',     sub: 'Full BRD + architecture' },
              { icon: SHIELD, val: 'HTTPS only', sub: 'Encrypted transit' },
              { icon: LAYERS, val: 'Extensible', sub: 'Modules as pipeline stages' },
            ].map(({ icon, val, sub }) => (
              <Reveal key={val}>
                <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: C.primaryLt, border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon d={icon} size={17} color={C.primary} />
                  </div>
                  <div>
                    <p style={{ color: C.textH, fontWeight: 800, fontSize: 17 }}>{val}</p>
                    <p style={{ color: C.textM, fontSize: 12 }}>{sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section style={{ padding: '110px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 640, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)' }} />
        </div>
        <Reveal>
          <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 24, background: C.primaryLt, border: '1px solid #c7d2fe', color: C.primaryDk, fontSize: 13, fontWeight: 600, marginBottom: 24, animation: 'wiggle 3s ease-in-out infinite' }}>
              🚀 Built for Chaos2Commit 2026
            </div>
            <h2 style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, color: C.textH, marginBottom: 18 }}>
              Stop writing BRDs{' '}
              <span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                at 2am.
              </span>
            </h2>
            <p style={{ color: C.textM, fontSize: 17, lineHeight: 1.75, marginBottom: 40 }}>
              Paste the problem. Let AI do the grunt work.
              Ship the blueprint. Go home on time.
            </p>
            <button
              className="final-cta-btn"
              onClick={() => navigate('/signup')}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '15px 34px', borderRadius: 13, background: C.grad, border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 28px rgba(99,102,241,0.4)', transition: 'all 0.2s', maxWidth: '100%', boxSizing: 'border-box' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(99,102,241,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.4)'; }}>
              Start your first session — it's free
              <Icon d={ARROW} size={18} color="#fff" />
            </button>
            <p style={{ marginTop: 18, color: C.textSub, fontSize: 13 }}>
              No credit card · No setup · First output in &lt; 2 min
            </p>
          </div>
        </Reveal>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface, padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ZAP} size={13} color="#fff" />
            </div>
            <span style={{ color: C.textH, fontWeight: 700, fontSize: 15 }}>Compile</span>
            <span style={{ color: C.textSub, fontSize: 13 }}>— Chaos2Commit 2026</span>
          </div>
          <p style={{ color: C.textSub, fontSize: 12 }}>
            All AI outputs are advisory. Review before handing to your team.
          </p>
        </div>
      </footer>

      {/* responsive breakpoints */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid     { grid-template-columns: 1fr !important; }
          .how-grid      { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .nfr-grid      { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .trio-grid     { grid-template-columns: 1fr !important; gap: 16px !important; }
          .trio-card     { padding: 22px 20px !important; }
        }
        @media (max-width: 640px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .how-grid      { gap: 32px !important; }
          .hero-cta-wrap { flex-direction: column !important; width: 100% !important; }
          .hero-cta-btn  { width: 100% !important; justify-content: center !important; }
          .final-cta-btn { width: 100% !important; padding: 13px 18px !important; font-size: 15px !important; }
          .trio-grid     { grid-template-columns: 1fr !important; gap: 14px !important; }
          .stats-grid    { grid-template-columns: 1fr 1fr !important; gap: 14px !important; }
          .nfr-grid      { grid-template-columns: 1fr !important; }
          section        { padding-left: 16px !important; padding-right: 16px !important; }
        }
        @media (max-width: 420px) {
          .stats-grid    { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
