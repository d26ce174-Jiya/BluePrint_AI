import { useState, useEffect } from 'react';
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

/* ─── SVG Icons ─── */
function Icon({ d, size = 18, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

const HISTORY_ICON  = 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z';
const CHECK_ICON    = 'M20 6L9 17l-5-5';
const RESTORE_ICON  = 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8m0 0V3m0 5h5';
const COMPARE_ICON  = 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5';
const EYE_ICON      = 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z';
const ARROW_LEFT    = 'M19 12H5M12 19l-7-7 7-7';
const DOWNLOAD_ICON = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
const MENU_ICON     = 'M4 6h16M4 12h16M4 18h16';

/* ─── Format USD safely (strips leading $ if AI already added one) ─── */
function fmtUSD(val, fallback) {
  if (!val && val !== 0) return `$${Number(fallback).toLocaleString()}`;
  const num = Number(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num === 0) return `$${Number(fallback).toLocaleString()}`;
  return `$${num.toLocaleString()}`;
}

/* ─── Inline Markdown Formatter ─── */
function fmtInline(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#eef2ff;color:#4f46e5;padding:2px 4px;border-radius:3px;font-size:11px">$1</code>');
}
function FormattedMarkdownContent({ text }) {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, lineHeight: 1.6 }}>
      {lines.map((line, idx) => {
        const t = line.trim();
        if (!t) return null;
        if (t.startsWith('# '))  return <strong key={idx} style={{ fontSize: 14, color: C.textH }}>{t.replace(/^#\s+/, '')}</strong>;
        if (t.startsWith('## ')) return <strong key={idx} style={{ fontSize: 13, color: C.primary }}>{t.replace(/^##\s+/, '')}</strong>;
        if (t.startsWith('- ') || t.startsWith('* ')) {
          return (
            <div key={idx} style={{ display: 'flex', gap: 7, fontSize: 12.5, color: C.textB }}>
              <span style={{ color: C.primary }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: fmtInline(t.replace(/^[-*]\s+/, '')) }} />
            </div>
          );
        }
        return <div key={idx} style={{ fontSize: 12.5, color: C.textB }} dangerouslySetInnerHTML={{ __html: fmtInline(t) }} />;
      })}
    </div>
  );
}

export default function VersionHistory() {
  const { id: paramSessionId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return getStoredSidebarCollapsed();
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data states
  const [allSessions, setAllSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(paramSessionId || null);
  const [session, setSession] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentBrd, setCurrentBrd] = useState(null);
  const [currentArch, setCurrentArch] = useState(null);
  const [currentEst, setCurrentEst] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState('');

  // Modals & Action States
  const [inspectingVersion, setInspectingVersion] = useState(null);
  const [comparingVersion, setComparingVersion] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setUser(getStoredUser());
    resolveAndLoadVersions(token, paramSessionId);
  }, [paramSessionId, navigate]);

  const resolveAndLoadVersions = async (token, targetId) => {
    setLoading(true);
    setErrorNotice('');
    try {
      const res = await fetch('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      let sessionsList = [];
      if (res.ok) {
        const data = await res.json();
        sessionsList = data.sessions || [];
        setAllSessions(sessionsList);
      }

      let resolvedId = targetId;
      if (!resolvedId) {
        const completed = sessionsList.find(s => s.status === 'completed');
        resolvedId = completed ? completed.id : (sessionsList[0] ? sessionsList[0].id : null);
      }

      if (resolvedId) {
        setActiveSessionId(resolvedId);
        await loadSessionAndVersions(token, resolvedId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setErrorNotice('Could not connect to backend server on port 5000.');
      setLoading(false);
    }
  };

  const loadSessionAndVersions = async (token, sessId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${sessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Session not found.');

      const data = await res.json();
      setSession(data.session);
      setCurrentBrd(data.brd);
      setCurrentArch(data.architecture);
      setCurrentEst(data.estimate);

      // Load full versions list
      const vRes = await fetch(`http://localhost:5000/api/sessions/${sessId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (vRes.ok) {
        const vData = await vRes.json();
        setVersions(vData.versions || []);
      } else {
        setVersions(data.versions || []);
      }
    } catch (err) {
      setErrorNotice(err.message || 'Error loading version history.');
    } finally {
      setLoading(false);
    }
  };

  // Rollback / Restore Version (FR-6.4)
  const handleRestoreVersion = async (version) => {
    if (!window.confirm(`Are you sure you want to restore Version v${version.version_number}.0? This will overwrite the current live deliverable in MySQL and log a rollback audit event.`)) {
      return;
    }

    const token = getStoredToken();
    if (!token || !activeSessionId) return;

    setRestoringId(version.id);
    setSuccessMessage('');
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${activeSessionId}/versions/${version.id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to restore version.');
      }

      const data = await res.json();
      setSuccessMessage(`✓ ${data.message || 'Version restored successfully!'}`);
      await loadSessionAndVersions(token, activeSessionId);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Error during rollback.');
    } finally {
      setRestoringId(null);
    }
  };

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
        className="version-main"
        style={{
          marginLeft: sidebarCollapsed ? 68 : 244,
          padding: '84px 28px 60px',
          transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: 'calc(100vh - 64px)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>

          {/* Mobile Sidebar Toggle — shown only on small screens via CSS */}
          <button
            className="version-mobile-toggle"
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

          {/* Loading */}
          {loading && (
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: '64px 24px',
              textAlign: 'center',
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
                Loading Version History Ledger...
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: C.textM }}>
                Fetching snapshots from MySQL session_versions table
              </p>
            </div>
          )}

          {/* Loaded Version History */}
          {!loading && session && (
            <>
              {/* Header Hero */}
              <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: '24px 28px',
                marginBottom: 24,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.textSub, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ cursor: 'pointer', color: C.primary, fontWeight: 600 }} onClick={() => navigate('/dashboard')}>
                        Dashboard
                      </span>
                      <span>/</span>
                      <span style={{ cursor: 'pointer', color: C.primary, fontWeight: 600 }} onClick={() => navigate(`/session/${session.id}/result`)}>
                        Blueprint
                      </span>
                      <span>/</span>
                      <span style={{ color: C.textB, fontWeight: 700 }}>Version History & Rollback Ledger</span>
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
                        background: C.primaryLt,
                        color: C.primaryDk,
                        border: '1px solid #c7d2fe',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Icon d={HISTORY_ICON} size={13} color={C.primary} />
                        {versions.length} Immutable Snapshots
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => navigate(`/session/${session.id}/result`)}
                      style={{
                        background: C.primaryLt,
                        color: C.primaryDk,
                        border: 'none',
                        padding: '9px 16px',
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon d={ARROW_LEFT} size={15} color={C.primaryDk} />
                      <span>Back to Master Deliverables Hub</span>
                    </button>
                  </div>
                </div>

                {successMessage && (
                  <div style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: C.successLt,
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: 13.5,
                    fontWeight: 600,
                  }}>
                    {successMessage}
                  </div>
                )}
              </div>

              {/* Version Timeline Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {versions.length === 0 && (
                  <div style={{ background: C.surface, padding: 32, borderRadius: 16, textAlign: 'center', border: `1px solid ${C.border}` }}>
                    <p style={{ color: C.textM, margin: 0 }}>No version snapshots have been recorded yet.</p>
                  </div>
                )}

                {versions.map((v, idx) => {
                  const isLatest = idx === 0;
                  const dateStr = new Date(v.created_at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const snap = v.snapshot_data || {};
                  const snapBrd = snap.brd || (snap.section === 'brd' ? snap.data : null);
                  const snapArch = snap.architecture || (snap.section === 'architecture' ? snap.data : null);
                  const snapEst = snap.estimate || (snap.section === 'estimate' ? snap.data : null);

                  let changeLabel = 'Full Generation';
                  let changeColor = C.primary;
                  let changeBg = C.primaryLt;

                  if (v.changed_section?.includes('brd')) {
                    changeLabel = 'Regenerate BRD';
                    changeColor = '#0284c7';
                    changeBg = '#e0f2fe';
                  } else if (v.changed_section?.includes('architecture')) {
                    changeLabel = 'Regenerate Architecture';
                    changeColor = '#7c3aed';
                    changeBg = '#ede9fe';
                  } else if (v.changed_section?.includes('estimate')) {
                    changeLabel = 'Regenerate Estimates';
                    changeColor = '#d97706';
                    changeBg = '#fef3c7';
                  } else if (v.changed_section?.includes('rollback')) {
                    changeLabel = `Restored ${v.changed_section.replace('rollback_', '')}`;
                    changeColor = '#059669';
                    changeBg = '#d1fae5';
                  }

                  return (
                    <div
                      key={v.id || idx}
                      className="version-card"
                      style={{
                        background: C.surface,
                        border: `1.5px solid ${isLatest ? '#c7d2fe' : C.border}`,
                        borderRadius: 18,
                        padding: '22px 26px',
                        boxShadow: isLatest ? '0 4px 16px rgba(99,102,241,0.06)' : '0 2px 8px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {/* Top Meta Line */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: C.textH }}>
                            v{v.version_number}.0
                          </span>

                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 6,
                            background: changeBg,
                            color: changeColor,
                          }}>
                            {changeLabel}
                          </span>

                          {isLatest && (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 20,
                              background: C.successLt,
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                            }}>
                              ● Current Active Deliverable
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 12.5, color: C.textSub }}>
                          📅 {dateStr}
                        </div>
                      </div>

                      {/* Snapshot Highlights Preview */}
                      <div
                        className="version-highlights-grid"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: 14,
                          background: C.surfaceAlt,
                          borderRadius: 12,
                          padding: 16,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 4 }}>
                            BRD Objectives Snapshot
                          </div>
                          <div style={{ fontSize: 12.5, color: C.textB, lineHeight: 1.5, maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {snapBrd?.objectives || currentBrd?.objectives || 'Standard operational transformation baseline.'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 4 }}>
                            Tech Stack & Components
                          </div>
                          <div style={{ fontSize: 12.5, color: C.textB, lineHeight: 1.5 }}>
                            {snapArch?.tech_stack?.length ? `${snapArch.tech_stack.length} stack items mapped` : 'Cloud-native 3-tier topology'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 4 }}>
                            Target Budget Band
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>
                            {snapEst?.mid_estimate_usd
                              ? fmtUSD(snapEst.mid_estimate_usd, 45000)
                              : currentEst?.mid_estimate_usd
                              ? fmtUSD(currentEst.mid_estimate_usd, 45000)
                              : snapEst?.cost_band || currentEst?.cost_band || 'Mid: $45,000'}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="version-card-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setInspectingVersion(v)}
                          style={{
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: '7px 14px',
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: C.textB,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Icon d={EYE_ICON} size={14} color={C.textM} />
                          <span>Inspect Snapshot Data</span>
                        </button>

                        <button
                          onClick={() => setComparingVersion(v)}
                          style={{
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: '7px 14px',
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: C.textB,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Icon d={COMPARE_ICON} size={14} color={C.textM} />
                          <span>Compare with Current</span>
                        </button>

                        {!isLatest && (
                          <button
                            onClick={() => handleRestoreVersion(v)}
                            disabled={restoringId === v.id}
                            style={{
                              background: C.grad,
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '7px 16px',
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: restoringId === v.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                            }}
                          >
                            <Icon d={RESTORE_ICON} size={14} color="#fff" />
                            <span>{restoringId === v.id ? 'Restoring...' : `Restore v${v.version_number}.0`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── Inspect Snapshot Modal ─── */}
              {inspectingVersion && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(15,23,42,0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  padding: 20,
                }}>
                  <div style={{
                    background: C.surface,
                    borderRadius: 20,
                    maxWidth: 780,
                    width: '100%',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: C.textH }}>
                        Snapshot v{inspectingVersion.version_number}.0 Inspection
                      </div>
                      <button
                        onClick={() => setInspectingVersion(null)}
                        style={{ background: 'none', border: 'none', fontSize: 18, color: C.textSub, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ padding: 24, overflowY: 'auto', flex: 1, fontSize: 13, lineHeight: 1.6 }}>
                      <pre style={{
                        background: '#0f172a',
                        color: '#38bdf8',
                        padding: 16,
                        borderRadius: 12,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        overflowX: 'auto',
                      }}>
                        {JSON.stringify(inspectingVersion.snapshot_data, null, 2)}
                      </pre>
                    </div>

                    <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button
                        onClick={() => setInspectingVersion(null)}
                        style={{
                          background: C.surfaceAlt,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Compare with Current Modal ─── */}
              {comparingVersion && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(15,23,42,0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  padding: 20,
                }}>
                  <div style={{
                    background: C.surface,
                    borderRadius: 20,
                    maxWidth: 900,
                    width: '100%',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: C.textH }}>
                        Diff: Version v{comparingVersion.version_number}.0 vs Current Live
                      </div>
                      <button
                        onClick={() => setComparingVersion(null)}
                        style={{ background: 'none', border: 'none', fontSize: 18, color: C.textSub, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="compare-modal-grid">
                      {/* Left: Snapshot Version */}
                      <div style={{ background: C.surfaceAlt, padding: 18, borderRadius: 12, border: `1px solid ${C.border}` }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: C.primary, marginBottom: 12 }}>
                          Snapshot v{comparingVersion.version_number}.0 ({comparingVersion.changed_section})
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 4 }}>Objectives</div>
                          <FormattedMarkdownContent text={comparingVersion.snapshot_data?.brd?.objectives || 'Baseline'} />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 4 }}>Architecture</div>
                          <FormattedMarkdownContent text={comparingVersion.snapshot_data?.architecture?.hld_summary || 'Baseline HLD'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase' }}>Budget (Mid)</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: C.primary, marginTop: 4 }}>
                            {comparingVersion.snapshot_data?.estimate?.mid_estimate_usd
                              ? fmtUSD(comparingVersion.snapshot_data.estimate.mid_estimate_usd, 45000)
                              : comparingVersion.snapshot_data?.estimate?.cost_band || 'Standard'}
                          </div>
                        </div>
                      </div>

                      {/* Right: Current Live Version */}
                      <div style={{ background: '#f0fdf4', padding: 18, borderRadius: 12, border: '1px solid #bbf7d0' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#15803d', marginBottom: 12 }}>
                          Current Live Deliverable (Active)
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>Objectives</div>
                          <FormattedMarkdownContent text={currentBrd?.objectives || 'Live Objectives'} />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>Architecture</div>
                          <FormattedMarkdownContent text={currentArch?.hld_summary || 'Live Architecture'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Budget (Mid)</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                            {currentEst?.mid_estimate_usd
                              ? fmtUSD(currentEst.mid_estimate_usd, 45000)
                              : currentEst?.cost_band || 'Standard'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button
                        onClick={() => setComparingVersion(null)}
                        style={{
                          background: C.surfaceAlt,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Close Comparison
                      </button>
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
          .version-mobile-toggle { display: inline-flex !important; }
          .version-main {
            margin-left: 0 !important;
            padding: 82px 16px 48px !important;
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }
        }
        @media (max-width: 640px) {
          .version-main { padding: 76px 10px 36px !important; overflow-x: hidden !important; }
          .version-card { padding: 16px 14px !important; }
          .version-highlights-grid { grid-template-columns: 1fr !important; }
          .version-card-actions { width: 100% !important; }
          .version-card-actions button { width: 100% !important; justify-content: center !important; }
          .compare-modal-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 380px) {
          .version-main { padding: 72px 8px 28px !important; }
        }
      `}</style>
    </div>
  );
}
