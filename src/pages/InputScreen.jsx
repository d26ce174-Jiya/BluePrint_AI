import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { getStoredToken, getStoredUser, getStoredSidebarCollapsed } from '../utils/cookieUtils';

/* ─── Shared Theme Palette ─── */
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

/* ─── Icon Helper ─── */
function Icon({ d, size = 18, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

const UPLOAD_ICON = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12';
const FILE_ICON   = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6';
const SPARK_ICON  = 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83';
const TRASH_ICON  = 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2';
const CHECK_ICON  = 'M20 6L9 17l-5-5';
const ARROW_RIGHT = 'M5 12h14M12 5l7 7-7 7';
const INFO_ICON   = 'M12 16v-4M12 8h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0z';
const LAYERS_ICON = 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';
const CLOUD_ICON  = 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z';
const CHAT_ICON   = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';

/* ─── Industry Quick-Start Templates (Futurrizon Business Transformation) ─── */
const TEMPLATES = [
  {
    id: 'ai-automation',
    title: 'Customer Onboarding & KYC Automation',
    tag: 'FinTech & Banking',
    desc: 'Replace manual PDF verification with an AI-driven document extraction, risk scoring, and automated compliance pipeline.',
    samplePrompt: 'We need to transform our customer onboarding process. Currently, compliance officers manually review customer identification documents, proof of address, and financial statements, taking 3-5 business days per account. We want an automated solution featuring AI OCR, automated AML/PEP screening, rule-based risk classification, and automated approval workflows with human-in-the-loop exception handling.',
    cloud: 'Azure (Microsoft Ecosystem)',
    focus: 'AI Solution & Process Automation',
  },
  {
    id: 'cloud-modernization',
    title: 'Legacy Monolith to Microservices & Cloud',
    tag: 'Enterprise IT',
    desc: 'Deconstruct a legacy on-premise relational core system into modular containerized microservices on Kubernetes.',
    samplePrompt: 'Our core enterprise inventory and order management system is a 12-year-old on-premise monolithic application running on Windows Server and MS SQL. It suffers from slow deployment cycles, lack of horizontal scalability, and single points of failure. We want a modern cloud architecture with decoupled REST & gRPC microservices, event-driven messaging (Kafka/Service Bus), containerized deployment, and automated CI/CD pipelines.',
    cloud: 'Azure (Microsoft Ecosystem)',
    focus: 'Legacy Cloud Modernization',
  },
  {
    id: 'copilot-companion',
    title: 'Internal SOP & Policy AI Copilot',
    tag: 'Corporate & HR',
    desc: 'Enterprise RAG knowledge engine allowing employees to converse naturally with standard operating procedures and internal documents.',
    samplePrompt: 'Build an enterprise AI Assistant that ingests all internal standard operating procedures (SOPs), company policies, compliance guidelines, and technical documentation. Employees should be able to ask complex operational questions in natural language and receive grounded answers with exact document citations, maintaining strict role-based access control so sensitive executive materials remain confidential.',
    cloud: 'Azure (Microsoft Ecosystem)',
    focus: 'AI Agent & Copilot (RAG)',
  },
  {
    id: 'supply-chain',
    title: 'Smart Logistics & Predictive Demand',
    tag: 'Supply Chain & Retail',
    desc: 'Real-time telemetry, IoT warehouse tracking, and predictive inventory replenishment models.',
    samplePrompt: 'Transform regional distribution network with predictive inventory intelligence. We want to ingest ERP purchase histories, current stock levels across 14 warehouses, and supplier lead times to predict stockout risks 30 days in advance. Needs automated reorder triggers, interactive warehouse manager dashboards, and supplier EDI integration.',
    cloud: 'AWS (Amazon Web Services)',
    focus: 'Database & API Integration',
  },
];

export default function InputScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Authentication & Session
  const [user, setUser] = useState(null);
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setUser(getStoredUser());
  }, [navigate]);

  // Sidebar Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return getStoredSidebarCollapsed();
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('Enterprise Technology');
  const [problemPrompt, setProblemPrompt] = useState('');
  const [selectedCloud, setSelectedCloud] = useState('Azure (Microsoft Ecosystem)');
  const [selectedFocus, setSelectedFocus] = useState('AI Solution & Process Automation');
  const [targetTimeline, setTargetTimeline] = useState('Production MVP (8–12 Weeks)');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Submission & AI Generation State
  const [submitting, setSubmitting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showInvalidModal, setShowInvalidModal] = useState(false);

  // Debounced LLM SOP / BRD Validation
  useEffect(() => {
    const textToValidate = problemPrompt.trim();
    if (!textToValidate || textToValidate.length < 15) {
      setValidationResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await fetch('http://localhost:5000/api/ai/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToValidate }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.validation) {
            setValidationResult(data.validation);
          }
        }
      } catch (e) {
        // quiet fallback
      } finally {
        setIsValidating(false);
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [problemPrompt]);

  // Apply Quick-Start Template
  const handleApplyTemplate = (tpl) => {
    setTitle(tpl.title);
    setProblemPrompt(tpl.samplePrompt);
    setSelectedCloud(tpl.cloud);
    setSelectedFocus(tpl.focus);
    setErrorNotice('');
    setValidationResult(null);
    setShowInvalidModal(false);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const filtered = newFiles.filter(file => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 25MB limit.`);
        return false;
      }
      return true;
    });

    setUploadedFiles(prev => [...prev, ...filtered]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate Completeness Score for AI Consultant Readiness
  const calcCompleteness = () => {
    let score = 0;
    if (title.trim().length >= 4) score += 20;
    if (problemPrompt.trim().length >= 40) score += 40;
    else if (problemPrompt.trim().length > 0) score += 20;
    if (uploadedFiles.length > 0) score += 20;
    if (selectedCloud) score += 10;
    if (selectedFocus) score += 10;
    return Math.min(100, score);
  };

  const completeness = calcCompleteness();

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorNotice('');

    if (validationResult && !validationResult.isValid) {
      setShowInvalidModal(true);
      setErrorNotice(validationResult.reason || 'Please provide a valid business requirement or SOP before proceeding.');
      return;
    }

    if (!title.trim()) {
      setErrorNotice('Please provide a title for your transformation blueprint project.');
      return;
    }

    if (!problemPrompt.trim() && uploadedFiles.length === 0) {
      setErrorNotice('Please provide either an initial business problem description or upload supporting documentation (SOPs, BRDs, PDFs).');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setProgressMsg('Initializing Business Transformation session in MySQL...');

    try {
      // 1. Compose full context text from prompt + selected parameters
      const compositeInitialText = `Project Title: ${title.trim()}
Industry Domain: ${industry}
Target Cloud Platform: ${selectedCloud}
Transformation Focus: ${selectedFocus}
Target Delivery Horizon: ${targetTimeline}

Business Problem & Transformation Requirements:
${problemPrompt.trim()}`.trim();

      // 2. Initialize Session
      const sessionRes = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          initialText: compositeInitialText,
        }),
      });

      if (!sessionRes.ok) {
        const errData = await sessionRes.json().catch(() => ({}));
        if (errData.validation && !errData.validation.isValid) {
          setValidationResult(errData.validation);
          setShowInvalidModal(true);
          setErrorNotice(errData.message || 'Input is not a valid SOP or Business Requirement.');
          setSubmitting(false);
          return;
        }
        throw new Error(errData.message || 'Failed to initialize transformation session.');
      }

      const sessionData = await sessionRes.json();
      const sessionId = sessionData.session.id;

      // 3. Upload Any Supporting Business Documents in Parallel (Sub-second)
      if (uploadedFiles.length > 0) {
        setProgressMsg(`Uploading ${uploadedFiles.length} supporting document(s) in parallel...`);
        const uploadTasks = uploadedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileName', file.name);
          formData.append('fileType', file.type || 'application/octet-stream');

          const uploadRes = await fetch(`http://localhost:5000/api/sessions/${sessionId}/input`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (!uploadRes.ok) {
            console.warn(`Warning: document "${file.name}" could not be ingested.`);
          }
        });
        await Promise.all(uploadTasks);
      }

      setProgressMsg('AI Discovery Engine active. Redirecting to Discovery Q&A...');
      setTimeout(() => {
        navigate(`/session/${sessionId}`);
      }, 700);

    } catch (err) {
      console.error(err);
      setErrorNotice(err.message || 'Error creating transformation blueprint. Ensure backend is running on port 5000.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.textH }}>
      {/* Invalid SOP / BRD Ask-Again Modal */}
      {showInvalidModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 520,
            width: '100%',
            padding: 28,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid #fee2e2',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                fontSize: 22,
                fontWeight: 900,
              }}>
                !
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#991b1b' }}>
                  Input Clarification Required
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: '#b91c1c' }}>
                  Not a valid Standard Operating Procedure or Business Requirement
                </p>
              </div>
            </div>

            <div style={{
              background: '#fef2f2',
              borderRadius: 12,
              padding: 14,
              marginBottom: 18,
              border: '1px solid #fecaca',
            }}>
              <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5, marginBottom: 10 }}>
                {validationResult?.reason || 'The provided text does not contain sufficient business context or process workflow steps to formulate an Architecture Blueprint.'}
              </div>

              {validationResult?.guidance && (
                <div style={{ fontSize: 12, color: '#7f1d1d', fontWeight: 600 }}>
                  💡 Recommendation: {validationResult.guidance}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textH, marginBottom: 8 }}>
                To proceed, please ensure your input includes:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: C.textB }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ef4444' }}>•</span> Current operational workflow
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ef4444' }}>•</span> Existing systems (ERP/CRM)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ef4444' }}>•</span> Key bottlenecks/pain points
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ef4444' }}>•</span> Target transformation goal
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  handleApplyTemplate(TEMPLATES[0]);
                  setShowInvalidModal(false);
                }}
                style={{
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  color: C.textB,
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Use Example SOP
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInvalidModal(false);
                }}
                style={{
                  background: C.primary,
                  border: 'none',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                }}
              >
                Revise My Input
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar />

      {/* Glassmorphic Sidebar */}
      <DashboardSidebar
        user={user}
        totalSessions={0}
        completedCount={0}
        inProgressCount={0}
        onNewBlueprint={() => {}}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <main
        style={{
          marginLeft: sidebarCollapsed ? 68 : 244,
          padding: '88px 32px 64px',
          transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: 'calc(100vh - 64px)',
          boxSizing: 'border-box',
        }}
        className="input-main"
      >
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>

          {/* Breadcrumb & Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textSub, marginBottom: 8 }}>
              <span style={{ cursor: 'pointer', color: C.primary, fontWeight: 600 }} onClick={() => navigate('/dashboard')}>
                Dashboard
              </span>
              <span>/</span>
              <span>New Blueprint</span>
              <span>/</span>
              <span style={{ color: C.textB, fontWeight: 600 }}>Stage 1: Business Intake</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: C.textH, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  Business Transformation Intake
                </h1>
                <p style={{ fontSize: 14, color: C.textM, margin: 0, maxWidth: 640 }}>
                  Convert your business idea, legacy challenge, or operational SOP into an implementation-ready enterprise blueprint powered by AI Business Analysis.
                </p>
              </div>

              {/* Progress Stage Badge */}
              <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Transformation Pipeline
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: C.primaryDk }}>
                    Step 1 of 3: Context Intake
                  </div>
                </div>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: C.grad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow: '0 3px 10px rgba(99,102,241,0.35)',
                }}>
                  1
                </div>
              </div>
            </div>
          </div>

          {/* Quick-Start Transformation Templates */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 14.5, fontWeight: 700, color: C.textB, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon d={SPARK_ICON} size={16} color={C.primary} />
                Quick-Start Transformation Archetypes (Click to Auto-Fill)
              </h2>
              <span style={{ fontSize: 12, color: C.textSub }}>Optional Pre-sets</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
            }} className="templates-grid">
              {TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                  }}
                >
                  <div>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: C.primaryDk,
                      background: C.primaryLt,
                      padding: '2px 7px',
                      borderRadius: 6,
                      display: 'inline-block',
                      marginBottom: 8,
                    }}>
                      {tpl.tag}
                    </span>
                    <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.textH, margin: '0 0 6px', lineHeight: 1.3 }}>
                      {tpl.title}
                    </h3>
                    <p style={{ fontSize: 12, color: C.textM, margin: 0, lineHeight: 1.45 }}>
                      {tpl.desc}
                    </p>
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.surfaceAlt}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: C.textSub }}>{tpl.cloud.split(' ')[0]}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.primary, display: 'flex', alignItems: 'center', gap: 3 }}>
                      Use Template →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form & Sidebar Grid */}
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: 28,
            }} className="input-grid">

              {/* Left Column: Primary Intake Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Section 1: Project Identity */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={LAYERS_ICON} size={17} color={C.primary} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.textH }}>1. Project Title & Industry Domain</h2>
                      <p style={{ fontSize: 12.5, color: C.textM, margin: 0 }}>Identify the initiative for organization governance</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }} className="title-industry-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                        Blueprint Project Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Automated Claims Adjudication Platform"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 9,
                          border: `1.5px solid ${C.border}`,
                          fontSize: 14,
                          color: C.textH,
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = C.primary}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                        Industry Sector
                      </label>
                      <select
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: 9,
                          border: `1.5px solid ${C.border}`,
                          fontSize: 13.5,
                          color: C.textH,
                          background: C.surface,
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Enterprise Technology">Enterprise Technology</option>
                        <option value="Banking & Financial Services">Banking & Financial Services</option>
                        <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                        <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                        <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                        <option value="Energy & Utilities">Energy & Utilities</option>
                        <option value="Public Sector / Government">Public Sector</option>
                        <option value="Other">Other Specialized Domain</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Problem Description & Business Goals */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={CHAT_ICON} size={17} color="#0284c7" />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.textH }}>2. Business Context & Challenges</h2>
                        <p style={{ fontSize: 12.5, color: C.textM, margin: 0 }}>Describe current bottlenecks, pain points, and transformation goals</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: C.textSub }}>
                      {problemPrompt.length} characters
                    </span>
                  </div>

                  <textarea
                    rows={7}
                    placeholder="Provide detailed business context:&#10;• What is the current manual or legacy workflow?&#10;• What are the key bottlenecks or pain points?&#10;• What is the desired future state and target automation outcome?&#10;• Are there any specific integration points (e.g. SAP, Salesforce, Microsoft 365, internal SQL)?"
                    value={problemPrompt}
                    onChange={e => setProblemPrompt(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 10,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: C.textH,
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = C.primary}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                  {/* AI SOP / BRD Validation Status Card */}
                  {isValidating && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 12.5,
                      color: C.textM,
                    }}>
                      <div style={{ width: 14, height: 14, border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>AI Model analyzing input against 105.5k trained dataset patterns (validating SOP / BRD structure)...</span>
                    </div>
                  )}

                  {validationResult && !isValidating && (
                    <div style={{
                      marginTop: 12,
                      padding: 14,
                      borderRadius: 12,
                      border: validationResult.isValid ? '1px solid #86efac' : '1px solid #fca5a5',
                      background: validationResult.isValid ? '#f0fdf4' : '#fef2f2',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: validationResult.isValid ? '#22c55e' : '#ef4444',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 900,
                          }}>
                            {validationResult.isValid ? '✓' : '!'}
                          </span>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: validationResult.isValid ? '#15803d' : '#b91c1c',
                          }}>
                            {validationResult.isValid
                              ? `Validated ${validationResult.documentType || 'Business Context'} (${validationResult.confidenceScore || 85}% confidence)`
                              : 'Clarification Needed: Input is not a valid SOP or Business Requirement'}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: validationResult.isValid ? '#166534' : '#991b1b', fontWeight: 600 }}>
                          {validationResult.isValid ? 'Grounded in Dataset Corpus' : 'Action Required'}
                        </span>
                      </div>

                      <p style={{
                        margin: '0 0 6px',
                        fontSize: 12.5,
                        color: validationResult.isValid ? '#166534' : '#991b1b',
                        lineHeight: 1.5,
                      }}>
                        {validationResult.reason}
                      </p>

                      {validationResult.summary && validationResult.isValid && (
                        <div style={{ fontSize: 12, color: '#15803d', fontStyle: 'italic', marginBottom: 4 }}>
                          "{validationResult.summary}"
                        </div>
                      )}

                      {!validationResult.isValid && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #fecaca' }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7f1d1d', marginBottom: 4 }}>
                            Checklist to qualify as a valid SOP / BRD:
                          </div>
                          <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 12, color: '#991b1b' }}>
                            {(validationResult.missingElements && validationResult.missingElements.length > 0) ? (
                              validationResult.missingElements.map((m, i) => <li key={i}>{m}</li>)
                            ) : (
                              <>
                                <li>Describe your current manual or legacy workflow</li>
                                <li>Mention key pain points or bottlenecks</li>
                                <li>Specify desired automation or software outcomes</li>
                              </>
                            )}
                          </ul>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                handleApplyTemplate(TEMPLATES[0]);
                                setValidationResult(null);
                              }}
                              style={{
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Load Example SOP Template
                            </button>
                            <span style={{ fontSize: 11.5, color: '#991b1b' }}>or refine your description above</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: C.textSub }}>
                    <Icon d={INFO_ICON} size={14} color={C.textSub} />
                    <span>Our trained AI verifies input structure against 105,500 enterprise patterns before entering Discovery.</span>
                  </div>
                </div>

                {/* Section 3: Multi-Format Document Upload (PDF, Word, PPTX, SOPs) */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={UPLOAD_ICON} size={17} color="#d97706" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.textH }}>3. Upload SOPs, BRDs, PPTs & Documents</h2>
                      <p style={{ fontSize: 12.5, color: C.textM, margin: 0 }}>Support formats: PDF, DOCX, PPTX, Markdown, Text (up to 25MB each)</p>
                    </div>
                  </div>

                  {/* Dropzone Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging ? C.primary : C.borderMed}`,
                      background: isDragging ? C.primaryLt : C.surfaceAlt,
                      borderRadius: 14,
                      padding: '32px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      multiple
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.json"
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: C.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}>
                      <Icon d={UPLOAD_ICON} size={22} color={C.primary} />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.textH }}>
                      Drag and drop your transformation files here, or <span style={{ color: C.primary, textDecoration: 'underline' }}>browse</span>
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: C.textSub }}>
                      SOPs, Process workflows, Architecture diagrams, RFPs, or Current-state spreadsheets
                    </p>
                  </div>

                  {/* Uploaded File List */}
                  {uploadedFiles.length > 0 && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.textM, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Attached Documents ({uploadedFiles.length})
                      </div>
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: C.surfaceAlt,
                          border: `1px solid ${C.border}`,
                          borderRadius: 10,
                          padding: '8px 14px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <Icon d={FILE_ICON} size={16} color={C.primary} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.textH, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {file.name}
                            </span>
                            <span style={{ fontSize: 11.5, color: C.textSub }}>
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 4,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Remove file"
                          >
                            <Icon d={TRASH_ICON} size={14} color="#ef4444" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Architectural Parameters & AI Readiness Widget */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* AI Transformation Companion Widget */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(6,182,212,0.06) 100%)',
                  border: `1px solid rgba(99,102,241,0.2)`,
                  borderRadius: 18,
                  padding: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={SPARK_ICON} size={15} color="#fff" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: C.textH, margin: 0 }}>
                        AI Transformation Companion
                      </h3>
                      <p style={{ fontSize: 11.5, color: C.textSub, margin: 0 }}>Real-time Intake Guidance</p>
                    </div>
                  </div>

                  {/* Readiness Progress Bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: C.textB }}>Intake Completeness</span>
                      <span style={{ color: C.primaryDk }}>{completeness}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${completeness}%`,
                        height: '100%',
                        background: C.grad,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: C.textM, lineHeight: 1.5, margin: 0 }}>
                    {completeness < 50
                      ? '💡 Add a clear project title and business problem description so the AI Consultant can target its analysis.'
                      : completeness < 80
                      ? '⚡ Great start! Attaching an SOP or specifying your preferred cloud stack will deepen the architecture accuracy.'
                      : '✓ Excellent context provided! Ready to generate high-fidelity discovery questions and initial architecture.'}
                  </p>
                </div>

                {/* Architectural Preferences Panel */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                  <h3 style={{ fontSize: 14.5, fontWeight: 800, color: C.textH, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon d={CLOUD_ICON} size={16} color={C.primary} />
                    Solution & Cloud Guardrails
                  </h3>

                  {/* Cloud Ecosystem */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textB, marginBottom: 6 }}>
                      Target Cloud Ecosystem
                    </label>
                    <select
                      value={selectedCloud}
                      onChange={e => setSelectedCloud(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textH,
                        background: C.surface,
                        outline: 'none',
                      }}
                    >
                      <option value="Azure (Microsoft Ecosystem)">Azure (Microsoft Ecosystem - Preferred)</option>
                      <option value="AWS (Amazon Web Services)">AWS (Amazon Web Services)</option>
                      <option value="Google Cloud Platform (GCP)">Google Cloud Platform (GCP)</option>
                      <option value="Hybrid Cloud / On-Premises">Hybrid Cloud / On-Premises</option>
                      <option value="Multi-Cloud Architecture">Multi-Cloud Architecture</option>
                    </select>
                  </div>

                  {/* Transformation Focus */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textB, marginBottom: 6 }}>
                      Transformation Archetype
                    </label>
                    <select
                      value={selectedFocus}
                      onChange={e => setSelectedFocus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textH,
                        background: C.surface,
                        outline: 'none',
                      }}
                    >
                      <option value="AI Solution & Process Automation">AI Solution & Process Automation</option>
                      <option value="AI Agent & Copilot (RAG)">AI Agent & Copilot (RAG)</option>
                      <option value="Legacy Cloud Modernization">Legacy Cloud Modernization</option>
                      <option value="Database & API Integration">Database & API Integration</option>
                      <option value="Enterprise Web & Mobile App">Enterprise Web & Mobile App</option>
                    </select>
                  </div>

                  {/* Target Delivery Timeline */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textB, marginBottom: 6 }}>
                      Delivery Timeline Horizon
                    </label>
                    <select
                      value={targetTimeline}
                      onChange={e => setTargetTimeline(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textH,
                        background: C.surface,
                        outline: 'none',
                      }}
                    >
                      <option value="Fast-Track POC (2–4 Weeks)">Fast-Track POC (2–4 Weeks)</option>
                      <option value="Production MVP (8–12 Weeks)">Production MVP (8–12 Weeks)</option>
                      <option value="Full Enterprise Rollout (4–6 Months)">Full Enterprise Rollout (4–6 Months)</option>
                    </select>
                  </div>
                </div>

                {/* Error Banner */}
                {errorNotice && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#991b1b',
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}>
                    ⚠️ {errorNotice}
                  </div>
                )}

                {/* Submission CTA Card */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: submitting ? C.borderMed : C.grad,
                      color: '#fff',
                      border: 'none',
                      padding: '14px 20px',
                      borderRadius: 11,
                      fontWeight: 700,
                      fontSize: 14.5,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {submitting ? (
                      <>
                        <div style={{
                          width: 16,
                          height: 16,
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spinFast 0.8s linear infinite',
                        }} />
                        <span>Processing Intake...</span>
                      </>
                    ) : (
                      <>
                        <Icon d={SPARK_ICON} size={16} color="#fff" />
                        <span>Launch AI Discovery →</span>
                      </>
                    )}
                  </button>

                  {submitting && (
                    <p style={{ margin: 0, fontSize: 12, color: C.textM, textAlign: 'center', fontWeight: 500 }}>
                      {progressMsg}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11.5, color: C.textSub }}>
                    <Icon d={CHECK_ICON} size={13} color={C.success} />
                    <span>Advisory recommendations generated by Chaos2Commit AI</span>
                  </div>
                </div>

              </div>

            </div>
          </form>

        </div>
      </main>

      {/* Responsive Style Overrides */}
      <style>{`
        @keyframes spinFast {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1040px) {
          .templates-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .input-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .input-main {
            margin-left: 0 !important;
            padding: 82px 18px 48px !important;
          }
        }
        @media (max-width: 640px) {
          .templates-grid { grid-template-columns: 1fr !important; }
          .title-industry-grid { grid-template-columns: 1fr !important; }
          .input-main { padding: 76px 12px 36px !important; }
        }
      `}</style>
    </div>
  );
}
