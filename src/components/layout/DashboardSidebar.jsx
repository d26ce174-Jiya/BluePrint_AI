import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getStoredSidebarCollapsed,
  setStoredSidebarCollapsed,
  hasCompletedOnboarding,
} from '../../utils/cookieUtils';

/* ─── High-Fidelity SVG Icons ─── */
function Icon({ d, size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={style}
    >
      <path d={d} />
    </svg>
  );
}

const DASHBOARD_ICON = 'M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zM3 16h7v5H3v-5z';
const INTAKE_ICON = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3-3 3 3';
const CHAT_ICON = 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z';
const BLUEPRINT_ICON = 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';
const HISTORY_ICON = 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z';
const SETTINGS_ICON = 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4 1.5l1.8 1.4-2 3.5-2.2-.9a7 7 0 0 1-2.4 1.4L14.2 25h-4.4l-.4-2.2a7 7 0 0 1-2.4-1.4l-2.2.9-2-3.5 1.8-1.4a7 7 0 0 1 0-2.8L2.8 14.5l2-3.5 2.2.9a7 7 0 0 1 2.4-1.4L9.8 8h4.4l.4 2.2a7 7 0 0 1 2.4 1.4l2.2-.9 2 3.5-1.8 1.4a7 7 0 0 1 0 2.8z';
const FRAMEWORK_ICON = 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z';
const PLUS_ICON = 'M12 5v14M5 12h14';
const COLLAPSE_ICON = 'M11 19l-7-7 7-7m8 14l-7-7 7-7';
const EXPAND_ICON = 'M13 5l7 7-7 7M5 5l7 7-7 7';
const CLOSE_ICON = 'M18 6L6 18M6 6l12 12';
const ONBOARD_ICON = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z';

export default function DashboardSidebar({
  user,
  filterStatus = 'all',
  setFilterStatus,
  totalSessions = 0,
  completedCount = 0,
  inProgressCount = 0,
  onNewBlueprint,
  collapsed: externalCollapsed,
  setCollapsed: externalSetCollapsed,
  mobileOpen = false,
  setMobileOpen,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState(null);

  // Persistent sidebar collapse state (synced with cookie/localStorage) — desktop only
  const [localCollapsed, setLocalCollapsed] = useState(() => {
    try {
      return getStoredSidebarCollapsed();
    } catch {
      return false;
    }
  });

  const isCollapsed = externalSetCollapsed !== undefined ? Boolean(externalCollapsed) : localCollapsed;

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setStoredSidebarCollapsed(nextVal);
    if (externalSetCollapsed) {
      externalSetCollapsed(nextVal);
    } else {
      setLocalCollapsed(nextVal);
    }
  };

  // Auto-collapse on narrow (but still desktop-class) viewports for a cleaner layout.
  // This only ever affects the fixed DESKTOP <aside>; the mobile drawer always
  // renders fully expanded regardless of this value (see renderSidebarBody below).
  useEffect(() => {
    const handleResize = () => {
      const narrow = window.innerWidth < 1280;
      if (narrow && !isCollapsed) {
        setStoredSidebarCollapsed(true);
        if (externalSetCollapsed) externalSetCollapsed(true);
        else setLocalCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [mobileOpen]);

  const isCurrentPage = (path) => location.pathname === path;
  const isSetupDone = hasCompletedOnboarding(user);

  /* ─── Streamlined, Curated Navigation (No Duplicates) ─── */
  const navItems = [
    {
      id: 'dash-all',
      title: 'Dashboard',
      subtitle: 'Overview & metrics',
      icon: DASHBOARD_ICON,
      action: () => {
        if (location.pathname !== '/dashboard') navigate('/dashboard');
        if (setFilterStatus) setFilterStatus('all');
        if (setMobileOpen) setMobileOpen(false);
      },
      badge: totalSessions > 0 ? `${totalSessions}` : null,
      badgeColor: '#4f46e5',
      badgeBg: '#eef2ff',
      isActive: isCurrentPage('/dashboard'),
    },
    {
      id: 'intake-flow',
      title: 'Transformation Intake',
      subtitle: 'SOPs, PRDs & Prompts',
      icon: INTAKE_ICON,
      action: () => {
        navigate('/session/new');
        if (setMobileOpen) setMobileOpen(false);
      },
      badge: 'New',
      badgeColor: '#0369a1',
      badgeBg: '#e0f2fe',
      isActive: isCurrentPage('/session/new') || isCurrentPage('/input'),
    },
    {
      id: 'discovery-chat',
      title: 'Discovery Chat',
      subtitle: 'AI Consultant Q&A',
      icon: CHAT_ICON,
      action: () => {
        navigate('/discovery');
        if (setMobileOpen) setMobileOpen(false);
      },
      badge: inProgressCount > 0 ? `${inProgressCount} active` : null,
      badgeColor: '#b45309',
      badgeBg: '#fef3c7',
      isActive:
        (location.pathname.startsWith('/session/') &&
          !location.pathname.includes('/result') &&
          !location.pathname.includes('/generating') &&
          location.pathname !== '/session/new') ||
        location.pathname.startsWith('/discovery'),
    },
    {
      id: 'blueprint-hub',
      title: 'Architecture Hub',
      subtitle: '6-Pillar BRD & HLD',
      icon: BLUEPRINT_ICON,
      action: () => {
        navigate('/blueprint');
        if (setMobileOpen) setMobileOpen(false);
      },
      badge: completedCount > 0 ? `${completedCount}` : null,
      badgeColor: '#047857',
      badgeBg: '#d1fae5',
      isActive:
        (location.pathname.startsWith('/blueprint') && !location.pathname.includes('/versions')) ||
        (location.pathname.includes('/result') && !location.pathname.includes('/versions')) ||
        location.pathname.includes('/generating'),
    },
    {
      id: 'version-history',
      title: 'Version History',
      subtitle: 'Snapshots & Rollbacks',
      icon: HISTORY_ICON,
      action: () => {
        navigate('/versions');
        if (setMobileOpen) setMobileOpen(false);
      },
      badge: 'Audit',
      badgeColor: '#4f46e5',
      badgeBg: '#eef2ff',
      isActive: location.pathname.includes('/versions'),
    },
    ...(!isSetupDone
      ? [
        {
          id: 'onboarding-link',
          title: 'Setup Guide',
          subtitle: 'Configure Workspace',
          icon: ONBOARD_ICON,
          action: () => {
            navigate('/onboarding');
            if (setMobileOpen) setMobileOpen(false);
          },
          badge: 'Setup',
          badgeColor: '#0369a1',
          badgeBg: '#e0f2fe',
          isActive: isCurrentPage('/onboarding'),
        },
      ]
      : []),
  ];

  const systemItems = [
    {
      id: 'settings',
      title: 'Settings & Models',
      subtitle: 'AI, API Keys & Security',
      icon: SETTINGS_ICON,
      action: () => {
        navigate('/settings');
        if (setMobileOpen) setMobileOpen(false);
      },
      isActive: isCurrentPage('/settings'),
    },
    {
      id: 'framework-docs',
      title: 'Architecture Framework',
      subtitle: 'Chaos to Commit SLA',
      icon: FRAMEWORK_ICON,
      action: () => {
        setDocModalOpen(true);
        if (setMobileOpen) setMobileOpen(false);
      },
      isActive: false,
    },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.company ? user.company.charAt(0).toUpperCase() : 'C');
  const orgName = user?.company || user?.company_name || 'Compile Workspace';
  const roleTitle = user?.role === 'owner' ? 'Owner' : 'Member';

  /* ─── Render Sidebar Inner Content ───
     variant "desktop" respects the real (possibly auto-collapsed) isCollapsed
     state. variant "mobile" ALWAYS renders fully expanded with labels — the
     mobile drawer is a full-width overlay, so a collapsed icon-only layout
     inside it would waste the space and hide every label. */
  const renderSidebarBody = (variant = 'desktop') => {
    const isMobile = variant === 'mobile';
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div className={`flex flex-col h-full box-border overflow-y-auto overflow-x-visible ${collapsed ? 'px-2.5 py-4' : 'px-3.5 py-4'}`}>

        {/* ─── 1. Header Capsule with Workspace Identity + Collapse Toggle ─── */}
        <div
          className={`relative flex items-center border-b border-slate-200/70 mb-4 ${collapsed ? 'justify-center pb-4 pt-0.5' : 'justify-between pb-4 pt-1 px-1.5'}`}
          onMouseEnter={() => collapsed && setHoveredItemId('workspace-head')}
          onMouseLeave={() => collapsed && setHoveredItemId(null)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar badge */}
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-extrabold text-[15px] flex items-center justify-center shrink-0 cursor-pointer shadow-[0_0_0_2px_rgba(99,102,241,0.18),0_4px_14px_rgba(99,102,241,0.35)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_0_3px_rgba(99,102,241,0.28),0_6px_18px_rgba(99,102,241,0.45)]"
              onClick={() => { navigate('/settings'); if (isMobile && setMobileOpen) setMobileOpen(false); }}
              title={collapsed ? `${orgName} (${roleTitle})` : undefined}
            >
              {userInitial}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[13.5px] text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis leading-tight tracking-[0.1px]" title={orgName}>
                  {orgName}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md tracking-[0.3px] border ${user?.role === 'owner'
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-sky-700 bg-sky-50 border-sky-200'
                      }`}
                  >
                    {user?.role === 'owner' ? '★ Owner' : 'Member'}
                  </span>
                  <span className="text-[11px] text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                    {user?.name ? user.name.split(' ')[0] : 'Architect'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Header Collapse / Expand Toggle Button — desktop only, mobile has its own X */}
          {!collapsed && !isMobile && (
            <button
              onClick={toggleCollapse}
              title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              className="shrink-0 flex items-center justify-center p-1.5 rounded-lg border border-slate-200/80 bg-transparent text-slate-400 cursor-pointer transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
            >
              <Icon d={collapsed ? EXPAND_ICON : COLLAPSE_ICON} size={14} color="currentColor" />
            </button>
          )}

          {/* Collapsed floating tooltip for header (desktop-collapsed only) */}
          {collapsed && !isMobile && hoveredItemId === 'workspace-head' && (
            <div className="sidebar-floating-tooltip">
              <div className="font-bold text-white">{orgName}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{roleTitle} • Click to open Settings</div>
              <div className="tooltip-arrow" />
            </div>
          )}
        </div>

        {/* ─── 2. "+ New Blueprint" Primary CTA ─── */}
        <div className="relative mb-4">
          <button
            onClick={() => {
              if (onNewBlueprint && typeof onNewBlueprint === 'function') {
                onNewBlueprint();
              } else {
                navigate('/session/new');
              }
              if (setMobileOpen) setMobileOpen(false);
            }}
            onMouseEnter={() => collapsed && setHoveredItemId('new-blueprint-btn')}
            onMouseLeave={() => collapsed && setHoveredItemId(null)}
            className={`sidebar-cta-btn w-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white border-none font-bold text-[13px] cursor-pointer flex items-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-indigo-300 ${collapsed ? 'justify-center py-2.5 px-0 rounded-xl' : 'justify-start py-2.5 px-3.5 rounded-xl'
              }`}
          >
            <Icon d={PLUS_ICON} size={16} color="#ffffff" />
            {!collapsed && <span>New Blueprint</span>}
          </button>

          {/* Floating tooltip when collapsed (desktop-collapsed only) */}
          {collapsed && !isMobile && hoveredItemId === 'new-blueprint-btn' && (
            <div className="sidebar-floating-tooltip">
              <div className="font-bold text-white">+ New Blueprint</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Start intake from prompt, SOP or document</div>
              <div className="tooltip-arrow" />
            </div>
          )}
        </div>

        {/* ─── 3. Workflow Navigation Items ─── */}
        <div className="mb-4">
          {!collapsed && (
            <div className="text-[10px] font-bold uppercase tracking-[1.1px] text-slate-400 px-2.5 pb-2">
              Workspace Pipeline
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isHovered = collapsed && !isMobile && hoveredItemId === item.id;
              return (
                <div key={`${variant}-${item.id}`} className="relative">
                  <button
                    onClick={item.action}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className={[
                      'group relative w-full flex items-center rounded-xl border-none cursor-pointer text-left',
                      'transition-all duration-150 ease-out',
                      collapsed ? 'justify-center py-2.5 px-0' : 'justify-between py-2.5 px-2.5',
                      item.isActive
                        ? 'bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-cyan-50/60 text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_10px_rgba(99,102,241,0.12)]'
                        : hoveredItemId === item.id && !collapsed
                          ? 'bg-slate-100/90 text-slate-700'
                          : 'bg-transparent text-slate-600 hover:bg-slate-100/90',
                    ].join(' ')}
                  >
                    {/* Active left accent bar */}
                    {item.isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-gradient-to-b from-indigo-500 to-cyan-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        d={item.icon}
                        size={17}
                        color={item.isActive ? '#6366f1' : hoveredItemId === item.id ? '#0f172a' : '#94a3b8'}
                        className={item.isActive ? 'drop-shadow-[0_0_5px_rgba(129,140,248,0.4)]' : ''}
                      />
                      {!collapsed && (
                        <div className="min-w-0">
                          <div className={`text-[13px] leading-snug ${item.isActive ? 'font-bold text-indigo-700' : 'font-semibold text-slate-800'}`}>
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className={`text-[10.5px] mt-px whitespace-nowrap overflow-hidden text-ellipsis ${item.isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!collapsed && item.badge && (
                      <span
                        className="text-[10px] font-bold px-[7px] py-[2px] rounded-full border border-slate-200/70 ml-1.5 whitespace-nowrap shrink-0"
                        style={{
                          background: item.badgeBg || (item.isActive ? '#e0e7ff' : '#f1f5f9'),
                          color: item.badgeColor || (item.isActive ? '#4f46e5' : '#64748b'),
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Collapsed floating tooltip (desktop-collapsed only — never on mobile) */}
                  {isHovered && (
                    <div className="sidebar-floating-tooltip">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{item.title}</span>
                        {item.badge && (
                          <span className="text-[9.5px] px-1 py-px rounded bg-white/20 text-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</div>
                      )}
                      <div className="tooltip-arrow" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* ─── 4. System & Tools Navigation ─── */}
        <div className="mb-auto">
          {!collapsed && (
            <div className="text-[10px] font-bold uppercase tracking-[1.1px] text-slate-400 px-2.5 pt-2.5 pb-2 border-t border-slate-200/70">
              System & Tools
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {systemItems.map((item) => {
              const isHovered = collapsed && !isMobile && hoveredItemId === item.id;
              return (
                <div key={`${variant}-${item.id}`} className="relative">
                  <button
                    onClick={item.action}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className={[
                      'group relative w-full flex items-center rounded-xl border-none cursor-pointer text-left',
                      'transition-all duration-150 ease-out',
                      collapsed ? 'justify-center py-2.5 px-0' : 'justify-between py-2.5 px-2.5',
                      item.isActive
                        ? 'bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-cyan-50/60 text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_10px_rgba(99,102,241,0.12)]'
                        : hoveredItemId === item.id && !collapsed
                          ? 'bg-slate-100/90 text-slate-700'
                          : 'bg-transparent text-slate-600 hover:bg-slate-100/90',
                    ].join(' ')}
                  >
                    {item.isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-gradient-to-b from-indigo-500 to-cyan-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                    )}
                    <div className="flex items-center gap-2.5">
                      <Icon
                        d={item.icon}
                        size={16}
                        color={item.isActive ? '#6366f1' : hoveredItemId === item.id ? '#0f172a' : '#94a3b8'}
                      />
                      {!collapsed && (
                        <div>
                          <div className={`text-[13px] ${item.isActive ? 'font-bold text-indigo-700' : 'font-semibold text-slate-800'}`}>
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[10.5px] text-slate-400 mt-px">{item.subtitle}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Collapsed floating tooltip (desktop-collapsed only) */}
                  {isHovered && (
                    <div className="sidebar-floating-tooltip">
                      <div className="font-bold text-white">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</div>
                      )}
                      <div className="tooltip-arrow" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* ─── 5. Pinned Footer: Live Status & Toggle Button ─── */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex flex-col gap-2">
          {!collapsed ? (
            <div className="bg-white/70 backdrop-blur border border-slate-200/80 rounded-xl px-2.5 py-2 flex items-center justify-between shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-1.5">
                <div className="db-status-dot" />
                <span className="text-[11.5px] font-semibold text-slate-600">MySQL 8.0 Live</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 rounded-md">
                Port 3306
              </span>
            </div>
          ) : (
            <div
              className="flex justify-center py-1 relative"
              onMouseEnter={() => setHoveredItemId('db-pill')}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <div className="db-status-dot" />
              {!isMobile && hoveredItemId === 'db-pill' && (
                <div className="sidebar-floating-tooltip">
                  <div className="font-bold text-white">MySQL 8.0 Live</div>
                  <div className="text-[11px] text-slate-400">Connected on Port 3306</div>
                  <div className="tooltip-arrow" />
                </div>
              )}
            </div>
          )}

          {/* Bottom Expand / Collapse Button — desktop only; mobile closes via the header X */}
          {!isMobile && (
            <div className="relative">
              <button
                onClick={toggleCollapse}
                onMouseEnter={() => collapsed && setHoveredItemId('toggle-collapse-btn')}
                onMouseLeave={() => collapsed && setHoveredItemId(null)}
                className={`w-full flex items-center rounded-lg border border-slate-200/80 bg-white/60 text-slate-400 cursor-pointer text-xs font-semibold transition-all duration-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 ${collapsed ? 'justify-center py-2 px-0' : 'justify-between py-1.5 px-2.5'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon d={collapsed ? EXPAND_ICON : COLLAPSE_ICON} size={14} color="currentColor" />
                  {!collapsed && <span>Collapse Sidebar</span>}
                </div>
                {!collapsed && (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 rounded-md">
                    Ctrl+B
                  </span>
                )}
              </button>

              {collapsed && hoveredItemId === 'toggle-collapse-btn' && (
                <div className="sidebar-floating-tooltip">
                  <div className="font-bold text-white">Expand Sidebar</div>
                  <div className="text-[11px] text-slate-400">Shortcut: Ctrl+B</div>
                  <div className="tooltip-arrow" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ─── DESKTOP GLASS SIDEBAR (lg and up; respects real collapsed state) ─── */}
      <aside
        className="dashboard-desktop-sidebar fixed left-0 bottom-0 z-[85] border-r border-slate-200/70 shadow-[6px_0_32px_rgba(15,23,42,0.06)] backdrop-blur-2xl bg-white/85 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ top: 64, width: isCollapsed ? 74 : 260 }}
      >
        {/* Subtle ambient glow decoration */}
        <div
          aria-hidden
          className="absolute -top-16 -right-20 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-10 -left-14 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%)' }}
        />
        {renderSidebarBody('desktop')}
      </aside>

      {/* ─── MOBILE / TABLET GLASS DRAWER OVERLAY (below lg; always fully expanded) ─── */}
      {mobileOpen && (
        <div
          className="dashboard-mobile-drawer-overlay fixed inset-0 z-[998] bg-slate-900/45 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="dashboard-mobile-drawer fixed left-0 bottom-0 w-[85%] max-w-[320px] z-[999] flex flex-col border-r border-slate-200/80 shadow-[16px_0_48px_rgba(15,23,42,0.18)] backdrop-blur-2xl bg-white/95"
            style={{ top: 64, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/70 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-extrabold text-sm shadow-[0_0_0_2px_rgba(99,102,241,0.18),0_3px_10px_rgba(99,102,241,0.3)] shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-slate-900 truncate">{orgName}</div>
                  <div className="text-[10.5px] text-slate-400">Navigation Menu</div>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-400 cursor-pointer transition-all duration-200 hover:text-slate-600 hover:border-slate-300"
              >
                <Icon d={CLOSE_ICON} size={16} color="currentColor" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {renderSidebarBody('mobile')}
            </div>
          </div>
        </div>
      )}

      {/* ─── ARCHITECTURE BLUEPRINT DOCS MODAL ─── */}
      {docModalOpen && (
        <div
          onClick={() => setDocModalOpen(false)}
          className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-5"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="docs-modal-card bg-white rounded-[20px] max-w-[620px] w-full p-5 sm:p-7 max-h-[85vh] overflow-y-auto shadow-[0_32px_80px_rgba(15,23,42,0.25)] border border-slate-200/80"
          >
            <div className="flex items-start sm:items-center justify-between gap-3 mb-[18px]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_4px_14px_rgba(99,102,241,0.4)] shrink-0">
                  <Icon d={FRAMEWORK_ICON} size={19} color="#fff" />
                </div>
                <div className="min-w-0">
                  <h3 className="m-0 text-lg font-extrabold text-slate-900">
                    Compile AI Architecture Framework
                  </h3>
                  <p className="m-0 mt-[3px] text-[12.5px] text-slate-500">
                    How unstructured chaos becomes an executive blueprint in &lt; 30 seconds
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDocModalOpen(false)}
                className="w-[30px] h-[30px] flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-400 cursor-pointer text-sm transition-all duration-200 hover:text-slate-600 hover:border-slate-300 shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="text-[13.5px] leading-relaxed text-slate-600">
              <div className="bg-slate-50/80 p-4 rounded-[13px] border border-slate-200/70 mb-3">
                <div className="font-bold text-indigo-600 mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-100 inline-flex items-center justify-center text-[11px] font-extrabold text-indigo-600 shrink-0">
                    1
                  </span>
                  Discovery Engine & Clarification
                </div>
                <div className="text-slate-500">Compile inspects uploaded SOPs, PRDs, audio transcripts, or rough notes, identifying critical gaps and proposing 4-6 high-yield architectural questions.</div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-[13px] border border-slate-200/70 mb-3">
                <div className="font-bold text-indigo-600 mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-cyan-100 inline-flex items-center justify-center text-[11px] font-extrabold text-cyan-600 shrink-0">
                    2
                  </span>
                  Parallel Reasoning (BRD + HLD + Costing)
                </div>
                <div className="text-slate-500">Generates functional & non-functional requirements, end-to-end cloud topology, recommended tech stack, failure mode analysis, and realistic delivery phases.</div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-[13px] border border-slate-200/70 mb-3">
                <div className="font-bold text-indigo-600 mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 inline-flex items-center justify-center text-[11px] font-extrabold text-emerald-600 shrink-0">
                    3
                  </span>
                  Section Regeneration & Multi-format Export
                </div>
                <div className="text-slate-500">Change constraints on the fly or download ready-to-present PDFs, Markdown, Word documents, and JSON payloads.</div>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setDocModalOpen(false)}
                className="docs-modal-cta bg-gradient-to-br from-indigo-500 to-cyan-500 text-white border-none px-6 py-2.5 rounded-[11px] font-bold text-[13px] cursor-pointer shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all duration-200 w-full sm:w-auto"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Global Styles for Floating Tooltips, Animations & Responsiveness ─── */}
      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        @keyframes drawerIn {
          from { transform: translateX(-100%); opacity: 0.6; }
          to   { transform: translateX(0); opacity: 1; }
        }

        @keyframes modalIn {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes dbPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(16, 185, 129, 0.8); }
          50%      { box-shadow: 0 0 14px rgba(16, 185, 129, 1); }
        }

        .sidebar-floating-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: rgba(15, 23, 42, 0.96);
          backdrop-filter: blur(8px);
          color: #ffffff;
          padding: 7px 13px;
          border-radius: 9px;
          font-size: 12px;
          line-height: 1.35;
          white-space: nowrap;
          box-shadow: 0 10px 28px -3px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(148, 163, 184, 0.15);
          z-index: 9999;
          pointer-events: none;
          animation: tooltipIn 0.15s ease-out forwards;
        }

        .tooltip-arrow {
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-right: 6px solid rgba(15, 23, 42, 0.96);
        }

        .db-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: dbPulse 2.4s ease-in-out infinite;
          flex-shrink: 0;
        }

        .sidebar-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255,255,255,0.3) !important;
          filter: brightness(1.05);
        }

        .sidebar-cta-btn:active {
          transform: translateY(0);
        }

        .docs-modal-card {
          animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .docs-modal-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(99, 102, 241, 0.5) !important;
          filter: brightness(1.05);
        }

        .dashboard-mobile-drawer {
          animation: drawerIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Premium thin scrollbar */
        .dashboard-desktop-sidebar ::-webkit-scrollbar,
        .dashboard-mobile-drawer ::-webkit-scrollbar {
          width: 5px;
        }
        .dashboard-desktop-sidebar ::-webkit-scrollbar-thumb,
        .dashboard-mobile-drawer ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.25);
          border-radius: 10px;
        }
        .dashboard-desktop-sidebar ::-webkit-scrollbar-thumb:hover,
        .dashboard-mobile-drawer ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
        .dashboard-desktop-sidebar ::-webkit-scrollbar-track,
        .dashboard-mobile-drawer ::-webkit-scrollbar-track {
          background: transparent;
        }

        /* Tablet & below: hide desktop sidebar, use mobile drawer */
        @media (max-width: 1024px) {
          .dashboard-desktop-sidebar {
            display: none !important;
          }
        }

        /* Respect reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .sidebar-floating-tooltip,
          .dashboard-mobile-drawer,
          .docs-modal-card,
          .db-status-dot {
            animation: none !important;
          }
          .sidebar-cta-btn,
          .docs-modal-cta,
          aside {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}