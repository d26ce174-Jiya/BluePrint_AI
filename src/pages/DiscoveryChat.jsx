import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { getStoredToken, getStoredUser, getStoredSidebarCollapsed } from '../utils/cookieUtils';

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

/* ─── Inline SVG Icons ─── */
function Icon({ d, size = 18, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

const SEND_ICON   = 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z';
const SPARK_ICON  = 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83';
const CHECK_ICON  = 'M20 6L9 17l-5-5';
const BOT_ICON    = 'M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7zm4 4h.01M16 15h.01';
const USER_ICON   = 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z';
const FILE_ICON   = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6';
const EDIT_ICON   = 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z';
const PLUS_ICON   = 'M12 5v14M5 12h14';
const MENU_ICON   = 'M4 6h16M4 12h16M4 18h16';

export default function DiscoveryChat() {
  const { id: paramSessionId } = useParams();
  const navigate = useNavigate();

  // User & Auth State
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return getStoredSidebarCollapsed();
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Active Session & All Available Sessions
  const [activeSessionId, setActiveSessionId] = useState(paramSessionId || null);
  const [allSessions, setAllSessions] = useState([]);
  const [session, setSession] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [context, setContext] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState('');

  // Conversational Chat Thread
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [answeringQaId, setAnsweringQaId] = useState(null);
  const [draftAnswers, setDraftAnswers] = useState({});
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Quick Starter Input for Empty State
  const [starterTitle, setStarterTitle] = useState('Enterprise Transformation Blueprint');
  const [starterText, setStarterText] = useState('');
  const [startingSession, setStartingSession] = useState(false);

  // Parallel Blueprint Compilation State
  const [compiling, setCompiling] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [compilationStage, setCompilationStage] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, answeringQaId]);

  // Initial Load: Check Auth and Resolve Session
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setUser(getStoredUser());
    resolveAndLoadSession(token, paramSessionId);
  }, [paramSessionId, navigate]);

  // Smart Session Resolution
  const resolveAndLoadSession = async (token, targetId) => {
    setLoading(true);
    setErrorNotice('');

    try {
      // 1. Fetch user's session list from backend
      const res = await fetch('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token || getStoredToken()}` },
      });

      let sessionsList = [];
      if (res.ok) {
        const data = await res.json();
        sessionsList = data.sessions || [];
        setAllSessions(sessionsList);
      }

      // 2. Determine which session to open
      let resolvedId = targetId;

      if (!resolvedId) {
        // Check localStorage for previously remembered session
        const lastRemembered = typeof localStorage !== 'undefined' ? localStorage.getItem('compile_last_session_id') : null;
        if (lastRemembered && sessionsList.some(s => s.id === lastRemembered)) {
          resolvedId = lastRemembered;
        } else if (sessionsList.length > 0) {
          // Default to the first active/discovery session, or newest session
          const discoverySess = sessionsList.find(s => s.status === 'discovery');
          resolvedId = discoverySess ? discoverySess.id : sessionsList[0].id;
        }
      }

      // 3. If a session is resolved, load its complete details
      if (resolvedId) {
        setActiveSessionId(resolvedId);
        await loadSessionDetails(token, resolvedId);
      } else {
        // No sessions exist yet in MySQL
        setSession(null);
        setLoading(false);
      }

    } catch (err) {
      console.error(err);
      setErrorNotice('Could not connect to backend server on port 5000.');
      setLoading(false);
    }
  };

  const loadSessionDetails = async (token, sessId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${sessId}`, {
        headers: { Authorization: `Bearer ${token || getStoredToken()}` },
      });

      if (!res.ok) {
        throw new Error('Session not found or unavailable.');
      }

      const data = await res.json();
      setSession(data.session);
      setDocuments(data.documents || []);
      setContext(data.context || null);

      const qas = data.discoveryQas || [];
      setQuestions(qas);

      // Remember this session ID
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('compile_last_session_id', sessId);
        }
      } catch (e) {}

      // Initialize drafts
      const drafts = {};
      qas.forEach(q => {
        if (q.answer) drafts[q.id] = q.answer;
      });
      setDraftAnswers(drafts);

      // Construct initial chat thread using persistent MySQL messages
      buildInitialMessages(data.session, data.documents || [], qas, data.messages || []);

    } catch (err) {
      setErrorNotice(err.message || 'Error loading session details.');
    } finally {
      setLoading(false);
    }
  };

  const buildInitialMessages = (sess, docs, qas, dbMessages = []) => {
    if (dbMessages && dbMessages.length > 0) {
      const thread = dbMessages.map(m => ({
        id: m.id,
        sender: m.sender,
        timestamp: m.created_at,
        text: m.message_text,
      }));
      setMessages(thread);
      return;
    }

    const thread = [
      {
        id: 'welcome',
        sender: 'ai',
        timestamp: sess?.created_at || new Date().toISOString(),
        text: `Hello! I am your **AI Business Consultant & Solution Architect** (Chaos2Commit 2026).

I am reviewing your transformation blueprint: **"${sess?.title || 'Transformation Blueprint'}"**.

${docs.length > 0 ? `I have ingested ${docs.length} attached document(s): ${docs.map(d => d.file_name).join(', ')}.` : 'I have ingested your initial business goals and problem statement.'}

To produce an implementation-ready enterprise architecture and structured BRD, I have formulated **${qas.length || 5} clarifying discovery questions**. You can answer them below or converse directly with me.`,
      },
    ];
    setMessages(thread);
  };

  // Instant Quick-Start Session Creation for Empty State
  const handleCreateStarterSession = async (e) => {
    if (e) e.preventDefault();
    const token = getStoredToken();
    if (!token) return;

    setStartingSession(true);
    try {
      const res = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: starterTitle.trim() || 'Enterprise Cloud & Process Automation',
          initialText: starterText.trim() || 'Transform core enterprise workflows with automated AI processing, cloud microservices, and modern API integration.',
        }),
      });

      if (!res.ok) throw new Error('Failed to initialize session.');
      const data = await res.json();
      const newId = data.session.id;

      setActiveSessionId(newId);
      setAllSessions(prev => [data.session, ...prev]);
      await loadSessionDetails(token, newId);

    } catch (err) {
      alert(err.message || 'Error creating starter discovery session.');
    } finally {
      setStartingSession(false);
    }
  };

  // Submit Answer to a Specific Discovery Question
  const handleAnswerSubmit = async (qaId) => {
    const answerText = (draftAnswers[qaId] || '').trim();
    if (!answerText) return;

    const token = getStoredToken();
    if (!token) return;

    setSavingAnswer(true);
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/qa/${qaId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer: answerText }),
      });

      if (!res.ok) throw new Error('Could not save answer.');

      setQuestions(prev => prev.map(q => q.id === qaId ? { ...q, answer: answerText } : q));

      const matchedQ = questions.find(q => q.id === qaId);
      setMessages(prev => [
        ...prev,
        {
          id: 'user_' + Date.now(),
          sender: 'user',
          timestamp: new Date().toISOString(),
          text: `**[Re: ${matchedQ?.question || 'Discovery Question'}]**\n\n${answerText}`,
        },
        {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          timestamp: new Date().toISOString(),
          text: 'Thank you. I have incorporated this constraint into the transformation context. It will directly inform our architectural tech stack and non-functional requirements.',
        }
      ]);

      setAnsweringQaId(null);
    } catch (err) {
      alert(err.message || 'Error recording answer.');
    } finally {
      setSavingAnswer(false);
    }
  };

  // Send Message to AI Consultant with MySQL Database Memory Persistence
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !activeSessionId) return;

    const token = getStoredToken();
    if (!token) return;

    // Optimistically show user message
    const tempUserMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      text,
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setChatInput('');

    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${activeSessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.aiMessage) {
          setMessages(prev => [
            ...prev,
            {
              id: data.aiMessage.id,
              sender: data.aiMessage.sender,
              timestamp: data.aiMessage.createdAt || data.aiMessage.created_at,
              text: data.aiMessage.messageText || data.aiMessage.message_text,
            },
          ]);
        }
      } else {
        console.warn('Could not persist message to database.');
      }
    } catch (err) {
      console.error('Error in message exchange:', err);
    }
  };

  // Trigger Parallel Multi-Agent Blueprint Compilation
  const handleGenerateBlueprint = async () => {
    const token = getStoredToken();
    if (!token || !activeSessionId) return;

    setCompiling(true);
    setCompilationProgress(15);
    setCompilationStage('Ingesting Discovery Q&A and Context Normalization...');

    try {
      const progressTimer = setInterval(() => {
        setCompilationProgress(p => {
          if (p < 35) {
            setCompilationStage('Business Analysis Engine: Formulating BRD & Stakeholder Matrix...');
            return p + 15;
          }
          if (p < 70) {
            setCompilationStage('Solution Architecture Builder: Designing HLD & Cloud Topology...');
            return p + 18;
          }
          if (p < 90) {
            setCompilationStage('AI Planning Engine: Computing Effort Estimates & Phase Schedules...');
            return p + 10;
          }
          return p;
        });
      }, 700);

      const res = await fetch(`http://localhost:5000/api/sessions/${activeSessionId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Blueprint compilation failed.');
      }

      setCompilationProgress(100);
      setCompilationStage('✓ Transformation Blueprint Compiled Successfully!');

      setTimeout(() => {
        setCompiling(false);
        loadSessionDetails(token, activeSessionId);
      }, 900);

    } catch (err) {
      console.error(err);
      alert(err.message || 'Error generating blueprint.');
      setCompiling(false);
    }
  };

  // Progress metrics
  const answeredCount = questions.filter(q => q.answer && q.answer.trim().length > 0).length;
  const totalQuestions = questions.length || 1;
  const completionPercentage = Math.round((answeredCount / totalQuestions) * 100);
  const isCompleted = session?.status === 'completed';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.textH }}>
      <Navbar />

      <DashboardSidebar
        user={user}
        totalSessions={allSessions.length}
        completedCount={allSessions.filter(s => s.status === 'completed').length}
        inProgressCount={allSessions.filter(s => s.status !== 'completed').length}
        onNewBlueprint={() => navigate('/session/new')}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <main
        style={{
          marginLeft: sidebarCollapsed ? 68 : 244,
          padding: '84px 28px 40px',
          transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: 'calc(100vh - 64px)',
          boxSizing: 'border-box',
        }}
        className="discovery-main"
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Mobile Sidebar Toggle — shown only on small screens via CSS */}
          <button
            className="discovery-mobile-toggle"
            onClick={() => setMobileSidebarOpen(true)}
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 7,
              padding: '7px 13px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid #e2e8f0',
              color: '#4f46e5',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
              marginBottom: 16,
            }}
          >
            <Icon d={MENU_ICON} size={15} color="#6366f1" />
            <span>Navigation & Pages</span>
          </button>

          {/* ─── Loading State ─── */}
          {loading && (
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: '64px 24px',
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                width: 36,
                height: 36,
                border: `3px solid ${C.primaryLt}`,
                borderTopColor: C.primary,
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spinFast 0.8s linear infinite',
              }} />
              <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: C.textH }}>
                Loading Discovery Workspace...
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: C.textM }}>
                Connecting to MySQL session & AI Business Consultant
              </p>
            </div>
          )}

          {/* ─── Empty State: No Sessions in MySQL Yet ─── */}
          {!loading && !session && (
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: '48px 32px',
              maxWidth: 680,
              margin: '20px auto',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: C.primaryLt,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
              }}>
                <Icon d={BOT_ICON} size={28} color={C.primary} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', color: C.textH }}>
                Start Your AI Discovery Session
              </h2>
              <p style={{ fontSize: 14, color: C.textM, margin: '0 auto 28px', maxWidth: 480, lineHeight: 1.6 }}>
                You don't have an active discovery session yet. Create your first transformation initiative to engage with the AI Business Consultant.
              </p>

              <form onSubmit={handleCreateStarterSession} style={{ textAlign: 'left', background: C.surfaceAlt, padding: 22, borderRadius: 14, border: `1px solid ${C.border}` }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                    Blueprint Project Title
                  </label>
                  <input
                    type="text"
                    value={starterTitle}
                    onChange={e => setStarterTitle(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                    Initial Problem Statement / Goals
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what you want to automate or modernize..."
                    value={starterText}
                    onChange={e => setStarterText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 13.5,
                      boxSizing: 'border-box',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => navigate('/session/new')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.primary,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Or use full multi-format intake (SOP / PDF upload) →
                  </button>

                  <button
                    type="submit"
                    disabled={startingSession}
                    style={{
                      background: C.grad,
                      color: '#fff',
                      border: 'none',
                      padding: '10px 22px',
                      borderRadius: 9,
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: startingSession ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    }}
                  >
                    <Icon d={SPARK_ICON} size={15} color="#fff" />
                    <span>{startingSession ? 'Initializing...' : 'Launch Discovery Chat →'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── Active Session Loaded: Discovery Chat Workspace ─── */}
          {!loading && session && (
            <>
              {/* Header Bar with Session Switcher */}
              <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: '18px 24px',
                marginBottom: 24,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.textSub, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ cursor: 'pointer', color: C.primary, fontWeight: 600 }} onClick={() => navigate('/dashboard')}>
                      Dashboard
                    </span>
                    <span>/</span>
                    <span>Blueprints</span>
                    <span>/</span>
                    <span style={{ color: C.textB, fontWeight: 600 }}>Stage 2: AI Discovery Q&A</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Session Selector Dropdown if multiple exist */}
                    {allSessions.length > 1 ? (
                      <select
                        value={activeSessionId || ''}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setActiveSessionId(newId);
                          navigate(`/session/${newId}`);
                          loadSessionDetails(getStoredToken(), newId);
                        }}
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: C.textH,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '4px 10px',
                          background: C.surface,
                          cursor: 'pointer',
                          maxWidth: '100%',
                          width: '100%',
                        }}
                      >
                        {allSessions.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.status})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.textH, margin: 0, wordBreak: 'break-word', maxWidth: '100%' }}>
                        {session.title}
                      </h1>
                    )}

                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 20,
                      background: isCompleted ? C.successLt : C.warnLt,
                      color: isCompleted ? '#065f46' : '#92400e',
                      border: `1px solid ${isCompleted ? '#a7f3d0' : '#fde68a'}`,
                    }}>
                      {isCompleted ? '✓ Compiled & Ready' : '⏳ In Discovery Q&A'}
                    </span>
                  </div>
                </div>

                <div className="discovery-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/session/new')}
                    style={{
                      background: C.surfaceAlt,
                      border: `1px solid ${C.border}`,
                      borderRadius: 9,
                      padding: '9px 15px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.textB,
                      cursor: 'pointer',
                    }}
                  >
                    + New Blueprint
                  </button>

                  {isCompleted && (
                    <button
                      onClick={() => navigate(`/session/${activeSessionId}/result`)}
                      style={{
                        background: C.grad,
                        color: '#fff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 13.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                      }}
                    >
                      <Icon d={CHECK_ICON} size={15} color="#fff" />
                      <span>View Solution Blueprint →</span>
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/session/${activeSessionId}/generating`)}
                    style={{
                      background: isCompleted ? C.surfaceAlt : C.grad,
                      color: isCompleted ? C.textB : '#fff',
                      border: isCompleted ? `1px solid ${C.border}` : 'none',
                      padding: '10px 18px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: isCompleted ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
                    }}
                  >
                    <Icon d={SPARK_ICON} size={15} color={isCompleted ? C.primary : '#fff'} />
                    <span>{isCompleted ? 'Re-Compile' : 'Compile Solution Blueprint →'}</span>
                  </button>
                </div>
              </div>

              {/* Two-Column Discovery Layout */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 360px',
                gap: 24,
              }} className="discovery-grid">

                {/* Left: Chat & Question Cards */}
                <div className="discovery-chat-area" style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'calc(100vh - 240px)',
                  minHeight: 620,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                }}>
                  {/* Chat Subheader */}
                  <div className="discovery-sub-header" style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${C.border}`,
                    background: C.surfaceAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={BOT_ICON} size={15} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.textH }}>
                          AI Business Consultant (Chaos2Commit 2026)
                        </div>
                        <div style={{ fontSize: 11, color: C.textSub }}>
                          Validating requirements & architecture trade-offs
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 600, color: C.primaryDk }}>
                      {answeredCount} of {totalQuestions} Clarified ({completionPercentage}%)
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div style={{
                    flex: 1,
                    padding: '20px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}>
                    {messages.map((m) => {
                      const isAi = m.sender === 'ai';
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                            flexDirection: isAi ? 'row' : 'row-reverse',
                          }}
                        >
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isAi ? C.grad : C.primaryLt,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: isAi ? '#fff' : C.primaryDk,
                            fontWeight: 700,
                            fontSize: 13,
                          }}>
                            {isAi ? <Icon d={BOT_ICON} size={16} color="#fff" /> : <Icon d={USER_ICON} size={16} color={C.primaryDk} />}
                          </div>

                          <div style={{
                            maxWidth: '82%',
                            background: isAi ? C.surfaceAlt : C.primaryLt,
                            border: `1px solid ${isAi ? C.border : '#c7d2fe'}`,
                            borderRadius: 14,
                            padding: '12px 16px',
                            color: C.textB,
                            fontSize: 13.5,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                          }}>
                            {m.text}
                          </div>
                        </div>
                      );
                    })}

                    {/* Question Cards */}
                    {questions.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.textSub,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          <Icon d={SPARK_ICON} size={13} color={C.primary} />
                          Consultant Discovery Cards ({questions.length})
                        </div>

                        {questions.map((q, idx) => {
                          const hasAnswer = q.answer && q.answer.trim().length > 0;
                          const isEditing = answeringQaId === q.id;

                          return (
                            <div
                              key={q.id || idx}
                              style={{
                                background: hasAnswer ? '#f8fafc' : '#ffffff',
                                border: `1.5px solid ${hasAnswer ? '#a7f3d0' : '#e0e7ff'}`,
                                borderRadius: 14,
                                padding: '16px 18px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: hasAnswer ? C.success : C.primary,
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 800,
                                  }}>
                                    {hasAnswer ? '✓' : idx + 1}
                                  </span>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: hasAnswer ? '#065f46' : C.primaryDk,
                                    background: hasAnswer ? C.successLt : C.primaryLt,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                  }}>
                                    {q.category || 'Architecture & Scope'}
                                  </span>
                                </div>

                                {hasAnswer && !isEditing && (
                                  <button
                                    onClick={() => setAnsweringQaId(q.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: C.primary,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <Icon d={EDIT_ICON} size={13} color={C.primary} /> Edit
                                  </button>
                                )}
                              </div>

                              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textH, margin: '0 0 8px 0', lineHeight: 1.45 }}>
                                {q.question}
                              </h3>

                              {q.rationale && (
                                <p style={{ fontSize: 12, color: C.textSub, margin: '0 0 10px 0' }}>
                                  💡 <em>Why this matters:</em> {q.rationale}
                                </p>
                              )}

                              {hasAnswer && !isEditing && (
                                <div style={{
                                  background: '#ecfdf5',
                                  border: '1px solid #bbf7d0',
                                  borderRadius: 9,
                                  padding: '10px 14px',
                                  fontSize: 13,
                                  color: '#065f46',
                                  lineHeight: 1.5,
                                }}>
                                  <strong>Your Input:</strong> {q.answer}
                                </div>
                              )}

                              {(!hasAnswer || isEditing) && (
                                <div style={{ marginTop: 10 }}>
                                  <textarea
                                    rows={3}
                                    placeholder="Type your answer, requirements, or constraints..."
                                    value={draftAnswers[q.id] || ''}
                                    onChange={e => setDraftAnswers({ ...draftAnswers, [q.id]: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '10px 12px',
                                      borderRadius: 8,
                                      border: `1.5px solid ${C.border}`,
                                      fontSize: 13,
                                      color: C.textH,
                                      outline: 'none',
                                      boxSizing: 'border-box',
                                      fontFamily: 'inherit',
                                      resize: 'vertical',
                                    }}
                                  />
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                                    {isEditing && (
                                      <button
                                        type="button"
                                        onClick={() => setAnsweringQaId(null)}
                                        style={{
                                          background: 'none',
                                          border: `1px solid ${C.border}`,
                                          borderRadius: 7,
                                          padding: '6px 12px',
                                          fontSize: 12,
                                          color: C.textM,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleAnswerSubmit(q.id)}
                                      disabled={savingAnswer || !(draftAnswers[q.id] || '').trim()}
                                      style={{
                                        background: !(draftAnswers[q.id] || '').trim() ? C.borderMed : C.primary,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 7,
                                        padding: '7px 16px',
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        cursor: !(draftAnswers[q.id] || '').trim() ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                      }}
                                    >
                                      <Icon d={CHECK_ICON} size={13} color="#fff" />
                                      <span>Save Clarification</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Freeform Message Input Bar */}
                  <form
                    onSubmit={handleSendMessage}
                    style={{
                      padding: '12px 18px',
                      borderTop: `1px solid ${C.border}`,
                      background: C.surface,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Ask your AI Consultant questions (e.g. 'Can we use Azure Functions for ingestion?')..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '11px 16px',
                        borderRadius: 10,
                        border: `1.5px solid ${C.border}`,
                        fontSize: 13.5,
                        color: C.textH,
                        outline: 'none',
                        background: C.surfaceAlt,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        border: 'none',
                        background: chatInput.trim() ? C.grad : C.surfaceAlt,
                        color: chatInput.trim() ? '#fff' : C.textSub,
                        cursor: chatInput.trim() ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon d={SEND_ICON} size={16} />
                    </button>
                  </form>
                </div>

                {/* Right: Readiness Rail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 18,
                    padding: 22,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: C.textH }}>
                        Discovery Readiness
                      </h2>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.primaryDk }}>
                        {completionPercentage}%
                      </span>
                    </div>

                    <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
                      <div style={{
                        width: `${completionPercentage}%`,
                        height: '100%',
                        background: C.grad,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>

                    <p style={{ fontSize: 12.5, color: C.textM, lineHeight: 1.5, margin: '0 0 16px' }}>
                      {completionPercentage < 60
                        ? 'Answer key questions to eliminate ambiguity before compiling the solution architecture and BRD.'
                        : 'High discovery fidelity achieved! The AI engine has enough context to formulate high-confidence blueprints.'}
                    </p>

                    <button
                      onClick={handleGenerateBlueprint}
                      disabled={compiling}
                      style={{
                        width: '100%',
                        background: compiling ? C.borderMed : C.grad,
                        color: '#fff',
                        border: 'none',
                        padding: '12px',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 13.5,
                        cursor: compiling ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                      }}
                    >
                      <Icon d={SPARK_ICON} size={15} color="#fff" />
                      <span>{compiling ? 'Compiling Blueprint...' : 'Compile Solution Blueprint'}</span>
                    </button>
                  </div>

                  {/* Ingested Documents */}
                  <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 18,
                    padding: 20,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textH, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon d={FILE_ICON} size={16} color={C.primary} />
                        Attached Context Documents
                      </h3>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: C.textSub }}>
                        {documents.length}
                      </span>
                    </div>

                    {documents.length === 0 ? (
                      <p style={{ fontSize: 12.5, color: C.textSub, margin: 0 }}>
                        No files attached. Initial prompt text is active as source material.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {documents.map((d, i) => (
                          <div
                            key={d.id || i}
                            style={{
                              background: C.surfaceAlt,
                              border: `1px solid ${C.border}`,
                              borderRadius: 8,
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: 12.5,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <Icon d={FILE_ICON} size={14} color={C.primary} />
                              <span style={{ fontWeight: 600, color: C.textH, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {d.file_name}
                              </span>
                            </div>
                            <span style={{ fontSize: 10.5, color: C.success, fontWeight: 700 }}>
                              Parsed
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Parallel Compilation Modal Overlay */}
      {compiling && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: C.surface,
            borderRadius: 22,
            padding: '36px 32px',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            border: `1px solid ${C.border}`,
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: C.grad,
              margin: '0 auto 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
            }}>
              <Icon d={SPARK_ICON} size={26} color="#fff" />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textH, margin: '0 0 8px' }}>
              Compiling Transformation Blueprint
            </h2>
            <p style={{ fontSize: 13.5, color: C.textM, margin: '0 0 20px', lineHeight: 1.5 }}>
              {compilationStage}
            </p>

            <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                width: `${compilationProgress}%`,
                height: '100%',
                background: C.grad,
                transition: 'width 0.4s ease',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textSub, fontWeight: 600 }}>
              <span>Parallel Multi-Agent Synthesis</span>
              <span>{compilationProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe & Responsive Styles */}
      <style>{`
        @keyframes spinFast {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 990px) {
          .discovery-grid { grid-template-columns: 1fr !important; }
          .discovery-main {
            margin-left: 0 !important;
            padding: 80px 16px 32px !important;
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }
          .discovery-mobile-toggle { display: inline-flex !important; }
        }
        @media (max-width: 640px) {
          .discovery-main {
            padding: 76px 10px 24px !important;
            overflow-x: hidden !important;
          }
          .discovery-header-actions {
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .discovery-header-actions button { width: 100% !important; justify-content: center !important; }
          .discovery-chat-area { height: auto !important; min-height: 480px !important; }
          .discovery-sub-header { gap: 6px !important; }
        }
        @media (max-width: 380px) {
          .discovery-main { padding: 72px 8px 20px !important; }
        }
      `}</style>
    </div>
  );
}
