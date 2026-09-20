import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getStoredToken } from '../utils/cookieUtils';

/* ─── Unified Theme Palette ─── */
const C = {
  bg:         '#f6f7fb',
  surface:    '#ffffff',
  surfaceAlt: '#f8fafc',
  border:     '#e2e8f0',
  borderMed:  '#cbd5e1',
  primary:    '#6366f1',
  primaryDk:  '#4f46e5',
  primaryLt:  '#eef2ff',
  accent:     '#06b6d4',
  accentLt:   '#ecfeff',
  success:    '#10b981',
  successLt:  '#d1fae5',
  warn:       '#f59e0b',
  warnLt:     '#fef3c7',
  textH:      '#0f172a',
  textB:      '#334155',
  textM:      '#64748b',
  textSub:    '#94a3b8',
  grad:       'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
};

/* ─── SVG Icons ─── */
function Icon({ d, size = 18, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

const CHECK_ICON = 'M20 6L9 17l-5-5';
const SPARK_ICON = 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83';
const CLOCK_ICON = 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2V7h2v9z';
const CODE_ICON  = 'M16 18l6-6-6-6M8 6l-6 6 6 6';
const DB_ICON    = 'M4 6c0 1.66 3.58 3 8 3s8-1.34 8-3-3.58-3-8-3-8 1.34-8 3zm0 6c0 1.66 3.58 3 8 3s8-1.34 8-3M4 18c0 1.66 3.58 3 8 3s8-1.34 8-3';
const FLOW_ICON  = 'M22 12h-4l-3 9L9 3l-3 9H2';
const PLAN_ICON  = 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2';

export default function GeneratingScreen() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  // Progress & SLA Timer
  const [progress, setProgress] = useState(12);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stageMessage, setStageMessage] = useState('Initializing multi-agent synthesis orchestration...');
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  // Agent State Tracker
  const [agentStatuses, setAgentStatuses] = useState({
    ba:       { name: 'Business Analysis Engine', status: 'running', detail: 'Formulating Executive BRD, Objectives & Gap Analysis', icon: SPARK_ICON },
    arch:     { name: 'Solution Architecture Builder', status: 'queued', detail: 'Architecting Cloud HLD, 3-Tier Topology & Security', icon: CODE_ICON },
    bpmn:     { name: 'Process Intelligence Designer', status: 'queued', detail: 'Synthesizing BPMN Workflows & Escalation Rules', icon: FLOW_ICON },
    db:       { name: 'Database & Integration Architect', status: 'queued', detail: 'Modeling Relational Schema & REST API Endpoints', icon: DB_ICON },
    planning: { name: 'AI Planning & Estimation Engine', status: 'queued', detail: 'Computing Phased Sprints & 3-Tier Cost Bands', icon: PLAN_ICON },
  });

  const addLog = (msg) => {
    const timeStr = (elapsedMs / 1000).toFixed(1) + 's';
    setLogs(prev => [...prev, `[${timeStr}] ${msg}`]);
  };

  // Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMs(prev => prev + 100);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Main Orchestration Trigger
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    if (!sessionId) {
      navigate('/dashboard');
      return;
    }

    let isMounted = true;
    addLog('Orchestrator online. Subscribing to parallel reasoning agents pool...');

    // Progress simulation steps while API executes
    const progressInterval = setInterval(() => {
      setProgress(old => {
        if (old < 32) {
          setStageMessage('Business Analysis Engine: Formulating Objectives & Scope Matrix...');
          setAgentStatuses(s => ({
            ...s,
            ba: { ...s.ba, status: 'running' },
            arch: { ...s.arch, status: 'running' },
          }));
          return old + 4;
        }
        if (old < 60) {
          setStageMessage('Solution Architecture: Generating HLD Topology & Tech Stack Rationale...');
          setAgentStatuses(s => ({
            ...s,
            ba: { ...s.ba, status: 'completed' },
            arch: { ...s.arch, status: 'running' },
            bpmn: { ...s.bpmn, status: 'running' },
          }));
          return old + 5;
        }
        if (old < 85) {
          setStageMessage('Process Intelligence & DB: Creating BPMN Gates & Relational Schemas...');
          setAgentStatuses(s => ({
            ...s,
            arch: { ...s.arch, status: 'completed' },
            bpmn: { ...s.bpmn, status: 'completed' },
            db: { ...s.db, status: 'running' },
            planning: { ...s.planning, status: 'running' },
          }));
          return old + 3;
        }
        return old;
      });
    }, 450);

    // Call Real Backend API Endpoint to execute parallel synthesis & store in MySQL
    fetch(`http://localhost:5000/api/sessions/${sessionId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        clearInterval(progressInterval);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Blueprint synthesis failed.');
        }
        return res.json();
      })
      .then(() => {
        if (!isMounted) return;
        setProgress(100);
        setIsCompleted(true);
        setStageMessage('✓ Master Blueprint & Architecture Persisted to MySQL!');
        setAgentStatuses(s => ({
          ba: { ...s.ba, status: 'completed' },
          arch: { ...s.arch, status: 'completed' },
          bpmn: { ...s.bpmn, status: 'completed' },
          db: { ...s.db, status: 'completed' },
          planning: { ...s.planning, status: 'completed' },
        }));
        addLog('All 5 engines completed with exit code 0.');
        addLog('Version snapshot v1.0 written to database.');
        addLog('Redirecting to Master Deliverables Hub...');

        // Smooth transition to Result Screen
        setTimeout(() => {
          navigate(`/session/${sessionId}/result`);
        }, 1200);
      })
      .catch((err) => {
        clearInterval(progressInterval);
        console.error(err);
        setErrorNotice(err.message || 'Error occurred during parallel blueprint generation.');
      });

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [sessionId, navigate]);

  const elapsedSeconds = (elapsedMs / 1000).toFixed(1);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.textH }}>
      <Navbar />

      <main className="generating-main" style={{ padding: '88px 24px 60px', maxWidth: 1080, margin: '0 auto' }}>
        
        {/* Top Header & Breadcrumb */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: C.textSub, marginBottom: 8 }}>
            <span style={{ cursor: 'pointer', color: C.primary, fontWeight: 600 }} onClick={() => navigate('/dashboard')}>
              Dashboard
            </span>
            <span>/</span>
            <span style={{ cursor: 'pointer', color: C.primary, fontWeight: 600 }} onClick={() => navigate(`/session/${sessionId}`)}>
              Discovery
            </span>
            <span>/</span>
            <span style={{ color: C.textB, fontWeight: 700 }}>Stage 3: Parallel AI Generation</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.textH, margin: '0 0 10px' }}>
            Compiling Solution Architecture Blueprint
          </h1>
          <p style={{ fontSize: 14.5, color: C.textM, margin: '0 auto', maxWidth: 620, lineHeight: 1.6 }}>
            Our 5 parallel multi-agent reasoning engines are analyzing your requirements, generating the BRD, designing the cloud topology, and modeling database schemas.
          </p>
        </div>

        {/* ─── Hero Progress & SLA Meter Card ─── */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '28px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          marginBottom: 28,
        }}>
          {/* Top Info Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: C.grad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
              }}>
                <Icon d={SPARK_ICON} size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.textH }}>
                  {stageMessage}
                </div>
                <div style={{ fontSize: 12.5, color: C.textSub }}>
                  Autonomous Parallel Reasoning Engines (Chaos2Commit 2026)
                </div>
              </div>
            </div>

            {/* SLA Timer Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: C.surfaceAlt,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '8px 16px',
            }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Target NFR SLA
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>
                  &lt; 30 Seconds
                </div>
              </div>
              <div style={{ width: 1, height: 26, background: C.border }} />
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Elapsed
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: elapsedSeconds > 25 ? C.warn : C.textH, fontFamily: 'monospace' }}>
                  {elapsedSeconds}s
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', position: 'relative', marginBottom: 12 }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: isCompleted ? C.success : C.grad,
              borderRadius: 999,
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textSub }}>
            <span>Input Context Normalized</span>
            <span style={{ fontWeight: 700, color: C.primary }}>{progress}% Complete</span>
            <span>Master Architecture Export</span>
          </div>

          {errorNotice && (
            <div style={{
              marginTop: 18,
              padding: '12px 16px',
              borderRadius: 10,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>{errorNotice}</span>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* ─── 5 Parallel Reasoning Agent Cards ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}>
          {Object.entries(agentStatuses).map(([key, agent]) => {
            const isDone = agent.status === 'completed';
            const isRunning = agent.status === 'running';

            let statusBg = C.surfaceAlt;
            let statusColor = C.textSub;
            let statusLabel = 'Queued';

            if (isDone) {
              statusBg = C.successLt;
              statusColor = '#065f46';
              statusLabel = '✓ Certified';
            } else if (isRunning) {
              statusBg = C.primaryLt;
              statusColor = C.primaryDk;
              statusLabel = 'Active Reasoning...';
            }

            return (
              <div
                key={key}
                style={{
                  background: C.surface,
                  border: `1.5px solid ${isDone ? '#a7f3d0' : isRunning ? '#c7d2fe' : C.border}`,
                  borderRadius: 16,
                  padding: '18px 20px',
                  boxShadow: isRunning ? '0 4px 16px rgba(99,102,241,0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isRunning && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: C.grad,
                  }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: isDone ? C.successLt : isRunning ? C.primaryLt : C.surfaceAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon d={isDone ? CHECK_ICON : agent.icon} size={16} color={isDone ? C.success : isRunning ? C.primary : C.textSub} />
                  </div>

                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: statusBg,
                    color: statusColor,
                  }}>
                    {statusLabel}
                  </span>
                </div>

                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: C.textH, margin: '0 0 6px' }}>
                  {agent.name}
                </h3>
                <p style={{ fontSize: 12.5, color: C.textM, margin: 0, lineHeight: 1.5 }}>
                  {agent.detail}
                </p>
              </div>
            );
          })}
        </div>

        {/* ─── Live Telemetry Log Stream ─── */}
        <div style={{
          background: '#0f172a',
          color: '#e2e8f0',
          borderRadius: 16,
          padding: '18px 22px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          fontFamily: 'monospace',
          fontSize: 12.5,
          lineHeight: 1.7,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: isCompleted ? '#10b981' : '#38bdf8', display: 'inline-block' }} />
              <span style={{ fontWeight: 700, color: '#94a3b8' }}>LIVE AGENT TELEMETRY FEED</span>
            </div>
            <span style={{ color: '#64748b', fontSize: 11 }}>Node.js / Express Workers</span>
          </div>

          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ color: log.includes('✓') || log.includes('Certified') ? '#34d399' : '#cbd5e1' }}>
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={() => navigate(`/session/${sessionId}`)}
            style={{
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: C.textM,
              cursor: 'pointer',
            }}
          >
            ← Cancel & Return to Discovery
          </button>

          <button
            onClick={() => navigate(`/session/${sessionId}/result`)}
            style={{
              background: C.primaryLt,
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 700,
              color: C.primary,
              cursor: 'pointer',
            }}
          >
            Skip to Blueprint Result Screen →
          </button>
        </div>

      </main>

      <style>{`
        @media (max-width: 768px) {
          .generating-main { padding: 80px 16px 48px !important; }
          .gen-bottom-actions { flex-direction: column !important; align-items: stretch !important; }
          .gen-bottom-actions button { width: 100% !important; justify-content: center !important; }
        }
        @media (max-width: 480px) {
          .generating-main { padding: 76px 12px 36px !important; }
        }
      `}</style>
    </div>
  );
}
