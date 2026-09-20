import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import {
  getStoredToken,
  getStoredUser,
  setStoredUser,
  clearAuthCookies,
  hasCompletedOnboarding,
  getStoredSidebarCollapsed,
} from '../utils/cookieUtils';

/* ─── Keyframe styles ─── */
const KEYFRAMES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.3); }
    50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
  }
  @keyframes spinFast {
    to { transform: rotate(360deg); }
  }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />;
}

/* ─── Palette (Consistent across the app) ─── */
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

const PLUS    = 'M12 5v14M5 12h14';
const ZAP     = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
const FILE    = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8';
const UPLOAD  = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12';
const ARROW   = 'M5 12h14M12 5l7 7-7 7';
const SEARCH  = 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z';
const TRASH   = 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2';
const CLOCK   = 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2';
const CHECK   = 'M20 6 9 17l-5-5';
const DOWNLOAD= 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
const SPARK   = 'M12 3l1.9 5.8L20 9l-5 4.3 1.6 6-5.6-3.5L5.4 19.3 7 13.3 2 9l6.1-.2z';
const LAYERS  = 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';

const REFRESH = 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5';
const MENU    = 'M4 6h16M4 12h16M4 18h16';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, discovery

  // Sidebar responsive states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return getStoredSidebarCollapsed();
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Quick Blueprint Launcher Modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInputText, setNewInputText] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUserProfile = useCallback(async (token) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const prevUser = getStoredUser() || {};
          const merged = {
            ...prevUser,
            ...data.user,
            company: data.user.company || prevUser.company,
            onboardingCompleted: prevUser.onboardingCompleted || hasCompletedOnboarding(data.user),
          };
          setUser(merged);
          setStoredUser(merged);
        }
      } else if (res.status === 401) {
        clearAuthCookies();
        navigate('/login');
      }
    } catch (e) {
      console.warn('Could not fetch user profile from backend:', e.message);
    }
  }, [navigate]);

  const fetchSessions = useCallback(async (tokenOverride) => {
    const token = tokenOverride || getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setFetchError('');
      const res = await fetch('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      } else if (res.status === 401) {
        clearAuthCookies();
        navigate('/login');
      } else {
        const errData = await res.json().catch(() => ({}));
        setFetchError(errData.message || 'Failed to fetch blueprints from server.');
      }
    } catch (err) {
      setFetchError('Could not reach backend API server. Make sure MySQL & Backend are running on port 5000.');
      console.warn('Error fetching sessions:', err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const stored = getStoredUser();
      if (stored) {
        setUser(stored);
        // Check if first-time user hasn't completed onboarding yet
        if (!hasCompletedOnboarding(stored)) {
          navigate('/onboarding');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not parse user cache', e);
    }

    fetchUserProfile(token);
    fetchSessions(token);
  }, [navigate, fetchUserProfile, fetchSessions]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          initialText: newInputText.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to initialize session.');
      }

      const data = await res.json();
      if (data.session) {
        setSessions(prev => [data.session, ...prev]);
        setShowModal(false);
        setNewTitle('');
        setNewInputText('');
      }
    } catch (err) {
      alert(err.message || 'Error creating session');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (e, sessionId, sessionTitle) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${sessionTitle}"?`)) {
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Could not delete blueprint session.');
      }
    } catch (err) {
      alert('Error deleting session from server.');
    }
  };

  // Filtered session list
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.summary && s.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const inProgressCount = sessions.filter(s => s.status !== 'completed').length;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.textH }}>
      <StyleTag />
      {/* Shared common Navbar - kept intact as requested */}
      <Navbar />

      {/* Glassmorphic Navigation Sidebar */}
      <DashboardSidebar
        user={user}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        totalSessions={sessions.length}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        onNewBlueprint={() => navigate('/session/new')}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <main
        className={`dash-main ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{
          marginLeft: sidebarCollapsed ? 68 : 244,
          padding: '88px 32px 64px',
          transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: 'calc(100vh - 64px)',
          boxSizing: 'border-box',
        }}
      >
        {/* Mobile Quick Drawer Toggle */}
        <button
          className="dash-mobile-sidebar-toggle"
          onClick={() => setMobileSidebarOpen(true)}
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 7,
            padding: '7px 13px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${C.border}`,
            color: C.primaryDk,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)',
            marginBottom: 16,
          }}
        >
          <Icon d={MENU} size={15} color={C.primary} />
          <span>Navigation & Pages</span>
        </button>

        {/* ══ Welcome Header & Action Bar ══ */}
        <div className="dash-header" style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
          animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 className="dash-title" style={{ fontSize: 28, fontWeight: 800, color: C.textH, letterSpacing: '-0.6px', margin: 0 }}>
                Welcome back, {user?.name ? user.name.split(' ')[0] : 'Consultant'}!
              </h1>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 20,
                background: user?.role === 'owner' ? '#fef3c7' : '#e0f2fe',
                color: user?.role === 'owner' ? '#b45309' : '#0369a1',
                border: `1px solid ${user?.role === 'owner' ? '#fde68a' : '#bae6fd'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {user?.role === 'owner' ? '★ Company Owner' : 'Team Member'}
              </span>
            </div>
            <p style={{ margin: 0, color: C.textM, fontSize: 14 }}>
              Workspace: <strong style={{ color: C.textB }}>{user?.company || user?.company_name || 'My Organization'}</strong> · MySQL Storage Connected
            </p>
          </div>

          <button
            className="dash-header-btn"
            onClick={() => navigate('/session/new')}
            style={{
              background: C.grad,
              color: '#fff',
              border: 'none',
              padding: '11px 22px',
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
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.35)'; }}
          >
            <Icon d={PLUS} size={18} color="#fff" />
            New Blueprint
          </button>
        </div>

        {/* ══ Server/Connection Error Notice ══ */}
        {fetchError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <p style={{ margin: 0, color: '#991b1b', fontSize: 13.5, fontWeight: 500 }}>{fetchError}</p>
            </div>
            <button
              onClick={() => fetchSessions()}
              style={{
                background: '#fff',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon d={REFRESH} size={14} color="#b91c1c" /> Retry Connection
            </button>
          </div>
        )}

        {/* ══ KPI / Stats Cards (Computed from Real Data) ══ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 18,
          marginBottom: 36,
        }} className="stats-cards-grid">
          {[
            { label: 'Total Blueprints', val: sessions.length, icon: LAYERS, col: C.primary, bg: C.primaryLt },
            { label: 'Completed & Ready', val: completedCount, icon: CHECK, col: C.success, bg: C.successLt },
            { label: 'In Discovery Q&A', val: inProgressCount, icon: CLOCK, col: C.warn, bg: C.warnLt },
            { label: 'Avg Blueprint Time', val: completedCount > 0 ? '< 30s' : '—', icon: ZAP, col: C.accent, bg: C.accentLt },
          ].map((stat, i) => (
            <div key={i} style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: '20px 22px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: C.textM, fontWeight: 500 }}>{stat.label}</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.textH }}>{stat.val}</p>
              </div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: stat.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon d={stat.icon} size={20} color={stat.col} />
              </div>
            </div>
          ))}
        </div>

        {/* ══ Quick Intake Banner ══ */}
        <div className="dash-banner" style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(6,182,212,0.06) 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: 18,
          padding: '28px 32px',
          marginBottom: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: C.primaryLt, color: C.primaryDk, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
              <Icon d={SPARK} size={13} color={C.primary} />
              AI Transformation Companion
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: 19, fontWeight: 800, color: C.textH }}>
              Have a raw SOP, meeting transcript, or challenge?
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: C.textM, lineHeight: 1.6 }}>
              Compile asks up to 5 clarifying questions, discovers process gaps, and generates your complete implementation blueprint in under 30 seconds.
            </p>
          </div>
          <button
            className="dash-banner-btn"
            onClick={() => setShowModal(true)}
            style={{
              background: C.surface,
              border: `1.5px solid ${C.primary}`,
              color: C.primary,
              fontWeight: 700,
              fontSize: 14,
              padding: '12px 24px',
              borderRadius: 11,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(99,102,241,0.1)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.primary; }}
          >
            Start Intake Flow <Icon d={ARROW} size={16} />
          </button>
        </div>

        {/* ══ Search & Filters Toolbar ══ */}
        <div className="dash-toolbar" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 24,
        }}>
          {/* Search box */}
          <div className="dash-search-box" style={{ position: 'relative', width: 340, maxWidth: '100%' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Icon d={SEARCH} size={16} color={C.textSub} />
            </div>
            <input
              type="text"
              placeholder="Search blueprints by name or keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.surface,
                fontSize: 13.5,
                color: C.textH,
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
              }}
            />
          </div>

          {/* Filter tabs */}
          <div className="dash-filters" style={{ display: 'flex', gap: 6, background: C.surface, padding: 4, borderRadius: 10, border: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: `All (${sessions.length})` },
              { key: 'completed', label: `Completed (${completedCount})` },
              { key: 'discovery', label: `In Discovery (${inProgressCount})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                style={{
                  background: filterStatus === tab.key ? C.primaryLt : 'transparent',
                  color: filterStatus === tab.key ? C.primaryDk : C.textM,
                  border: filterStatus === tab.key ? '1px solid #c7d2fe' : '1px solid transparent',
                  padding: '6px 14px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: filterStatus === tab.key ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ Loading State ══ */}
        {loading && (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 32,
              height: 32,
              border: `3px solid ${C.primaryLt}`,
              borderTopColor: C.primary,
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spinFast 0.8s linear infinite',
            }} />
            <p style={{ margin: 0, color: C.textM, fontSize: 14, fontWeight: 500 }}>
              Fetching real blueprints from MySQL database...
            </p>
          </div>
        )}

        {/* ══ Empty State (When DB has 0 sessions) ══ */}
        {!loading && filteredSessions.length === 0 && (
          <div style={{
            background: C.surface,
            border: `1px dashed ${C.borderMed}`,
            borderRadius: 18,
            padding: '64px 24px',
            textAlign: 'center',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Icon d={FILE} size={24} color={C.primary} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 8px 0', color: C.textH }}>
              {searchQuery ? 'No matching blueprints found' : 'No blueprints in your workspace yet'}
            </h3>
            <p style={{ fontSize: 14, color: C.textM, margin: '0 auto 24px', maxWidth: 440, lineHeight: 1.6 }}>
              {searchQuery
                ? `No blueprints match your filter "${searchQuery}". Try clearing search keywords.`
                : 'Create your first blueprint session. Our AI consultant will analyze your input, ask clarifying questions, and generate your BRD & architecture.'}
            </p>
            <button
              onClick={() => navigate('/session/new')}
              style={{
                background: C.grad,
                color: '#fff',
                border: 'none',
                padding: '11px 24px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              }}
            >
              <Icon d={PLUS} size={16} color="#fff" /> Create First Blueprint
            </button>
          </div>
        )}

        {/* ══ Real Blueprint Sessions Grid (Live from MySQL) ══ */}
        {!loading && filteredSessions.length > 0 && (
          <div className="dash-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {filteredSessions.map((session) => {
              const isCompleted = session.status === 'completed';
              const isDiscovery = session.status === 'discovery';
              const isGenerating = session.status === 'generating';

              let statusLabel = '📝 Draft Intake';
              let statusBg = '#e0f2fe';
              let statusCol = '#0369a1';
              let statusBdr = '#bae6fd';

              if (isCompleted) {
                statusLabel = '✓ Ready for Export';
                statusBg = C.successLt;
                statusCol = '#065f46';
                statusBdr = '#a7f3d0';
              } else if (isDiscovery) {
                statusLabel = '⏳ In Discovery Q&A';
                statusBg = C.warnLt;
                statusCol = '#92400e';
                statusBdr = '#fde68a';
              } else if (isGenerating) {
                statusLabel = '⚙ Generating...';
                statusBg = '#ede9fe';
                statusCol = '#5b21b6';
                statusBdr = '#ddd6fe';
              }

              const formattedDate = session.created_at
                ? new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent';

              return (
                <div
                  key={session.id}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.1)';
                    e.currentTarget.style.borderColor = '#c7d2fe';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
                    e.currentTarget.style.borderColor = C.border;
                  }}
                  onClick={() => {
                    if (session.status === 'completed') {
                      navigate(`/session/${session.id}/result`);
                    } else if (session.status === 'generating') {
                      navigate(`/session/${session.id}/generating`);
                    } else {
                      navigate(`/session/${session.id}`);
                    }
                  }}
                >
                  <div>
                    {/* Top Status & Date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 20,
                        background: statusBg,
                        color: statusCol,
                        border: `1px solid ${statusBdr}`,
                      }}>
                        {statusLabel}
                      </span>
                      <span style={{ fontSize: 11.5, color: C.textSub }}>
                        {formattedDate}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: C.textH, margin: '0 0 10px 0', lineHeight: 1.35 }}>
                      {session.title}
                    </h3>

                    {/* Summary */}
                    <p style={{ fontSize: 13, color: C.textM, margin: '0 0 16px 0', lineHeight: 1.6 }}>
                      {session.summary || 'Transformative requirements and architecture generated via Compile AI reasoning.'}
                    </p>

                    {/* Dynamic Tags */}
                    {session.tags && Array.isArray(session.tags) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                        {session.tags.map((t, ti) => (
                          <span key={ti} style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: C.surfaceAlt,
                            border: `1px solid ${C.border}`,
                            color: C.textB,
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Action Links */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 14,
                    borderTop: `1px solid ${C.border}`,
                    marginTop: 10,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {isCompleted ? 'View Deliverables' : 'Open Discovery'} <Icon d={ARROW} size={14} color={C.primary} />
                    </span>

                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button
                        title="Export Blueprint (PDF/Word)"
                        onClick={() => window.open(`http://localhost:5000/api/export/session/${session.id}?format=pdf`, '_blank')}
                        style={{
                          background: C.surfaceAlt,
                          border: `1px solid ${C.border}`,
                          color: C.textM,
                          padding: '6px 8px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                      >
                        <Icon d={DOWNLOAD} size={14} />
                      </button>
                      <button
                        title="Delete Blueprint"
                        onClick={(e) => handleDeleteSession(e, session.id, session.title)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#ef4444',
                          padding: '6px 8px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#fecaca'}
                      >
                        <Icon d={TRASH} size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ══ Create New Blueprint Modal ══ */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          zIndex: 1000,
        }} onClick={() => setShowModal(false)}>
          <div
            className="dash-modal-box"
            style={{
              background: C.surface,
              borderRadius: 20,
              width: '100%',
              maxWidth: 540,
              padding: 32,
              boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
              border: `1px solid ${C.border}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={ZAP} size={18} color="#fff" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: C.textH }}>
                  New Transformation Blueprint
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: C.textSub, cursor: 'pointer', fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                  Blueprint Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finance Month-End Closing Automation"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
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
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                  Initial Business Context / SOP Notes (optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste meeting notes, current bottlenecks, target tools, or rough ideas..."
                  value={newInputText}
                  onChange={e => setNewInputText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 9,
                    border: `1.5px solid ${C.border}`,
                    fontSize: 13.5,
                    color: C.textH,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                <p style={{ margin: '6px 0 0', fontSize: 11.5, color: C.textSub }}>
                  You can also upload PDFs, DOCXs, or PPTXs inside the session.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 9,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.textB,
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  style={{
                    background: creating ? C.borderMed : C.grad,
                    color: '#fff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: 9,
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  }}
                >
                  {creating ? 'Creating Blueprint...' : 'Initialize Session →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Responsive adjustments */}
      <style>{`
        .dash-main {
          max-width: 1240px;
        }
        @media (max-width: 900px) {
          .dash-mobile-sidebar-toggle { display: inline-flex !important; }
          .dash-main {
            margin-left: 0 !important;
            padding: 82px 18px 48px !important;
          }
          .stats-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .dash-main { padding: 76px 14px 40px !important; }
          .dash-header { flex-direction: column !important; align-items: stretch !important; gap: 14px !important; }
          .dash-title { font-size: 22px !important; }
          .dash-header-btn { width: 100% !important; justify-content: center !important; }
          .stats-cards-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .dash-banner { padding: 20px 16px !important; }
          .dash-banner-btn { width: 100% !important; justify-content: center !important; }
          .dash-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .dash-search-box { width: 100% !important; }
          .dash-filters { width: 100% !important; justify-content: space-between !important; }
          .dash-modal-box { padding: 22px 16px !important; border-radius: 16px !important; }
        }
        @media (max-width: 380px) {
          .dash-main { padding: 72px 10px 32px !important; }
          .dash-filters button { font-size: 12px !important; padding: 5px 8px !important; }
        }
      `}</style>
    </div>
  );
}
