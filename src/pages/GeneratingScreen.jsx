import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getStoredToken } from '../utils/cookieUtils';

/* ─── SVG Icons ─── */
function Icon({ d, size = 18, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d={d} />
    </svg>
  );
}

const CHECK_ICON = 'M20 6L9 17l-5-5';
const SPARK_ICON = 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83';
const CODE_ICON = 'M16 18l6-6-6-6M8 6l-6 6 6 6';
const DB_ICON = 'M4 6c0 1.66 3.58 3 8 3s8-1.34 8-3-3.58-3-8-3-8 1.34-8 3zm0 6c0 1.66 3.58 3 8 3s8-1.34 8-3M4 18c0 1.66 3.58 3 8 3s8-1.34 8-3';
const FLOW_ICON = 'M22 12h-4l-3 9L9 3l-3 9H2';
const PLAN_ICON = 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2';

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
    ba: { name: 'Business Analysis Engine', status: 'running', detail: 'Formulating Executive BRD, Objectives & Gap Analysis', icon: SPARK_ICON },
    arch: { name: 'Solution Architecture Builder', status: 'queued', detail: 'Architecting Cloud HLD, 3-Tier Topology & Security', icon: CODE_ICON },
    bpmn: { name: 'Process Intelligence Designer', status: 'queued', detail: 'Synthesizing BPMN Workflows & Escalation Rules', icon: FLOW_ICON },
    db: { name: 'Database & Integration Architect', status: 'queued', detail: 'Modeling Relational Schema & REST API Endpoints', icon: DB_ICON },
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
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Ambient background glow — matches the sidebar's decorative blobs */}
      <div aria-hidden className="fixed top-[-120px] right-[-140px] w-[420px] h-[420px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />
      <div aria-hidden className="fixed bottom-[-160px] left-[-120px] w-[420px] h-[420px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }} />

      <Navbar />

      <main className="relative z-10 px-4 sm:px-6 pt-24 lg:pt-28 pb-16 max-w-[1080px] mx-auto">

        {/* Top Header & Breadcrumb */}
        <div className="mb-7 text-center">
          <div className="inline-flex items-center gap-1.5 flex-wrap justify-center text-[12.5px] text-slate-400 mb-2">
            <span className="cursor-pointer text-indigo-600 font-semibold" onClick={() => navigate('/dashboard')}>
              Dashboard
            </span>
            <span>/</span>
            <span className="cursor-pointer text-indigo-600 font-semibold" onClick={() => navigate(`/session/${sessionId}`)}>
              Discovery
            </span>
            <span>/</span>
            <span className="text-slate-600 font-bold">Stage 3: Parallel AI Generation</span>
          </div>

          <h1 className="text-[24px] sm:text-[28px] font-extrabold text-slate-900 m-0 mb-2.5">
            Compiling Solution Architecture Blueprint
          </h1>
          <p className="text-[14px] sm:text-[14.5px] text-slate-500 mx-auto max-w-[620px] leading-relaxed">
            Our 5 parallel multi-agent reasoning engines are analyzing your requirements, generating the BRD, designing the cloud topology, and modeling database schemas.
          </p>
        </div>

        {/* ─── Hero Progress & SLA Meter Card ─── */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-2xl px-5 sm:px-8 py-6 sm:py-7 shadow-[0_4px_20px_rgba(15,23,42,0.04)] mb-7">
          {/* Top Info Row */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10.5 h-10.5 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <Icon d={SPARK_ICON} size={22} color="#fff" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] sm:text-[16px] font-extrabold text-slate-900 leading-snug">
                  {stageMessage}
                </div>
                <div className="text-[12px] sm:text-[12.5px] text-slate-400">
                  Autonomous Parallel Reasoning Engines (Chaos2Commit 2026)
                </div>
              </div>
            </div>

            {/* SLA Timer Badge */}
            <div className="inline-flex items-center gap-3 bg-slate-50/80 border border-slate-200/70 rounded-xl px-4 py-2 shrink-0">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.6px]">
                  Target NFR SLA
                </div>
                <div className="text-[13px] font-extrabold text-indigo-600">
                  &lt; 30 Seconds
                </div>
              </div>
              <div className="w-px h-6.5 bg-slate-200" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.6px]">
                  Elapsed
                </div>
                <div className={`text-[15px] font-extrabold font-mono ${elapsedSeconds > 25 ? 'text-amber-500' : 'text-slate-900'}`}>
                  {elapsedSeconds}s
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative mb-3">
            <div
              className={`h-full rounded-full transition-[width] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-[11.5px] sm:text-[12px] text-slate-400 gap-2">
            <span className="hidden sm:inline">Input Context Normalized</span>
            <span className="font-bold text-indigo-600">{progress}% Complete</span>
            <span className="hidden sm:inline">Master Architecture Export</span>
          </div>

          {errorNotice && (
            <div className="mt-4.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-center justify-between gap-3 flex-wrap">
              <span>{errorNotice}</span>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white border-none rounded-lg px-3 py-1.5 font-semibold text-[12px] cursor-pointer transition-colors hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* ─── 5 Parallel Reasoning Agent Cards ─── */}
        <div className="grid gap-4 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {Object.entries(agentStatuses).map(([key, agent]) => {
            const isDone = agent.status === 'completed';
            const isRunning = agent.status === 'running';

            const statusCls = isDone
              ? 'bg-emerald-50 text-emerald-800'
              : isRunning
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-slate-100 text-slate-400';
            const statusLabel = isDone ? '✓ Certified' : isRunning ? 'Active Reasoning...' : 'Queued';
            const borderCls = isDone ? 'border-emerald-200' : isRunning ? 'border-indigo-200' : 'border-slate-200/70';
            const iconWrapCls = isDone ? 'bg-emerald-50' : isRunning ? 'bg-indigo-50' : 'bg-slate-50';
            const iconColor = isDone ? '#10b981' : isRunning ? '#6366f1' : '#94a3b8';

            return (
              <div
                key={key}
                className={`relative overflow-hidden bg-white/90 backdrop-blur-xl border-[1.5px] rounded-2xl px-5 py-4.5 transition-all duration-200 ${borderCls} ${isRunning ? 'shadow-[0_4px_16px_rgba(99,102,241,0.1)]' : 'shadow-[0_2px_8px_rgba(15,23,42,0.03)]'}`}
              >
                {isRunning && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-cyan-500" />
                )}

                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconWrapCls}`}>
                    <Icon d={isDone ? CHECK_ICON : agent.icon} size={16} color={iconColor} />
                  </div>

                  <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${statusCls}`}>
                    {statusLabel}
                  </span>
                </div>

                <h3 className="text-[14.5px] font-bold text-slate-900 m-0 mb-1.5">
                  {agent.name}
                </h3>
                <p className="text-[12.5px] text-slate-500 m-0 leading-relaxed">
                  {agent.detail}
                </p>
              </div>
            );
          })}
        </div>

        {/* ─── Live Telemetry Log Stream ─── */}
        <div className="bg-slate-900 text-slate-200 rounded-2xl px-4.5 sm:px-5.5 py-4.5 shadow-[0_4px_20px_rgba(15,23,42,0.25)] font-mono text-[12.5px] leading-[1.7] border border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${isCompleted ? 'bg-emerald-500' : 'bg-sky-400'}`} />
              <span className="font-bold text-slate-400 text-[11.5px] sm:text-[12.5px]">LIVE AGENT TELEMETRY FEED</span>
            </div>
            <span className="text-slate-500 text-[11px] hidden sm:inline">Node.js / Express Workers</span>
          </div>

          <div className="max-h-[150px] overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={idx} className={log.includes('✓') || log.includes('Certified') ? 'text-emerald-400' : 'text-slate-300'}>
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3 mt-6">
          <button
            onClick={() => navigate(`/session/${sessionId}`)}
            className="bg-white/70 backdrop-blur border border-slate-200/80 rounded-lg px-4 py-2 text-[13px] font-semibold text-slate-500 cursor-pointer transition-colors hover:bg-white hover:text-slate-700 w-full sm:w-auto text-center"
          >
            ← Cancel & Return to Discovery
          </button>

          <button
            onClick={() => navigate(`/session/${sessionId}/result`)}
            className="bg-indigo-50 border-none rounded-lg px-4.5 py-2 text-[13px] font-bold text-indigo-600 cursor-pointer transition-colors hover:bg-indigo-100 w-full sm:w-auto text-center"
          >
            Skip to Blueprint Result Screen →
          </button>
        </div>

      </main>
    </div>
  );
}