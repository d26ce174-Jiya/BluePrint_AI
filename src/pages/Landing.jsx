import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useTranslation } from '../utils/i18n';

/* ─── Icon paths ─── */
const ZAP = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
const FILE = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8';
const UPLOAD = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12';
const DOLLAR = 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';
const DOWNLOAD = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
const ARROW = 'M5 12h14M12 5l7 7-7 7';
const CHECK = 'M20 6 9 17l-5-5';
const SHIELD = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
const REFRESH = 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5';
const LAYERS = 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';
const SPARKLE = 'M12 3l1.9 5.8L20 9l-5 4.3 1.6 6-5.6-3.5L5.4 19.3 7 13.3 2 9l6.1-.2z';
const CLOCK = 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2';
const BRAIN = 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z';
const HOME = 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10';

/* ─── Shared visual primitives (match the app-wide glass / gradient system) ─── */
function Icon({ d, size = 18, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d={d} />
    </svg>
  );
}

function GradientText({ children, className = '' }) {
  return (
    <span className={`bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

function Chip({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full border text-indigo-700 bg-indigo-50 border-indigo-200 tracking-[0.2px] ${className}`}>
      {children}
    </span>
  );
}

function GlassCard({ children, hover = false, className = '' }) {
  return (
    <div className={`bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-2xl shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all duration-200 ${hover ? 'hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(99,102,241,0.12)] hover:border-indigo-200/70' : ''} ${className}`}>
      {children}
    </div>
  );
}

function Btn({ variant = 'gradient', size = 'md', className = '', children, ...rest }) {
  const sizes = {
    sm: 'px-3.5 py-1.5 text-[13px]',
    md: 'px-4.5 py-2.5 text-[14px]',
    lg: 'px-6 py-3 text-[15px]',
    xl: 'px-8 py-3.5 text-[16px]',
  };
  const variants = {
    gradient: 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white border-none shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(99,102,241,0.5)]',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40',
  };
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold cursor-pointer transition-all duration-200 whitespace-nowrap ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Scroll reveal hook ─── */
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

/* ─── Scroll-reveal wrapper ─── */
function Reveal({ children, delay = 0, fromY = 28 }) {
  const [ref, vis] = useReveal(0.08);
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : `translateY(${fromY}px)`,
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Animated counter ─── */
function Counter({ target, suffix = '' }) {
  const [ref, vis] = useReveal(0.4);
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!vis || done.current) return;
    done.current = true;
    const dur = 1400, step = target / (dur / 16);
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setN(Math.floor(cur));
      if (cur >= target) clearInterval(id);
    }, 16);
  }, [vis, target]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/* ─── Typewriter ─── */
function useTypewriter(words, speed = 65, pause = 2200) {
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
      if (!del && cIdx > word.length) { state.current.del = true; return pause; }
      if (del && cIdx > 0) {
        setDisplay(word.slice(0, cIdx - 1));
        state.current.cIdx -= 1;
        return speed / 2;
      }
      state.current = { wIdx: (wIdx + 1) % words.length, cIdx: 0, del: false };
      return 120;
    };
    const loop = () => {
      const id = setTimeout(() => { const n = tick(); setTimeout(loop, n); }, 80);
      return id;
    };
    const id = loop();
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return display;
}

/* ─── Animated terminal ─── */
const TERMINAL_LINES = [
  { delay: 0, color: '#94a3b8', text: '$ compile analyze --input "Q3_ops_SOP.pdf"' },
  { delay: 700, color: '#818cf8', text: '  ✦  Parsing 47 pages...' },
  { delay: 1300, color: '#94a3b8', text: '     12 process gaps found' },
  { delay: 1900, color: '#818cf8', text: '  ✦  Discovery mode — generating questions' },
  { delay: 2500, color: '#34d399', text: '  ?  Who owns the approval step?' },
  { delay: 3000, color: '#cbd5e1', text: '     > Finance Director + Compliance' },
  { delay: 3600, color: '#818cf8', text: '  ✦  Running BRD engine...' },
  { delay: 4200, color: '#818cf8', text: '  ✦  Designing solution architecture...' },
  { delay: 4800, color: '#818cf8', text: '  ✦  Estimating effort + costs...' },
  { delay: 5400, color: '#34d399', text: '  ✓  Done in 33.2s — blueprint ready' },
  { delay: 5900, color: '#94a3b8', text: '     → exporting PDF...' },
];

function Terminal() {
  const [vis, setVis] = useState(0);
  const refs = useRef([]);
  const run = useCallback(() => {
    refs.current.forEach(clearTimeout);
    setVis(0);
    refs.current = TERMINAL_LINES.map((l, i) =>
      setTimeout(() => setVis(i + 1), l.delay + 200)
    );
    refs.current.push(setTimeout(run, TERMINAL_LINES[TERMINAL_LINES.length - 1].delay + 3000));
  }, []);
  useEffect(() => { run(); return () => refs.current.forEach(clearTimeout); }, [run]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.25)] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800/70 border-b border-slate-700">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2.5 text-[11px] text-slate-400 font-mono">compile / terminal</span>
      </div>
      {/* Lines */}
      <div className="px-5 py-4 font-mono text-[12.5px] min-h-[260px] leading-7">
        {TERMINAL_LINES.map((l, i) => (
          <div
            key={i}
            style={{
              color: l.color,
              opacity: i < vis ? 1 : 0,
              transform: i < vis ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            {l.text}
          </div>
        ))}
        <span className="landing-blink inline-block w-[7px] h-[13px] bg-indigo-400 mt-1 rounded-[1px]" />
      </div>
    </div>
  );
}

/* ─── Output Preview tabs ─── */
function OutputPreview() {
  const [tab, setTab] = useState('BRD');
  const tabs = ['BRD', 'Architecture', 'Estimate'];
  return (
    <GlassCard className="overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200/70 bg-slate-50/80">
        {tabs.map(tabName => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={[
              'flex-1 py-3 text-[12.5px] font-bold transition-all duration-150 cursor-pointer border-none bg-transparent',
              tab === tabName
                ? 'text-indigo-600 border-b-2 border-indigo-500 -mb-px'
                : 'text-slate-400 hover:text-slate-700',
            ].join(' ')}
          >
            {tabName}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="p-5 min-h-[260px] text-sm">
        {tab === 'BRD' && (
          <div className="flex flex-col gap-3.5">
            <div>
              <p className="text-[10px] font-bold text-indigo-600 font-mono tracking-widest mb-1.5 uppercase">Objectives</p>
              <p className="text-slate-800 leading-relaxed">Automate procurement approvals — reduce cycle time from 14 days to &lt;48h.</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-600 font-mono tracking-widest mb-2 uppercase">Stakeholders</p>
              <div className="flex flex-wrap gap-1.5">
                {['Finance Director', 'Procurement', 'Compliance', 'IT Admin'].map(s => (
                  <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-50 border border-indigo-200">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-600 font-mono tracking-widest mb-2 uppercase">Gap Analysis</p>
              {[
                'Manual email approvals (no SLA enforcement)',
                'No audit trail for rejected POs',
                'Duplicate vendors across 3 systems',
              ].map(g => (
                <div key={g} className="flex items-start gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="text-slate-500 text-[13px]">{g}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 border-t border-slate-200/70 pt-3">⚠ AI advisory — review before use</p>
          </div>
        )}
        {tab === 'Architecture' && (
          <div className="flex flex-col gap-3.5">
            <div>
              <p className="text-[10px] font-bold text-indigo-600 font-mono tracking-widest mb-3 uppercase">Tech Stack</p>
              <div className="grid grid-cols-2 gap-2">
                {[['Frontend', 'React + Vite', 'Fast SPA'], ['Backend', 'Node.js', 'Async-native'], ['Database', 'PostgreSQL', 'ACID + audit'], ['Auth', 'JWT + OAuth2', 'SSO-ready']].map(([l, c, r]) => (
                  <div key={l} className="bg-slate-50 border border-slate-200/70 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-400">{l}</p>
                    <p className="font-bold text-[13px] text-slate-900">{c}</p>
                    <p className="text-[10px] text-slate-400">{r}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-3">
              <Icon d={SHIELD} size={14} color="#d97706" className="mt-0.5" />
              <p className="text-[12px] text-amber-800">AES-256 at rest, row-level Postgres security for multi-tenant isolation.</p>
            </div>
            <p className="text-[11px] text-slate-400 border-t border-slate-200/70 pt-3">⚠ AI advisory — review before use</p>
          </div>
        )}
        {tab === 'Estimate' && (
          <div className="flex flex-col gap-3.5">
            <div>
              <p className="text-[10px] font-bold text-indigo-600 font-mono tracking-widest mb-3 uppercase">Phase Breakdown</p>
              {[['Discovery & Design', 2, 25], ['Build core flows', 5, 62], ['QA & Testing', 1, 13], ['Deployment', 0.5, 6]].map(([ph, w, pct]) => (
                <div key={ph} className="mb-2.5">
                  <div className="flex justify-between text-[12px] mb-1 text-slate-800">
                    <span>{ph}</span><span className="text-slate-400">{w}w</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 border border-slate-200/70 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['$28k', '#065f46', '#ecfdf5', '#a7f3d0', 'Low'], ['$45k', '#78350f', '#fffbeb', '#fde68a', 'Mid'], ['$68k', '#7f1d1d', '#fef2f2', '#fca5a5', 'High']].map(([v, t, bg, bdr, l]) => (
                <div key={l} className="rounded-lg p-2.5 text-center border" style={{ background: bg, borderColor: bdr }}>
                  <p className="font-extrabold text-[18px]" style={{ color: t }}>{v}</p>
                  <p className="text-[10px] opacity-70" style={{ color: t }}>{l}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 border-t border-slate-200/70 pt-3">⚠ AI advisory — review before use</p>
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="flex justify-between items-center px-5 py-3 border-t border-slate-200/70 bg-slate-50/80">
        <div className="flex gap-2">
          {[['Regenerate', REFRESH], ['Edit', FILE]].map(([l, p]) => (
            <button key={l} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200/80 text-slate-500 text-[11px] font-semibold hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer">
              <Icon d={p} size={11} /> {l}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-white text-[11px] font-bold cursor-pointer bg-gradient-to-br from-indigo-500 to-cyan-500 hover:-translate-y-px transition-transform">
          <Icon d={DOWNLOAD} size={11} color="#fff" /> Export PDF
        </button>
      </div>
    </GlassCard>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, iconGrad, title, desc, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <GlassCard hover className="p-6 h-full">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
          style={{ background: iconGrad }}
        >
          <Icon d={icon} size={21} color="#fff" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-[14px] text-slate-500 leading-relaxed">{desc}</p>
      </GlassCard>
    </Reveal>
  );
}

/* ═══════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const typed = useTypewriter(['a blueprint.', 'an architecture.', 'a BRD.', 'a plan.'], 65, 2200);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-sans">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes landingBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes landingPulseSoft { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
        @keyframes landingWiggle { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
        .landing-blink { animation: landingBlink 1s step-end infinite; }
        .landing-pulse-soft { animation: landingPulseSoft 2.2s ease-in-out infinite; }
        .landing-wiggle { animation: landingWiggle 2.4s ease-in-out infinite; }
      `}</style>

      <Navbar />

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16 px-4 sm:px-6">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
          <div className="absolute top-1/4 right-0 w-[480px] h-[480px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-10 left-1/3 w-[360px] h-[360px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-[1120px] mx-auto w-full relative py-16">
          {/* Eyebrow badge */}
          <div className="flex justify-center mb-7" style={{ animation: 'fadeUp 0.8s ease 0.05s both' }}>
            <Chip>
              <Icon d={SPARKLE} size={12} color="#6366f1" />
              {t('landing.badge') || 'Chaos2Commit 2026 · AI Solution Builder'}
            </Chip>
          </div>

          {/* Headline */}
          <h1
            className="text-center font-black tracking-tight text-slate-900 mb-5"
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              animation: 'fadeUp 0.9s ease 0.1s both',
            }}
          >
            Turn messy business input
            <br />
            into{' '}
            <GradientText>{typed}</GradientText>
            <span className="landing-blink inline-block w-[3px] rounded-[2px] bg-indigo-500 align-middle" style={{ height: '0.82em', marginLeft: 3 }} />
          </h1>

          {/* Sub */}
          <p
            className="text-center text-slate-500 max-w-xl mx-auto leading-relaxed mb-2"
            style={{ fontSize: 'clamp(1rem, 2.2vw, 1.15rem)', animation: 'fadeUp 1s ease 0.18s both' }}
          >
            {t('landing.heroSub') || "Paste a SOP, upload a doc, or just describe the problem. Compile's AI consultant asks the right questions — then generates a BRD, solution architecture, and effort estimate your dev team can actually ship from."}
          </p>
          <p className="text-center text-slate-400 text-sm mb-9" style={{ animation: 'fadeUp 1s ease 0.24s both' }}>
            No consultants were harmed in the making of this. 🙃
          </p>

          {/* CTAs */}
          <div className="flex justify-center gap-3 flex-wrap mb-16" style={{ animation: 'fadeUp 1s ease 0.3s both' }}>
            <Btn variant="gradient" size="lg" onClick={() => navigate('/signup')}>
              {t('landing.ctaPrimary') || 'Start building free'}
              <Icon d={ARROW} size={17} color="#fff" />
            </Btn>
            <Btn variant="outline" size="lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('landing.ctaSecondary') || 'See how it works ↓'}
            </Btn>
          </div>

          {/* Hero visuals grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ animation: 'fadeUp 1.1s ease 0.4s both' }}>
            <div>
              <p className="text-[11px] text-slate-400 font-mono mb-2.5 text-center tracking-wide">
                // live processing demo
              </p>
              <Terminal />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-mono mb-2.5 text-center tracking-wide">
                // generated output (interactive)
              </p>
              <OutputPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          STATS BAR
      ══════════════════════════════ */}
      <section className="border-y border-slate-200/70 bg-slate-50/80 py-11 px-4 sm:px-6">
        <div className="max-w-[860px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: 6, suf: '', label: 'AI pipeline modules' },
            { n: 35, suf: 's', label: 'Avg compile time' },
            { n: 5, suf: '', label: 'MVP deliverables' },
            { n: 2, suf: '', label: 'Export formats' },
          ].map(({ n, suf, label }) => (
            <div key={label}>
              <p className="text-[2.1rem] font-extrabold text-indigo-600 mb-1 tracking-tight">
                <Counter target={n} suffix={suf} />
              </p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          FEATURES
      ══════════════════════════════ */}
      <section id="features" className="max-w-[1120px] mx-auto px-4 sm:px-6 py-20">
        <Reveal>
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold font-mono text-indigo-600 tracking-widest uppercase block mb-3">
              // five things compile does
            </span>
            <h2 className="font-extrabold tracking-tight text-slate-900 mb-4"
              style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', letterSpacing: '-0.025em' }}>
              Not magic —{' '}
              <GradientText>really fast AI.</GradientText>
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
              Five modules wired together into one pipeline. Raw input in, implementation-ready blueprint out.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard delay={0} icon={UPLOAD} iconGrad="linear-gradient(135deg,#6366f1,#4338ca)" title="Multi-format Intake" desc="PDF, DOCX, PPTX, free text, or meeting transcript. Drop it in — we parse it into a unified context object." />
          <FeatureCard delay={80} icon={BRAIN} iconGrad="linear-gradient(135deg,#06b6d4,#0e7490)" title="AI Discovery Consultant" desc="Finds what's missing before generating. Asks up to 7 targeted questions, then stops asking." />
          <FeatureCard delay={160} icon={FILE} iconGrad="linear-gradient(135deg,#8b5cf6,#06b6d4)" title="Auto-generated BRD" desc="Gap analysis, stakeholders, functional & non-functional requirements — structured for sign-off." />
          <FeatureCard delay={240} icon={HOME} iconGrad="linear-gradient(135deg,#6366f1,#8b5cf6)" title="Solution Architecture HLD" desc="Components, integrations, data flow, tech stack with rationale, and flagged security risks." />
          <FeatureCard delay={320} icon={DOLLAR} iconGrad="linear-gradient(135deg,#06b6d4,#6366f1)" title="Effort & Cost Estimate" desc="Phase-by-phase person-weeks and a low/mid/high cost band. Real enough to put in a proposal." />
          <FeatureCard delay={400} icon={DOWNLOAD} iconGrad="linear-gradient(135deg,#6366f1,#ec4899)" title="Edit, Regenerate & Export" desc="Edit any section, regenerate just one tab, track version history, export PDF or Word." />
        </div>
      </section>

      {/* ══════════════════════════════
          HOW IT WORKS
      ══════════════════════════════ */}
      <section id="howitworks" className="bg-slate-50/80 border-y border-slate-200/70 py-20 px-4 sm:px-6">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Steps */}
          <div>
            <Reveal>
              <span className="text-[11px] font-bold font-mono text-indigo-600 tracking-widest uppercase block mb-3">
                // four steps
              </span>
              <h2 className="font-extrabold tracking-tight text-slate-900 mb-10"
                style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', letterSpacing: '-0.025em' }}>
                From &ldquo;I have no idea where to start&rdquo; to{' '}
                <GradientText>commit-ready.</GradientText>
              </h2>
            </Reveal>

            {[
              { n: '01', title: 'Drop in your raw input', desc: 'SOP, transcript, bullet points, vague email chain — anything goes. No template required.' },
              { n: '02', title: 'AI asks smart questions', desc: 'Up to 7 targeted questions to fill context gaps. Answer inline or skip and it flags assumptions.' },
              { n: '03', title: 'Three outputs in parallel', desc: 'BRD, architecture, and estimate run simultaneously. Typical compile time under 45 seconds.' },
              { n: '04', title: 'Review, tweak, ship it', desc: 'Edit any section, regenerate one tab without touching the rest, export as PDF or Word.' },
            ].map(({ n, title, desc }, i) => (
              <Reveal key={n} delay={i * 80}>
                <div className="flex gap-5 mb-7">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-mono font-bold text-xs text-indigo-600">
                      {n}
                    </div>
                    {i < 3 && <div className="w-px flex-1 mt-2 bg-gradient-to-b from-indigo-200 to-transparent min-h-[28px]" />}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-bold text-[16px] text-slate-900 mb-1.5">{title}</h3>
                    <p className="text-slate-500 text-[14px] leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* MVP scope checklist */}
          <Reveal fromY={0}>
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-2xl p-7 shadow-[0_8px_28px_rgba(15,23,42,0.06)] lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-5">
                <div className="landing-pulse-soft w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[11px] font-bold font-mono text-slate-400 tracking-widest uppercase">
                  MVP Scope
                </span>
              </div>
              {[
                [true, 'AI Business Consultant'],
                [true, 'Business Analysis Engine (BRD)'],
                [true, 'Solution Architecture Builder'],
                [true, 'AI Planning Engine (estimates)'],
                [true, 'PDF + Word export'],
                [true, 'Version history per session'],
                [false, 'Multi-user collaboration'],
                [false, 'BPMN process diagrams'],
                [false, 'Wireframe generator'],
                [false, 'ER / API design module'],
              ].map(([done, label], i) => (
                <div key={i} className={`flex items-center gap-2.5 mb-2.5 ${done ? 'opacity-100' : 'opacity-45'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-100 border border-emerald-300' : 'bg-slate-100 border border-slate-200'}`}>
                    {done
                      ? <Icon d={CHECK} size={11} color="#10b981" />
                      : <span className="text-[10px] text-slate-400">–</span>
                    }
                  </div>
                  <span className="text-[13px] text-slate-800">
                    {label}
                    {!done && <span className="text-[10px] text-slate-400 ml-1.5 font-mono">(planned)</span>}
                  </span>
                </div>
              ))}
              <div className="mt-5 px-3.5 py-3 rounded-xl bg-indigo-50/80 border border-indigo-100">
                <p className="text-[12px] text-indigo-700 leading-relaxed">
                  💡 New modules plug in as pipeline stages — no rearchitecting needed.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════
          OUTPUT PREVIEW
      ══════════════════════════════ */}
      <section id="output" className="max-w-[1120px] mx-auto px-4 sm:px-6 py-20">
        <Reveal>
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold font-mono text-indigo-600 tracking-widest uppercase block mb-3">
              // click around — it's live
            </span>
            <h2 className="font-extrabold tracking-tight text-slate-900 mb-4"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.7rem)', letterSpacing: '-0.025em' }}>
              See the actual output.
            </h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
              Three tabs, three artefacts, one input. Every section independently editable and re-generatable.
            </p>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="max-w-[660px] mx-auto mb-8">
            <OutputPreview />
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: REFRESH, title: 'Regenerate any section', desc: 'Re-run just architecture without touching the BRD or estimate.' },
            { icon: LAYERS, title: 'Full version history', desc: 'Every generation snapshotted. Roll back at any point.' },
            { icon: SHIELD, title: 'Advisory by design', desc: 'AI outputs are labelled advisory. Your edits are never overwritten.' },
          ].map(({ icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <GlassCard className="p-6 text-center h-full">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                  <Icon d={icon} size={20} color="#6366f1" />
                </div>
                <h3 className="font-bold text-[14px] text-slate-900 mb-1.5">{title}</h3>
                <p className="text-slate-500 text-[13px] leading-relaxed">{desc}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          NFR STRIP
      ══════════════════════════════ */}
      <section className="bg-slate-50/80 border-t border-slate-200/70 py-14 px-4 sm:px-6">
        <div className="max-w-[1000px] mx-auto">
          <p className="text-center text-[11px] font-bold font-mono text-slate-400 tracking-widest uppercase mb-8">
            // performance commitments
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: CLOCK, val: '< 5s', sub: 'Discovery questions' },
              { icon: ZAP, val: '< 45s', sub: 'Full BRD + architecture' },
              { icon: SHIELD, val: 'HTTPS only', sub: 'Encrypted transit' },
              { icon: LAYERS, val: 'Extensible', sub: 'Modules as pipeline stages' },
            ].map(({ icon, val, sub }) => (
              <Reveal key={val}>
                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Icon d={icon} size={17} color="#6366f1" />
                  </div>
                  <div>
                    <p className="font-extrabold text-[17px] text-slate-900 tracking-tight">{val}</p>
                    <p className="text-slate-500 text-[12px]">{sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FINAL CTA
      ══════════════════════════════ */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[640px] h-[360px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)' }} />
        </div>
        <Reveal>
          <div className="relative max-w-xl mx-auto">
            <div className="landing-wiggle inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold mb-7">
              🚀 Built for Chaos2Commit 2026
            </div>
            <h2
              className="font-black text-slate-900 mb-5 tracking-tight"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.08 }}
            >
              Stop writing BRDs{' '}
              <GradientText>at 2am.</GradientText>
            </h2>
            <p className="text-slate-500 text-[1.05rem] leading-relaxed mb-10">
              Paste the problem. Let AI do the grunt work.<br />
              Ship the blueprint. Go home on time.
            </p>
            <Btn variant="gradient" size="xl" onClick={() => navigate('/signup')}>
              Start your first session — it's free
              <Icon d={ARROW} size={18} color="#fff" />
            </Btn>
            <p className="text-slate-400 text-[13px] mt-5">
              No credit card · No setup · First output in &lt; 2 min
            </p>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer className="border-t border-slate-200/70 bg-slate-50/80 px-4 sm:px-6 py-7">
        <div className="max-w-[1120px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-cyan-500">
              <Icon d={ZAP} size={13} color="#fff" />
            </div>
            <span className="font-bold text-[15px] text-slate-900">Compile</span>
            <span className="text-slate-400 text-sm">— Chaos2Commit 2026</span>
          </div>
          <p className="text-slate-400 text-[12px]">
            All AI outputs are advisory. Review before handing to your team.
          </p>
        </div>
      </footer>
    </div>
  );
}