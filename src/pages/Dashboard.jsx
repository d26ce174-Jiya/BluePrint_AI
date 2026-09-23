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

/* ─── Keyframes ─── */
const KEYFRAMES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spinFast {
    to { transform: rotate(360deg); }
  }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />;
}

function Icon({ d, size = 18, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
      className={`shrink-0 ${className}`}>
      <path d={d} />
    </svg>
  );
}

const PLUS = 'M12 5v14M5 12h14';
const ZAP = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
const FILE = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8';
const ARROW = 'M5 12h14M12 5l7 7-7 7';
const SEARCH = 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z';
const TRASH = 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2';
const CLOCK = 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2';
const CHECK = 'M20 6 9 17l-5-5';
const DOWNLOAD = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
const SPARK = 'M12 3l1.9 5.8L20 9l-5 4.3 1.6 6-5.6-3.5L5.4 19.3 7 13.3 2 9l6.1-.2z';
const LAYERS = 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';
const REFRESH = 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5';
const MENU = 'M4 6h16M4 12h16M4 18h16';

const STATS_META = [
  { key: 'total', label: 'Total Blueprints', icon: LAYERS, grad: 'from-indigo-500 to-indigo-400', glow: 'shadow-[0_4px_14px_rgba(99,102,241,0.35)]' },
  { key: 'completed', label: 'Completed & Ready', icon: CHECK, grad: 'from-emerald-500 to-emerald-400', glow: 'shadow-[0_4px_14px_rgba(16,185,129,0.35)]' },
  { key: 'discovery', label: 'In Discovery Q&A', icon: CLOCK, grad: 'from-amber-500 to-amber-400', glow: 'shadow-[0_4px_14px_rgba(245,158,11,0.35)]' },
  { key: 'avgtime', label: 'Avg Blueprint Time', icon: ZAP, grad: 'from-cyan-500 to-sky-400', glow: 'shadow-[0_4px_14px_rgba(6,182,212,0.35)]' },
];

function statusConfig(status) {
  if (status === 'completed') return { label: '✓ Ready for Export', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (status === 'discovery') return { label: '⏳ In Discovery Q&A', cls: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (status === 'generating') return { label: '⚙ Generating…', cls: 'text-violet-700 bg-violet-50 border-violet-200' };
  return { label: '📝 Draft Intake', cls: 'text-sky-700 bg-sky-50 border-sky-200' };
}

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

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.summary && s.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const inProgressCount = sessions.filter(s => s.status !== 'completed').length;

  const statValues = {
    total: sessions.length,
    completed: completedCount,
    discovery: inProgressCount,
    avgtime: completedCount > 0 ? '< 30s' : '—',
  };

  const isOwner = user?.role === 'owner';

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      <StyleTag />

      {/* Ambient background glow — matches the sidebar's decorative blobs */}
      <div aria-hidden className="fixed top-[-120px] right-[-140px] w-[420px] h-[420px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />
      <div aria-hidden className="fixed bottom-[-160px] left-[-120px] w-[420px] h-[420px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }} />

      <Navbar />

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
        className={`relative z-10 max-w-[1320px] transition-[margin-left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] px-4 sm:px-6 pt-24 lg:pt-28 pb-16 box-border ${sidebarCollapsed ? 'lg:ml-[74px]' : 'lg:ml-[260px]'}`}
      >
        {/* Mobile / tablet sidebar toggle */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden inline-flex items-center gap-2 mb-4 px-3.5 py-2 rounded-xl bg-white/85 backdrop-blur-md border border-slate-200/80 text-indigo-600 text-[12.5px] font-bold cursor-pointer shadow-[0_2px_8px_rgba(99,102,241,0.08)]"
        >
          <Icon d={MENU} size={15} color="#6366f1" />
          Navigation & Pages
        </button>

        {/* ══ Welcome Header & Action Bar ══ */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8" style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h1 className="text-[26px] sm:text-[28px] font-extrabold text-slate-900 tracking-[-0.6px] m-0">
                Welcome back, {user?.name ? user.name.split(' ')[0] : 'Consultant'}!
              </h1>
              <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border tracking-[0.3px] whitespace-nowrap ${isOwner ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-sky-700 bg-sky-50 border-sky-200'}`}>
                {isOwner ? '★ Company Owner' : 'Team Member'}
              </span>
            </div>
            <p className="m-0 text-[13.5px] text-slate-500">
              Workspace: <strong className="text-slate-700 font-semibold">{user?.company || user?.company_name || 'My Organization'}</strong> · MySQL Storage Connected
            </p>
          </div>

          <button
            onClick={() => navigate('/session/new')}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white border-none px-5 py-2.5 rounded-xl font-bold text-[14px] cursor-pointer shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(99,102,241,0.5)] shrink-0"
          >
            <Icon d={PLUS} size={18} color="#fff" />
            New Blueprint
          </button>
        </div>

        {/* ══ Server/Connection Error Notice ══ */}
        {fetchError && (
          <div className="flex items-center justify-between flex-wrap gap-3 bg-red-50/80 backdrop-blur border border-red-200 rounded-2xl px-4.5 py-3.5 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚠️</span>
              <p className="m-0 text-[13.5px] font-medium text-red-800">{fetchError}</p>
            </div>
            <button
              onClick={() => fetchSessions()}
              className="inline-flex items-center gap-1.5 bg-white border border-red-300 text-red-700 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold cursor-pointer transition-colors hover:bg-red-50"
            >
              <Icon d={REFRESH} size={14} color="#b91c1c" /> Retry Connection
            </button>
          </div>
        )}

        {/* ══ KPI / Stats Cards ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-9">
          {STATS_META.map((stat) => (
            <div
              key={stat.key}
              className="flex items-center justify-between bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-2xl px-5 py-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(99,102,241,0.1)] hover:border-indigo-200/70"
            >
              <div className="min-w-0">
                <p className="m-0 mb-1.5 text-[12.5px] font-medium text-slate-500">{stat.label}</p>
                <p className="m-0 text-[24px] font-extrabold text-slate-900">{statValues[stat.key]}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.grad} flex items-center justify-center shrink-0 ${stat.glow}`}>
                <Icon d={stat.icon} size={20} color="#fff" />
              </div>
            </div>
          ))}
        </div>

        {/* ══ Quick Intake Banner ══ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-br from-indigo-50/80 via-white/60 to-cyan-50/60 backdrop-blur-xl border border-indigo-100 rounded-[22px] px-6 sm:px-8 py-7 mb-9 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100/80 text-indigo-700 text-[11.5px] font-bold mb-2.5">
              <Icon d={SPARK} size={13} color="#4f46e5" />
              AI Transformation Companion
            </div>
            <h2 className="m-0 mb-1.5 text-[19px] font-extrabold text-slate-900">
              Have a raw SOP, meeting transcript, or challenge?
            </h2>
            <p className="m-0 text-[13.5px] text-slate-500 leading-relaxed">
              Compile asks up to 5 clarifying questions, discovers process gaps, and generates your complete implementation blueprint in under 30 seconds.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-white border-[1.5px] border-indigo-500 text-indigo-600 font-bold text-[13.5px] px-5 py-2.5 rounded-xl cursor-pointer shadow-[0_2px_8px_rgba(99,102,241,0.1)] shrink-0 transition-all duration-200 hover:bg-gradient-to-br hover:from-indigo-500 hover:to-cyan-500 hover:text-white hover:border-transparent hover:shadow-[0_6px_20px_rgba(99,102,241,0.35)]"
          >
            Start Intake Flow <Icon d={ARROW} size={16} />
          </button>
        </div>

        {/* ══ Search & Filters Toolbar ══ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-6">
          <div className="relative w-full md:w-[340px]">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon d={SEARCH} size={16} color="#94a3b8" />
            </div>
            <input
              type="text"
              placeholder="Search blueprints by name or keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none box-border shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-colors focus:border-indigo-300"
            />
          </div>

          <div className="flex flex-wrap gap-1 bg-white/70 backdrop-blur border border-slate-200/80 rounded-xl p-1 shrink-0">
            {[
              { key: 'all', label: `All (${sessions.length})` },
              { key: 'completed', label: `Completed (${completedCount})` },
              { key: 'discovery', label: `In Discovery (${inProgressCount})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={[
                  'px-3.5 py-1.5 rounded-lg text-[12.5px] cursor-pointer border-none transition-all duration-150 whitespace-nowrap',
                  filterStatus === tab.key
                    ? 'bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-cyan-50/60 text-indigo-700 font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_10px_rgba(99,102,241,0.12)]'
                    : 'bg-transparent text-slate-500 font-semibold hover:bg-slate-100/90 hover:text-slate-700',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ Loading State ══ */}
        {loading && (
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-2xl px-6 py-12 text-center shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <div
              className="w-8 h-8 rounded-full mx-auto mb-4 border-[3px] border-indigo-100"
              style={{ borderTopColor: '#6366f1', animation: 'spinFast 0.8s linear infinite' }}
            />
            <p className="m-0 text-[14px] font-medium text-slate-500">
              Fetching real blueprints from MySQL database...
            </p>
          </div>
        )}

        {/* ══ Empty State ══ */}
        {!loading && filteredSessions.length === 0 && (
          <div className="bg-white/70 backdrop-blur-xl border border-dashed border-slate-300 rounded-[22px] px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4.5">
              <Icon d={FILE} size={24} color="#6366f1" />
            </div>
            <h3 className="text-[19px] font-extrabold m-0 mb-2 text-slate-900">
              {searchQuery ? 'No matching blueprints found' : 'No blueprints in your workspace yet'}
            </h3>
            <p className="text-[14px] text-slate-500 mx-auto mb-6 max-w-[440px] leading-relaxed">
              {searchQuery
                ? `No blueprints match your filter "${searchQuery}". Try clearing search keywords.`
                : 'Create your first blueprint session. Our AI consultant will analyze your input, ask clarifying questions, and generate your BRD & architecture.'}
            </p>
            <button
              onClick={() => navigate('/session/new')}
              className="inline-flex items-center gap-2 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white border-none px-5 py-2.5 rounded-xl font-bold text-[14px] cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.3)] transition-all duration-200 hover:-translate-y-0.5"
            >
              <Icon d={PLUS} size={16} color="#fff" /> Create First Blueprint
            </button>
          </div>
        )}

        {/* ══ Blueprint Sessions Grid ══ */}
        {!loading && filteredSessions.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {filteredSessions.map((session) => {
              const status = statusConfig(session.status);
              const isCompleted = session.status === 'completed';
              const formattedDate = session.created_at
                ? new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent';

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (session.status === 'completed') navigate(`/session/${session.id}/result`);
                    else if (session.status === 'generating') navigate(`/session/${session.id}/generating`);
                    else navigate(`/session/${session.id}`);
                  }}
                  className="flex flex-col justify-between bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-2xl p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)] cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(99,102,241,0.12)] hover:border-indigo-200/70"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border tracking-[0.2px] whitespace-nowrap ${status.cls}`}>
                        {status.label}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2">{formattedDate}</span>
                    </div>

                    <h3 className="text-[17px] font-bold text-slate-900 m-0 mb-2.5 leading-snug">
                      {session.title}
                    </h3>

                    <p className="text-[13px] text-slate-500 m-0 mb-4 leading-relaxed">
                      {session.summary || 'Transformative requirements and architecture generated via Compile AI reasoning.'}
                    </p>

                    {session.tags && Array.isArray(session.tags) && session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4.5">
                        {session.tags.map((tg, ti) => (
                          <span key={ti} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-600">
                            {tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3.5 mt-2.5 border-t border-slate-100">
                    <span className="text-[13px] font-bold text-indigo-600 inline-flex items-center gap-1">
                      {isCompleted ? 'View Deliverables' : 'Open Discovery'} <Icon d={ARROW} size={14} color="#4f46e5" />
                    </span>

                    <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        title="Export Blueprint (PDF/Word)"
                        onClick={() => window.open(`http://localhost:5000/api/export/session/${session.id}?format=pdf`, '_blank')}
                        className="flex items-center bg-slate-50 border border-slate-200/80 text-slate-500 p-1.5 rounded-lg cursor-pointer transition-colors hover:border-indigo-300 hover:text-indigo-600"
                      >
                        <Icon d={DOWNLOAD} size={14} />
                      </button>
                      <button
                        title="Delete Blueprint"
                        onClick={(e) => handleDeleteSession(e, session.id, session.title)}
                        className="flex items-center bg-red-50 border border-red-200 text-red-500 p-1.5 rounded-lg cursor-pointer transition-colors hover:border-red-400"
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
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[1000]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-[22px] w-full max-w-[540px] p-6 sm:p-8 shadow-[0_32px_80px_rgba(15,23,42,0.25)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_4px_14px_rgba(99,102,241,0.4)]">
                  <Icon d={ZAP} size={18} color="#fff" />
                </div>
                <h2 className="text-[19px] font-extrabold m-0 text-slate-900">
                  New Transformation Blueprint
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-400 cursor-pointer text-sm transition-colors hover:text-slate-600 hover:border-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession}>
              <div className="mb-4.5">
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Blueprint Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finance Month-End Closing Automation"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-[14px] text-slate-900 outline-none box-border transition-colors focus:border-indigo-400"
                />
              </div>

              <div className="mb-5.5">
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Initial Business Context / SOP Notes (optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste meeting notes, current bottlenecks, target tools, or rough ideas..."
                  value={newInputText}
                  onChange={e => setNewInputText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-[13.5px] text-slate-900 outline-none resize-y box-border transition-colors focus:border-indigo-400"
                />
                <p className="m-0 mt-1.5 text-[11.5px] text-slate-400">
                  You can also upload PDFs, DOCXs, or PPTXs inside the session.
                </p>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-[13.5px] cursor-pointer transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-[13.5px] border-none shadow-[0_4px_14px_rgba(99,102,241,0.35)] transition-all duration-200 ${creating ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-br from-indigo-500 to-cyan-500 cursor-pointer hover:-translate-y-0.5'}`}
                >
                  {creating ? 'Creating Blueprint...' : 'Initialize Session →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}