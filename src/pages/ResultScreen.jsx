import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { getStoredToken, getStoredUser, getStoredSidebarCollapsed, getUserRole } from '../utils/cookieUtils';
import MermaidDiagram from '../components/common/MermaidDiagram';
import SwaggerApiExplorer from '../components/common/SwaggerApiExplorer';
import { getCurrentLanguage, t, useTranslation } from '../utils/i18n';
import { generateDynamicBlueprintArtifacts, generateMermaidErdFromTables, generateMermaidArchFromComponents, generateMermaidBpmnFromNodes } from '../utils/dynamicBlueprintGenerator';

/* ─── Theme Palette ─── */
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
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

const CHECK_ICON    = 'M20 6L9 17l-5-5';
const DOWNLOAD_ICON = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
const REFRESH_ICON  = 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15';
const CHAT_ICON     = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';
const BRD_ICON      = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8';
const ARCH_ICON     = 'M16 18l6-6-6-6M8 6l-6 6 6 6';
const FLOW_ICON     = 'M22 12h-4l-3 9L9 3l-3 9H2';
const DB_ICON       = 'M4 6c0 1.66 3.58 3 8 3s8-1.34 8-3-3.58-3-8-3-8 1.34-8 3zm0 6c0 1.66 3.58 3 8 3s8-1.34 8-3M4 18c0 1.66 3.58 3 8 3s8-1.34 8-3';
const WIRE_ICON     = 'M3 3h18v18H3zM3 9h18M9 21V9';
const COST_ICON     = 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';
const COPY_ICON     = 'M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z';
const HISTORY_ICON  = 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z';
const MENU_ICON     = 'M4 6h16M4 12h16M4 18h16';
const CODE_ICON     = 'M16 18l6-6-6-6M8 6l-6 6 6 6';
const SHIELD_ICON   = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';

/* ─── Inline Markdown Formatter Component ─── */
function formatInlineMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#eef2ff;color:#4f46e5;padding:2px 6px;border-radius:4px;font-size:12px">$1</code>');
}

function FormattedMarkdownContent({ text }) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.6 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('# ')) {
          return <h2 key={idx} style={{ fontSize: 17, fontWeight: 800, color: C.textH, marginTop: 10, marginBottom: 4 }}>{trimmed.replace(/^#\s+/, '')}</h2>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} style={{ fontSize: 15, fontWeight: 700, color: C.primary, marginTop: 8, marginBottom: 4 }}>{trimmed.replace(/^##\s+/, '')}</h3>;
        }
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} style={{ fontSize: 14, fontWeight: 700, color: C.textH, marginTop: 6, marginBottom: 2 }}>{trimmed.replace(/^###\s+/, '')}</h4>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 6, fontSize: 13.5, color: C.textB }}>
              <span style={{ color: C.primary, fontWeight: 700 }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
            </div>
          );
        }
        if (trimmed.startsWith('---')) {
          return <hr key={idx} style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />;
        }
        return (
          <div key={idx} style={{ fontSize: 13.5, color: C.textB }} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
        );
      })}
    </div>
  );
}

/* ─── Format a USD cost value safely (strips leading $ if AI already includes it) ─── */
function fmtUSD(val, fallback) {
  if (!val && val !== 0) return `$${Number(fallback).toLocaleString()}`;
  const num = Number(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num === 0) return `$${Number(fallback).toLocaleString()}`;
  return `$${num.toLocaleString()}`;
}

// Static constants removed: All Diagrams (Mermaid Architecture, BPMN, ERD), Database Tables,
// API Specs, Wireframes, and Sandbox Apps are dynamically synthesized by generateDynamicBlueprintArtifacts().

export default function ResultScreen() {
  const { id: paramSessionId } = useParams();
  const navigate = useNavigate();

  // Auth & UI State
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return getStoredSidebarCollapsed();
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Active Session Data from MySQL
  const [allSessions, setAllSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(paramSessionId || null);
  const [session, setSession] = useState(null);
  const [brd, setBrd] = useState(null);
  const [architecture, setArchitecture] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState('');

  // Tabbed Pillar Selection
  const [activeTab, setActiveTab] = useState('brd'); // 'brd' | 'architecture' | 'bpmn' | 'database' | 'wireframes' | 'estimates'
  const [regeneratingSection, setRegeneratingSection] = useState(null);
  const [showVersionDrawer, setShowVersionDrawer] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Multilingual & RBAC State
  const { t, currentLanguage } = useTranslation();
  const [currentRole, setCurrentRole] = useState(() => getUserRole());
  useEffect(() => {
    const handleRole = (e) => setCurrentRole(e.detail?.role || getUserRole());
    window.addEventListener('role_changed', handleRole);
    return () => window.removeEventListener('role_changed', handleRole);
  }, []);
  const isViewer = currentRole === 'viewer';

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setUser(getStoredUser());
    resolveAndLoadBlueprint(token, paramSessionId);
  }, [paramSessionId, navigate]);

  // Session Resolver
  const resolveAndLoadBlueprint = async (token, targetId) => {
    setLoading(true);
    setErrorNotice('');

    try {
      // 1. Fetch user's sessions to locate target or latest completed session
      const listRes = await fetch('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      let sessionsList = [];
      if (listRes.ok) {
        const data = await listRes.json();
        sessionsList = data.sessions || [];
        setAllSessions(sessionsList);
      }

      let resolvedId = targetId;
      if (!resolvedId) {
        // Find newest completed session, or newest session overall
        const completed = sessionsList.find(s => s.status === 'completed');
        resolvedId = completed ? completed.id : (sessionsList[0] ? sessionsList[0].id : null);
      }

      if (resolvedId) {
        setActiveSessionId(resolvedId);
        await loadBlueprintData(token, resolvedId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setErrorNotice('Could not connect to backend server on port 5000.');
      setLoading(false);
    }
  };

  const loadBlueprintData = async (token, sessId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${sessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Blueprint session not found or unavailable.');

      const data = await res.json();
      setSession(data.session);
      setBrd(data.brd || null);
      setArchitecture(data.architecture || null);
      setEstimate(data.estimate || null);
      setVersions(data.versions || []);

      // If not yet generated, prompt or redirect to generating
      if (data.session?.status !== 'completed' && !data.brd && !data.architecture) {
        navigate(`/session/${sessId}/generating`);
      }
    } catch (err) {
      setErrorNotice(err.message || 'Error loading blueprint deliverables.');
    } finally {
      setLoading(false);
    }
  };

  // Single Section Regeneration (FR-6.2)
  const handleRegenerateSection = async (sectionKey) => {
    if (isViewer) {
      alert('🔒 Access Restricted: Section regeneration is disabled in Viewer (Read-Only) mode.');
      return;
    }
    const token = getStoredToken();
    if (!token || !activeSessionId) return;

    setRegeneratingSection(sectionKey);
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${activeSessionId}/regenerate/${sectionKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to regenerate ${sectionKey}.`);
      await loadBlueprintData(token, activeSessionId);
    } catch (err) {
      alert(err.message || 'Error during regeneration.');
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Direct File Export Download
  const handleExport = async (format) => {
    setExportDropdownOpen(false);
    const token = getStoredToken();
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    const url = `http://localhost:5000/api/export/session/${activeSessionId}?format=${format}${tokenParam}`;

    if (format === 'pdf') {
      window.open(url, '_blank');
      return;
    }

    try {
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const cleanTitle = (session?.title || 'blueprint').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `blueprint_${cleanTitle}.${format === 'docx' ? 'doc' : 'json'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Export download error:', err);
      // Fallback to opening in new window
      window.open(url, '_blank');
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Dynamic AI Artifact Synthesis
  const dynamicArtifacts = useMemo(() => {
    return generateDynamicBlueprintArtifacts(session, brd, architecture);
  }, [session, brd, architecture]);

  const techStack = (architecture?.tech_stack && architecture.tech_stack.length > 0) ? architecture.tech_stack : [
    { category: 'Frontend UI', choice: 'React 19 + Vite SPA', rationale: 'High performance component hierarchy with reactive state.' },
    { category: 'Ingress & Gateway', choice: 'Node.js Express / JWT', rationale: 'Asynchronous OAuth2 gateway with zero-trust token verification.' },
    { category: 'Persistence Tier', choice: 'PostgreSQL 16 / MySQL 8.0', rationale: 'Relational ACID schema with foreign keys and row-level security.' },
    { category: 'Distributed Cache', choice: 'Redis Enterprise', rationale: 'Sub-millisecond session state and real-time telemetry caching.' },
    { category: 'Event Message Broker', choice: 'RabbitMQ / Kafka', rationale: 'Decoupled async worker jobs for notifications and transactions.' },
  ];
  const components = architecture?.components || [];
  const bpmn = architecture?.bpmn_workflows || {
    processName: `${session?.title || 'Operational'} Workflow Pipeline`,
    nodes: dynamicArtifacts.bpmnSteps,
    decisionGates: [
      { condition: 'Automated verification check >= 90%', outcomeIfTrue: 'Fast-track to final sanction & execution', outcomeIfFalse: 'Route to supervisor exception desk' },
    ],
    escalations: [
      { trigger: 'Processing SLA > 24 hours', action: 'Automated notification to regional director', owner: 'Compliance Bot' },
    ],
    slaTarget: '< 24 Hours',
  };
  const dbSchema = architecture?.database_schema || null;
  const apiSpecs = architecture?.api_specs || null;
  const wireframes = (architecture?.wireframes && architecture.wireframes.screens) ? architecture.wireframes : dynamicArtifacts.dynamicWireframes;

  const dbTables = (dbSchema?.tables && Array.isArray(dbSchema.tables) && dbSchema.tables.length > 0) ? dbSchema.tables : dynamicArtifacts.dynamicDbTables;
  const apiEndpoints = (apiSpecs?.endpoints && Array.isArray(apiSpecs.endpoints) && apiSpecs.endpoints.length > 0) ? apiSpecs.endpoints : dynamicArtifacts.dynamicApiEndpoints;

  const archMermaidChart = useMemo(() => {
    if (components && Array.isArray(components) && components.length > 0) {
      return generateMermaidArchFromComponents(components, techStack, session?.title);
    }
    return dynamicArtifacts.dynamicArchChart;
  }, [components, techStack, session?.title, dynamicArtifacts]);

  const bpmnMermaidChart = useMemo(() => {
    if (bpmn?.nodes && Array.isArray(bpmn.nodes) && bpmn.nodes.length > 0) {
      return generateMermaidBpmnFromNodes(bpmn.nodes, bpmn.processName);
    }
    return dynamicArtifacts.dynamicBpmnChart;
  }, [bpmn, dynamicArtifacts]);

  const erdMermaidChart = useMemo(() => {
    if (dbTables && Array.isArray(dbTables) && dbTables.length > 0) {
      return generateMermaidErdFromTables(dbTables);
    }
    return dynamicArtifacts.dynamicErChart;
  }, [dbTables, dynamicArtifacts]);

  const functionalReqs = brd?.functional_requirements || [];
  const nonFunctionalReqs = brd?.non_functional_requirements || [];
  const gapAnalysis = brd?.gap_analysis || [];
  const stakeholders = brd?.stakeholders_list || [];
  const assumptions = brd?.assumptions || [];
  const constraints = brd?.constraints_data || [];

  const phaseBreakdown = estimate?.phase_breakdown || [];
  const teamAssumptions = estimate?.team_assumptions || {};

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
        className="result-main"
        style={{
          marginLeft: sidebarCollapsed ? 68 : 244,
          padding: '84px 28px 60px',
          transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: 'calc(100vh - 64px)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>

          {/* Mobile Sidebar Toggle — shown only on small screens via CSS */}
          <button
            className="result-mobile-toggle"
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

          {/* Loading State */}
          {loading && (
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: '64px 24px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 38,
                height: 38,
                border: `3px solid ${C.primaryLt}`,
                borderTopColor: C.primary,
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spinFast 0.8s linear infinite',
              }} />
              <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: C.textH }}>
                Loading Master Architecture Blueprint...
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: C.textM }}>
                Fetching BRD, HLD, BPMN workflows, and database schemas from MySQL
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !session && (
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: '48px 32px',
              textAlign: 'center',
              maxWidth: 640,
              margin: '30px auto',
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textH, marginBottom: 8 }}>
                No Compiled Blueprint Found
              </h2>
              <p style={{ fontSize: 14, color: C.textM, marginBottom: 24 }}>
                You have not generated any solution blueprints yet. Start by taking the transformation intake or completing a discovery session.
              </p>
              <button
                onClick={() => navigate('/session/new')}
                style={{
                  background: C.grad,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                + Create First Blueprint
              </button>
            </div>
          )}

          {/* Active Blueprint Hub */}
          {!loading && session && (
            <>
              {/* ─── Hero Header & Action Bar ─── */}
              <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: '24px 28px',
                marginBottom: 24,
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.textSub, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ cursor: 'pointer', color: C.primary, fontWeight: 600 }} onClick={() => navigate('/dashboard')}>
                        Dashboard
                      </span>
                      <span>/</span>
                      <span style={{ cursor: 'pointer', color: C.primary, fontWeight: 600 }} onClick={() => navigate(`/session/${session.id}`)}>
                        Discovery
                      </span>
                      <span>/</span>
                      <span style={{ color: C.textB, fontWeight: 700 }}>Stage 4: Compiled Architecture</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textH, margin: 0, wordBreak: 'break-word', maxWidth: '100%' }}>
                        {session.title}
                      </h1>

                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: C.successLt,
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Icon d={CHECK_ICON} size={12} color="#059669" /> Compiled & Certified
                      </span>

                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: C.primaryLt,
                        color: C.primaryDk,
                        border: '1px solid #c7d2fe',
                      }}>
                        v{brd?.version || 1}.0
                      </span>
                    </div>
                  </div>

                  {/* Actions: Export, Discovery Chat, Re-generate */}
                  <div className="result-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => navigate(`/session/${session.id}`)}
                      style={{
                        background: C.surfaceAlt,
                        border: `1px solid ${C.border}`,
                        borderRadius: 9,
                        padding: '9px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.textB,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon d={CHAT_ICON} size={15} color={C.textM} />
                      <span>Discovery Chat</span>
                    </button>

                    <button
                      onClick={() => navigate(`/session/${session.id}/generating`)}
                      style={{
                        background: C.surfaceAlt,
                        border: `1px solid ${C.border}`,
                        borderRadius: 9,
                        padding: '9px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.textB,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon d={REFRESH_ICON} size={14} color={C.textM} />
                      <span>Re-Compile</span>
                    </button>

                    <button
                      onClick={() => setShowVersionDrawer(!showVersionDrawer)}
                      style={{
                        background: showVersionDrawer ? C.primaryLt : C.surfaceAlt,
                        border: `1px solid ${showVersionDrawer ? C.primary : C.border}`,
                        borderRadius: 9,
                        padding: '9px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: showVersionDrawer ? C.primaryDk : C.textB,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon d={HISTORY_ICON} size={15} color={showVersionDrawer ? C.primary : C.textM} />
                      <span>Versions ({versions.length})</span>
                    </button>

                    {/* Export Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
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
                          boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                        }}
                      >
                        <Icon d={DOWNLOAD_ICON} size={15} color="#fff" />
                        <span>Export Deliverable ▾</span>
                      </button>

                      {exportDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: 6,
                          width: 210,
                          background: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 12,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          zIndex: 50,
                          padding: 6,
                        }}>
                          <button
                            onClick={() => handleExport('pdf')}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              padding: '10px 12px',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 600,
                              color: C.textH,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.primaryLt}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <span>📄 Executive PDF</span>
                            <span style={{ fontSize: 11, color: C.textSub }}>Printable</span>
                          </button>

                          <button
                            onClick={() => handleExport('docx')}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              padding: '10px 12px',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 600,
                              color: C.textH,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.primaryLt}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <span>📝 Word / Markdown</span>
                            <span style={{ fontSize: 11, color: C.textSub }}>.docx</span>
                          </button>

                          <button
                            onClick={() => handleExport('json')}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              padding: '10px 12px',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 600,
                              color: C.textH,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.primaryLt}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <span>⚙ JSON Architecture Schema</span>
                            <span style={{ fontSize: 11, color: C.textSub }}>Full payload</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Version History Drawer (if toggled) */}
              {showVersionDrawer && (
                <div style={{
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                  marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon d={HISTORY_ICON} size={18} color={C.primary} />
                      <span>Immutable MySQL Version Ledger (FR-6.4)</span>
                    </div>
                    <button
                      onClick={() => setShowVersionDrawer(false)}
                      style={{ background: 'none', border: 'none', color: C.textSub, cursor: 'pointer', fontSize: 12 }}
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {versions.map((v, i) => (
                      <div key={v.id || i} style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 12,
                        padding: '12px 16px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: C.primary }}>
                            Snapshot v{v.version_number || i + 1}.0
                          </span>
                          <span style={{ fontSize: 11, color: C.textSub }}>
                            {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: C.textB }}>
                          Change Event: <strong>{v.changed_section || 'full_generation'}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── 6-Pillar Tabbed Navigation Bar ─── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
                marginBottom: 24,
                borderBottom: `1px solid ${C.border}`,
              }}>
                {[
                  { id: 'brd', label: t('result.tabs.brd') || '1. Executive BRD', icon: BRD_ICON },
                  { id: 'architecture', label: t('result.tabs.architecture') || '2. Solution Architecture', icon: ARCH_ICON },
                  { id: 'bpmn', label: t('result.tabs.bpmn') || '3. Process Intelligence (BPMN)', icon: FLOW_ICON },
                  { id: 'database', label: t('result.tabs.database') || '4. Database & REST APIs', icon: DB_ICON },
                  { id: 'wireframes', label: t('result.tabs.wireframes') || '5. AI Wireframes', icon: WIRE_ICON },
                  { id: 'estimates', label: t('result.tabs.estimates') || '6. Effort & Cost Band', icon: COST_ICON },
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        background: isActive ? C.surface : 'transparent',
                        border: `1px solid ${isActive ? C.border : 'transparent'}`,
                        borderBottom: isActive ? `2px solid ${C.primary}` : '2px solid transparent',
                        borderRadius: '10px 10px 0 0',
                        padding: '12px 18px',
                        fontSize: 13.5,
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? C.primary : C.textM,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon d={tab.icon} size={16} color={isActive ? C.primary : C.textSub} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ═══════════════════════════════════════════════════════
                  TAB 1: EXECUTIVE BRD
              ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'brd' && (
                <div>
                  {/* Tab Action Header */}
                  <div className="tab-action-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px', color: C.textH }}>
                        Executive Business Requirements Document
                      </h2>
                      <p style={{ margin: 0, fontSize: 13, color: C.textM }}>
                        Synthesized from business context, inputs, and answered discovery trade-offs.
                      </p>
                    </div>

                    <button
                      onClick={() => handleRegenerateSection('brd')}
                      disabled={regeneratingSection === 'brd'}
                      style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: C.primary,
                        cursor: regeneratingSection === 'brd' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon d={REFRESH_ICON} size={13} color={C.primary} />
                      <span>{regeneratingSection === 'brd' ? 'Regenerating BRD...' : 'Regenerate Section'}</span>
                    </button>
                  </div>

                  {/* AI Explainability & Grounding Box */}
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 14,
                    padding: '16px 20px',
                    marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>🧠</span>
                      <span>AI Recommendation Explainability & Grounding</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>
                        <strong>• Why I Recommended This:</strong> {brd?.objectives ? `Automated architecture engineered to fulfill target objectives: "${brd.objectives.slice(0, 140)}..." with sub-second latency and resilient horizontal scaling.` : `Automated architecture engineered to modernize ${session?.title || 'enterprise workflows'} with sub-second latency and resilient horizontal scaling.`}
                      </div>
                      <div>
                        <strong>• Underlying Assumption:</strong> {assumptions.length > 0 ? (typeof assumptions[0] === 'string' ? assumptions[0] : assumptions[0]?.assumption || 'Standard cloud infrastructure and high-availability network connectivity are provisioned.') : 'Standard cloud infrastructure and high-availability network connectivity are provisioned.'}
                      </div>
                      <div>
                        <strong>• Source Evidence:</strong> Synthesized directly from validated input: <em>"{session?.summary ? session.summary.slice(0, 140) + '...' : session?.title || 'Domain requirement specifications'}"</em>.
                      </div>
                    </div>
                  </div>

                  {/* Objectives & Scope */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }} className="brd-grid">
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.6 }}>
                        Executive Objectives
                      </div>
                      <FormattedMarkdownContent text={brd?.objectives || 'Streamline digital transformation initiative with automated reasoning and continuous integration.'} />
                    </div>

                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.6 }}>
                        Scope Boundaries
                      </div>
                      <FormattedMarkdownContent text={brd?.scope || 'Covers intake, automated rule execution, multi-tier approvals, and REST API integration endpoints.'} />
                    </div>
                  </div>

                  {/* Gap Analysis */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 24 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, marginBottom: 14 }}>
                      Current State vs. Desired State Gap Analysis
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                      {gapAnalysis.map((gap, gi) => (
                        <div key={gi} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 13.5, color: C.textH }}>{gap.area}</span>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: gap.impact === 'High' ? '#fee2e2' : '#fef3c7',
                              color: gap.impact === 'High' ? '#991b1b' : '#92400e',
                            }}>
                              {gap.impact} Impact
                            </span>
                          </div>
                          <p style={{ fontSize: 12.5, color: C.textM, margin: 0, lineHeight: 1.5 }}>
                            {gap.gap}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Functional & Non-Functional Requirements */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, marginBottom: 24 }} className="brd-reqs-grid">
                    {/* Functional Specs */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, marginBottom: 14 }}>
                        Functional Specifications ({functionalReqs.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {functionalReqs.map((fr, fri) => (
                          <div key={fri} style={{ padding: '12px 16px', borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: C.primary }}>{fr.id || `FR-${fri + 1}`}: {fr.title}</span>
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: C.primaryLt, color: C.primaryDk }}>
                                {fr.priority || 'Must Have'}
                              </span>
                            </div>
                            <div style={{ fontSize: 12.5, color: C.textB, lineHeight: 1.5 }}>
                              {fr.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Non-Functional Requirements */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, marginBottom: 14 }}>
                        Non-Functional Requirements (NFRs)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {nonFunctionalReqs.map((nfr, nfi) => (
                          <div key={nfi} style={{ padding: '12px 16px', borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', marginBottom: 4 }}>
                              {nfr.category}
                            </div>
                            <div style={{ fontSize: 12.5, color: C.textB, lineHeight: 1.5 }}>
                              {nfr.requirement}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stakeholders & Constraints */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="brd-stakeholders-grid">
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.textH, marginBottom: 10 }}>
                        Key Stakeholders & Approvers
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {stakeholders.map((s, si) => (
                          <span key={si} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textB }}>
                            👤 {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.textH, marginBottom: 10 }}>
                        Assumptions & Constraints
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: C.textM }}>
                        {constraints.slice(0, 3).map((c, ci) => (
                          <div key={ci}>• {c}</div>
                        ))}
                        {assumptions.slice(0, 2).map((a, ai) => (
                          <div key={ai}>• {a}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  TAB 2: SOLUTION ARCHITECTURE & HLD
              ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'architecture' && (
                <div>
                  <div className="tab-action-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px', color: C.textH }}>
                        High-Level Solution Architecture & Cloud Topology
                      </h2>
                      <p style={{ margin: 0, fontSize: 13, color: C.textM }}>
                        Decoupled multi-tier enterprise architecture engineered for resilience and scalability.
                      </p>
                    </div>

                    <button
                      onClick={() => handleRegenerateSection('architecture')}
                      disabled={regeneratingSection === 'architecture'}
                      style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: C.primary,
                        cursor: regeneratingSection === 'architecture' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon d={REFRESH_ICON} size={13} color={C.primary} />
                      <span>{regeneratingSection === 'architecture' ? 'Regenerating Architecture...' : 'Regenerate Section'}</span>
                    </button>
                  </div>

                  {/* Architectural Summary Banner */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.6 }}>
                      Executive Architecture HLD Overview
                    </div>
                    <div style={{ fontSize: 14, color: C.textB, lineHeight: 1.65, margin: 0 }}>
                      <FormattedMarkdownContent text={architecture?.hld_summary || 'Decoupled cloud-native architecture utilizing a React SPA portal, Express API gateway, and MySQL database cluster.'} />
                    </div>
                  </div>

                  {/* AI Architectural Rationale & Explainability Box */}
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 14,
                    padding: '16px 20px',
                    marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>🧠</span>
                      <span>AI Architectural Rationale & Explainability</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>
                        <strong>• Why I Recommended This:</strong> Selected a decoupled event-driven cloud architecture with API Gateway and microservice worker pools to isolate core transaction processing from external integrations and data lake analytics.
                      </div>
                      <div>
                        <strong>• Underlying Assumption:</strong> Estimated peak operational throughput is handled via auto-scaling compute pods, Redis in-memory cache, and message brokers with sub-second lookups.
                      </div>
                      <div>
                        <strong>• Source Evidence:</strong> Grounded in statutory 99.9% uptime requirement, zero-trust token authentication, and multi-tenant domain isolation for {session?.title || 'the enterprise solution'}.
                      </div>
                    </div>
                  </div>

                  {/* Mermaid Enterprise Architecture Diagram */}
                  <MermaidDiagram
                    id="mermaid-architecture-model"
                    title="Mermaid.js Enterprise Solution Architecture & Cloud Topology"
                    subtitle="Client PWA → Edge CDN → API Gateway → Worker Microservices → Persistence & Cache"
                    chart={archMermaidChart}
                  />

                  {/* Interactive OpenAPI / Swagger UI Explorer */}
                  <SwaggerApiExplorer
                    endpoints={apiEndpoints}
                    title="Enterprise OpenAPI 3.1 Specification & Interactive Endpoint Console"
                  />
                  <div style={{
                    background: '#0f172a',
                    color: '#fff',
                    borderRadius: 18,
                    padding: 24,
                    marginBottom: 24,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Interactive Cloud Deployment Topology
                      </div>
                      <span style={{ fontSize: 11, background: '#1e293b', padding: '3px 10px', borderRadius: 20, color: '#38bdf8' }}>
                        TLS 1.3 / Zero-Trust VPC
                      </span>
                    </div>

                    {/* Topology Diagram Flow */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'center' }}>
                      {[
                        { title: 'Web Client Portal', tier: 'Client Tier', tech: 'React / Vite SPA', color: '#6366f1' },
                        { title: 'API Gateway & Auth', tier: 'Ingress Tier', tech: 'Node.js Express / JWT', color: '#06b6d4' },
                        { title: 'Ingestion Worker', tier: 'Compute Tier', tech: 'Async Worker Pool', color: '#3b82f6' },
                        { title: 'AI Reasoning Core', tier: 'Inference Tier', tech: 'Parallel LLM Engine', color: '#8b5cf6' },
                        { title: 'Relational DB Cluster', tier: 'Persistence Tier', tech: 'MySQL 8.0 InnoDB', color: '#10b981' },
                      ].map((box, bi) => (
                        <div key={bi} style={{
                          background: '#1e293b',
                          border: `1.5px solid ${box.color}`,
                          borderRadius: 12,
                          padding: 14,
                          textAlign: 'center',
                          position: 'relative',
                        }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                            {box.tier}
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
                            {box.title}
                          </div>
                          <div style={{ fontSize: 11, color: box.color, fontWeight: 600 }}>
                            {box.tech}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #334155', fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Flow: Client Ingestion → Auth Verification → Parallel Reasoning Pool → ACID Transaction Storage</span>
                      <span style={{ color: '#34d399' }}>● Continuous Uptime SLA: 99.9%</span>
                    </div>
                  </div>

                  {/* Tech Stack Matrix */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 24 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, marginBottom: 16 }}>
                      Technology Stack & Architecture Rationale
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: `1.5px solid ${C.border}`, color: C.textM }}>
                            <th style={{ padding: '8px 12px', width: '22%' }}>Category</th>
                            <th style={{ padding: '8px 12px', width: '30%' }}>Recommended Choice</th>
                            <th style={{ padding: '8px 12px' }}>Technical Rationale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {techStack.map((item, ti) => (
                            <tr key={ti} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '12px', fontWeight: 700, color: C.textH }}>{item.category}</td>
                              <td style={{ padding: '12px', fontWeight: 600, color: C.primary }}>{item.choice}</td>
                              <td style={{ padding: '12px', color: C.textB, lineHeight: 1.5 }}>{item.rationale}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Security Notes */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, marginBottom: 8 }}>
                      Security, Encryption & Regulatory Compliance
                    </div>
                    <p style={{ fontSize: 13.5, color: C.textB, lineHeight: 1.6, margin: 0 }}>
                      {architecture?.security_notes || 'All data in transit protected by TLS 1.3. AES-256 encryption at rest. Strict role-based row-level data access.'}
                    </p>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  TAB 3: PROCESS INTELLIGENCE & BPMN WORKFLOWS
              ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'bpmn' && (
                <div>
                  <div className="tab-action-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px', color: C.textH }}>
                        Process Intelligence & BPMN Workflows
                      </h2>
                      <p style={{ margin: 0, fontSize: 13, color: C.textM }}>
                        Formal BPMN process models with decision gates, approval thresholds, and SLA escalation paths.
                      </p>
                    </div>

                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: C.warnLt, color: '#92400e' }}>
                      SLA: {bpmn?.slaTarget || '< 24 Hours'}
                    </span>
                  </div>

                  {/* AI Process Rationale & Explainability Box */}
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 14,
                    padding: '16px 20px',
                    marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>🧠</span>
                      <span>AI Workflow Rationale & Governance Explainability</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>
                        <strong>• Why I Recommended This:</strong> Automated decision gates and service worker nodes replace manual checklists, allowing parallel asynchronous validations and strict SLA compliance for {bpmn?.processName || session?.title || 'business operations'}.
                      </div>
                      <div>
                        <strong>• Underlying Assumption:</strong> Core automated validations complete in sub-minute intervals with escalation paths if review SLAs exceed configured thresholds.
                      </div>
                      <div>
                        <strong>• Source Evidence:</strong> Modeled to satisfy strict end-to-end audit compliance and zero-loss message processing guidelines.
                      </div>
                    </div>
                  </div>

                  {/* Mermaid BPMN Process Workflow Diagram */}
                  <MermaidDiagram
                    id="mermaid-bpmn-workflow"
                    title="Mermaid.js BPMN 2.0 Process Workflow Orchestration"
                    subtitle="Automated Lifecycle Steps, Gateways, Escalation Policies & SLA Compliance"
                    chart={bpmnMermaidChart}
                  />

                  {/* Visual BPMN Process Diagram */}
                  <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 18,
                    padding: 24,
                    marginBottom: 24,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, textTransform: 'uppercase', marginBottom: 18, letterSpacing: 0.6 }}>
                      {bpmn?.processName || 'Automated Transformation & Approval Pipeline'}
                    </div>

                    {/* BPMN Step Flow Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {(bpmn?.nodes || []).map((node, ni) => {
                        const isStart = node.type === 'start';
                        const isGateway = node.type === 'gateway';
                        const isEnd = node.type === 'end';

                        let badgeColor = C.primary;
                        let badgeBg = C.primaryLt;
                        if (isStart) { badgeColor = '#059669'; badgeBg = '#d1fae5'; }
                        if (isGateway) { badgeColor = '#d97706'; badgeBg = '#fef3c7'; }
                        if (isEnd) { badgeColor = '#dc2626'; badgeBg = '#fee2e2'; }

                        return (
                          <div key={node.id || ni} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            background: C.surfaceAlt,
                            border: `1px solid ${isGateway ? '#fde68a' : C.border}`,
                            borderRadius: 12,
                            padding: '14px 18px',
                          }}>
                            {/* Sequence Number */}
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: isGateway ? 4 : '50%',
                              background: badgeBg,
                              color: badgeColor,
                              fontWeight: 800,
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transform: isGateway ? 'rotate(45deg)' : 'none',
                              flexShrink: 0,
                            }}>
                              <span style={{ transform: isGateway ? 'rotate(-45deg)' : 'none' }}>
                                {ni + 1}
                              </span>
                            </div>

                            {/* Node Details */}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                                <span style={{ fontWeight: 800, fontSize: 14, color: C.textH }}>{node.name}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: badgeBg, color: badgeColor, textTransform: 'uppercase' }}>
                                  {node.type}
                                </span>
                                <span style={{ fontSize: 11.5, color: C.textSub }}>Actor: <strong>{node.actor}</strong></span>
                              </div>
                              <div style={{ fontSize: 12.5, color: C.textM, lineHeight: 1.5 }}>
                                {node.description}
                              </div>
                            </div>

                            <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, whiteSpace: 'nowrap' }}>
                              ⏱ {node.duration}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Decision Gates & Escalations */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="bpmn-rules-grid">
                    {/* Decision Gates */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, marginBottom: 14 }}>
                        Exclusive Decision Gate Policies
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(bpmn?.decisionGates || []).map((gate, gi) => (
                          <div key={gi} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.warn, marginBottom: 6 }}>
                              Condition: {gate.condition}
                            </div>
                            <div style={{ fontSize: 12, color: C.textB, marginBottom: 3 }}>
                              ✓ <strong>If True:</strong> {gate.outcomeIfTrue}
                            </div>
                            <div style={{ fontSize: 12, color: C.textM }}>
                              ✕ <strong>If False:</strong> {gate.outcomeIfFalse}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Escalations */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, marginBottom: 14 }}>
                        Automated Escalation Triggers
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(bpmn?.escalations || []).map((esc, ei) => (
                          <div key={ei} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                              Trigger: {esc.trigger}
                            </div>
                            <div style={{ fontSize: 12, color: C.textB, marginBottom: 4 }}>
                              Action: {esc.action}
                            </div>
                            <div style={{ fontSize: 11.5, color: C.textSub }}>
                              Responsible Owner: <strong>{esc.owner}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  TAB 4: DATABASE SCHEMA & REST API SPECIFICATIONS
              ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'database' && (
                <div>
                  <div className="tab-action-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px', color: C.textH }}>
                        Relational Database Schema & REST API Explorer
                      </h2>
                      <p style={{ margin: 0, fontSize: 13, color: C.textM }}>
                        Production-ready relational entities and OpenAPI / RESTful interface specifications.
                      </p>
                    </div>

                    <button
                      onClick={() => copyToClipboard(JSON.stringify({ databaseSchema: dbSchema, apiSpecs }, null, 2), 'schema')}
                      style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: C.primary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon d={COPY_ICON} size={14} color={C.primary} />
                      <span>{copiedKey === 'schema' ? '✓ Copied Schema!' : 'Copy Full Schema'}</span>
                    </button>
                  </div>

                  {/* AI Data Model Rationale & Explainability Box */}
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 14,
                    padding: '16px 20px',
                    marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>🧠</span>
                      <span>AI Data Model Rationale & ACID Compliance Explainability</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>
                        <strong>• Why I Recommended This:</strong> 3NF Relational structure with UUID primary keys and foreign key constraints guarantees ACID compliance and immutable audit logs for {session?.title || 'operational workflows'}.
                      </div>
                      <div>
                        <strong>• Underlying Assumption:</strong> Read-to-write ratio is estimated at 80:20, making composite B-Tree indexes on primary status and entity lookup foreign keys optimal.
                      </div>
                      <div>
                        <strong>• Source Evidence:</strong> Normalized from identified domain entities: {dbTables.map(t => t.name).slice(0, 4).join(', ')} with referential integrity constraints.
                      </div>
                    </div>
                  </div>

                  {/* Mermaid Entity-Relationship (ERD) Schema Diagram */}
                  <MermaidDiagram
                    id="mermaid-erd-schema"
                    title="Mermaid.js Entity-Relationship (ERD) Relational Schema Model"
                    subtitle="Normalized 3NF Data Model with Foreign Key Constraints & Audit Integrity"
                    chart={erdMermaidChart}
                  />

                  {/* Relational Tables Explorer */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.textH, marginBottom: 14 }}>
                      Normalized Relational Database Entities (MySQL 8.0)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                      {dbTables.map((table, ti) => (
                        <div key={table.name || ti} style={{
                          background: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 16,
                          padding: 20,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 800, color: C.primary, fontFamily: 'monospace' }}>
                              {table.name}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: C.surfaceAlt, color: C.textSub }}>
                              {table.columns?.length || 0} Columns
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: C.textM, marginBottom: 14 }}>
                            {table.description}
                          </div>

                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                              <thead>
                                <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textSub, textAlign: 'left' }}>
                                  <th style={{ padding: '6px 4px' }}>Column</th>
                                  <th style={{ padding: '6px 4px' }}>Type</th>
                                  <th style={{ padding: '6px 4px' }}>Constraints</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(table.columns || []).map((col, ci) => (
                                  <tr key={ci} style={{ borderBottom: `1px solid ${C.surfaceAlt}` }}>
                                    <td style={{ padding: '6px 4px', fontWeight: 600, color: C.textH, fontFamily: 'monospace' }}>
                                      {col.name}
                                    </td>
                                    <td style={{ padding: '6px 4px', color: C.accent, fontFamily: 'monospace' }}>
                                      {col.type}
                                    </td>
                                    <td style={{ padding: '6px 4px' }}>
                                      {col.isPk && <span style={{ fontSize: 9.5, fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 4, marginRight: 4 }}>PK</span>}
                                      {col.isFk && <span style={{ fontSize: 9.5, fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: 4 }}>FK</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* REST API Endpoints */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.textH, marginBottom: 16 }}>
                      RESTful API Specification & Payload Contracts
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {apiEndpoints.map((ep, epi) => {
                        const isPost = ep.method === 'POST';
                        const isGet = ep.method === 'GET';

                        return (
                          <div key={epi} style={{
                            background: C.surfaceAlt,
                            border: `1px solid ${C.border}`,
                            borderRadius: 12,
                            padding: 16,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: isPost ? '#dbeafe' : isGet ? '#dcfce7' : '#fef3c7',
                                  color: isPost ? '#1d4ed8' : isGet ? '#15803d' : '#b45309',
                                  fontFamily: 'monospace',
                                }}>
                                  {ep.method}
                                </span>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: C.textH, fontFamily: 'monospace' }}>
                                  {ep.path}
                                </span>
                              </div>

                              <span style={{ fontSize: 11.5, color: C.textSub }}>
                                {ep.authRequired ? '🔒 Auth Required (JWT)' : '🌐 Public'}
                              </span>
                            </div>

                            <div style={{ fontSize: 12.5, color: C.textM, marginBottom: 10 }}>
                              {ep.summary}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 4 }}>Request Payload</div>
                                <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '8px 12px', borderRadius: 8, fontSize: 11, margin: 0, overflowX: 'auto', fontFamily: 'monospace' }}>
                                  {ep.requestBody}
                                </pre>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 4 }}>Response Sample</div>
                                <pre style={{ background: '#0f172a', color: '#4ade80', padding: '8px 12px', borderRadius: 8, fontSize: 11, margin: 0, overflowX: 'auto', fontFamily: 'monospace' }}>
                                  {ep.responseSample}
                                </pre>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  TAB 5: AI UX WIREFRAMES
              ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'wireframes' && (
                <div>
                  <div className="tab-action-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px', color: C.textH }}>
                        AI UX Wireframe Concepts & Screen Hierarchy
                      </h2>
                      <p style={{ margin: 0, fontSize: 13, color: C.textM }}>
                        Low-fidelity visual layout blueprints mapping key user workflows.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                    {(wireframes?.screens || []).map((screen, si) => (
                      <div key={screen.id || si} style={{
                        background: C.surface,
                        border: `1.5px solid ${C.border}`,
                        borderRadius: 16,
                        padding: 22,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: C.textH }}>{screen.title}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: C.primaryLt, color: C.primaryDk, textTransform: 'uppercase' }}>
                            {screen.layoutType}
                          </span>
                        </div>
                        <p style={{ fontSize: 12.5, color: C.textM, margin: '0 0 16px', lineHeight: 1.5 }}>
                          {screen.description}
                        </p>

                        {/* Visual Wireframe Blueprint Canvas */}
                        <div style={{
                          background: '#1e293b',
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 16,
                          border: '1px solid #334155',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                        }}>
                          {/* Mini Window Bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #334155' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                            <span style={{ fontSize: 9.5, color: '#94a3b8', marginLeft: 6, fontFamily: 'monospace' }}>
                              wireframe://{screen.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                            </span>
                          </div>

                          {/* Visual Layout Mock */}
                          <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: 8, height: 105 }}>
                            {/* Mini Sidebar */}
                            <div style={{ background: '#0f172a', borderRadius: 6, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ height: 6, background: '#6366f1', borderRadius: 3, width: '80%' }} />
                              <div style={{ height: 4, background: '#334155', borderRadius: 2 }} />
                              <div style={{ height: 4, background: '#334155', borderRadius: 2 }} />
                              <div style={{ height: 4, background: '#334155', borderRadius: 2 }} />
                            </div>

                            {/* Mini Main Content Area */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {/* Mini Metric Cards */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                <div style={{ background: '#334155', height: 26, borderRadius: 4, padding: 3 }}>
                                  <div style={{ height: 4, width: '50%', background: '#94a3b8', borderRadius: 2, marginBottom: 3 }} />
                                  <div style={{ height: 8, width: '70%', background: '#38bdf8', borderRadius: 2 }} />
                                </div>
                                <div style={{ background: '#334155', height: 26, borderRadius: 4, padding: 3 }}>
                                  <div style={{ height: 4, width: '50%', background: '#94a3b8', borderRadius: 2, marginBottom: 3 }} />
                                  <div style={{ height: 8, width: '60%', background: '#4ade80', borderRadius: 2 }} />
                                </div>
                                <div style={{ background: '#334155', height: 26, borderRadius: 4, padding: 3 }}>
                                  <div style={{ height: 4, width: '50%', background: '#94a3b8', borderRadius: 2, marginBottom: 3 }} />
                                  <div style={{ height: 8, width: '80%', background: '#f59e0b', borderRadius: 2 }} />
                                </div>
                              </div>

                              {/* Mini Table Skeleton */}
                              <div style={{ background: '#0f172a', flex: 1, borderRadius: 4, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ height: 6, background: '#334155', borderRadius: 2, width: '100%' }} />
                                <div style={{ height: 4, background: '#1e293b', borderRadius: 2, width: '90%' }} />
                                <div style={{ height: 4, background: '#1e293b', borderRadius: 2, width: '95%' }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Wireframe Mock Box */}
                        <div style={{
                          background: C.surfaceAlt,
                          border: `1.5px dashed ${C.borderMed}`,
                          borderRadius: 12,
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}>
                          {(screen.components || []).map((comp, ci) => (
                            <div key={ci} style={{
                              background: C.surface,
                              border: `1px solid ${C.border}`,
                              borderRadius: 8,
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: C.textB }}>
                                ▫ {comp.label}
                              </span>
                              <span style={{ fontSize: 10, color: C.textSub, background: C.surfaceAlt, padding: '2px 6px', borderRadius: 4 }}>
                                {comp.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  TAB 6: EFFORT, COST & ROADMAP
              ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'estimates' && (
                <div>
                  <div className="tab-action-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px', color: C.textH }}>
                        Effort, Cost Bands & Delivery Roadmap
                      </h2>
                      <p style={{ margin: 0, fontSize: 13, color: C.textM }}>
                        Calculated by AI Planning Engine based on architectural complexity and phase scope.
                      </p>
                    </div>

                    <button
                      onClick={() => handleRegenerateSection('estimate')}
                      disabled={regeneratingSection === 'estimate'}
                      style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: C.primary,
                        cursor: regeneratingSection === 'estimate' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon d={REFRESH_ICON} size={13} color={C.primary} />
                      <span>{regeneratingSection === 'estimate' ? 'Regenerating Estimates...' : 'Regenerate Section'}</span>
                    </button>
                  </div>

                  {/* 3-Tier Cost Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {/* Low */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 6 }}>
                        Minimum MVP Budget
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: C.textH, marginBottom: 4 }}>
                        {fmtUSD(estimate?.low_estimate_usd, 28000)}
                      </div>
                      <div style={{ fontSize: 12, color: C.textM }}>
                        Core functional scope without third-party enterprise hooks
                      </div>
                    </div>

                    {/* Mid (Recommended) */}
                    <div style={{
                      background: C.surface,
                      border: `2px solid ${C.primary}`,
                      borderRadius: 16,
                      padding: 22,
                      textAlign: 'center',
                      boxShadow: '0 4px 20px rgba(99,102,241,0.12)',
                      position: 'relative',
                    }}>
                      <span style={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: C.grad,
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 10px',
                        borderRadius: 12,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        Recommended Target
                      </span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, textTransform: 'uppercase', marginBottom: 6 }}>
                        Full Production Baseline
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: C.primary, marginBottom: 4 }}>
                        {fmtUSD(estimate?.mid_estimate_usd, 45000)}
                      </div>
                      <div style={{ fontSize: 12, color: C.textM }}>
                        Includes multi-tier approvals, audit logging & QA automation
                      </div>
                    </div>

                    {/* High */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 6 }}>
                        Enterprise High-Resilience
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: C.textH, marginBottom: 4 }}>
                        {fmtUSD(estimate?.high_estimate_usd, 68000)}
                      </div>
                      <div style={{ fontSize: 12, color: C.textM }}>
                        Multi-region redundancy, 24/7 dedicated support SLA
                      </div>
                    </div>
                  </div>

                  {/* Phased Timeline Breakdown */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 24 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, marginBottom: 18 }}>
                      Phased Delivery Schedule & Timeline Allocation
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {phaseBreakdown.map((ph, pi) => (
                        <div key={pi}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: C.textH, marginBottom: 6 }}>
                            <span>{ph.phase}</span>
                            <span style={{ color: C.primary }}>{ph.weeks} Weeks ({ph.percentage}%)</span>
                          </div>
                          <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${ph.percentage}%`, height: '100%', background: C.grad, borderRadius: 999 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team Assumptions */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, marginBottom: 12 }}>
                      Team Composition & Delivery Governance
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="team-grid">
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 4 }}>Team Composition</div>
                        <div style={{ fontSize: 13, color: C.textB }}>
                          {teamAssumptions.teamComposition || '1 Lead Architect, 2 Senior Full-Stack Developers, 1 QA Engineer'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 4 }}>Delivery Model</div>
                        <div style={{ fontSize: 13, color: C.textB }}>
                          {teamAssumptions.deliveryModel || 'Bi-weekly agile sprint cadences with automated CI/CD security test gates'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}

        </div>
      </main>

      <style>{`
        @keyframes spinFast {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .result-mobile-toggle { display: inline-flex !important; }
          .result-main {
            margin-left: 0 !important;
            padding: 82px 16px 48px !important;
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }
        }
        @media (max-width: 768px) {
          .result-header-actions {
            width: 100% !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .result-header-actions > * {
            flex: 1 1 auto !important;
            min-width: 130px !important;
            justify-content: center !important;
          }
          .tab-action-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            width: 100% !important;
          }
          .tab-action-header button {
            width: 100% !important;
            justify-content: center !important;
          }
          .brd-grid,
          .brd-reqs-grid,
          .brd-stakeholders-grid,
          .team-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .result-main table { font-size: 12px !important; }
        }
        @media (max-width: 640px) {
          .result-main {
            padding: 76px 10px 36px !important;
          }
          .result-main table {
            display: block !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            max-width: 100% !important;
          }
          .result-main pre {
            overflow-x: auto !important;
            max-width: 100% !important;
            white-space: pre !important;
            font-size: 11px !important;
          }
        }
        @media (max-width: 380px) {
          .result-main { padding: 72px 8px 28px !important; }
          .result-header-actions > * { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
