import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getStoredSidebarCollapsed,
  setStoredSidebarCollapsed,
  hasCompletedOnboarding,
} from '../../utils/cookieUtils';

/* ─── Color Palette ─── */
const C = {
  primary:     '#6366f1',
  primaryDk:   '#4f46e5',
  primaryLt:   '#eef2ff',
  primaryHover:'#f5f7ff',
  accent:      '#06b6d4',
  accentLt:    '#ecfeff',
  textH:       '#0f172a',
  textB:       '#334155',
  textM:       '#64748b',
  textSub:     '#94a3b8',
  border:      '#e2e8f0',
  borderLight: 'rgba(226, 232, 240, 0.8)',
  surface:     '#ffffff',
  surfaceAlt:  '#f8fafc',
  grad:        'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
  success:     '#10b981',
  warn:        '#f59e0b',
};

/* ─── High-Fidelity SVG Icons ─── */
function Icon({ d, size = 18, color = 'currentColor', style = {} }) {
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
      style={{ flexShrink: 0, ...style }}
    >
      <path d={d} />
    </svg>
  );
}

const DASHBOARD_ICON  = 'M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zM3 16h7v5H3v-5z';
const INTAKE_ICON     = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3-3 3 3';
const CHAT_ICON       = 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z';
const BLUEPRINT_ICON  = 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';
const HISTORY_ICON    = 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z';
const SETTINGS_ICON   = 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4 1.5l1.8 1.4-2 3.5-2.2-.9a7 7 0 0 1-2.4 1.4L14.2 25h-4.4l-.4-2.2a7 7 0 0 1-2.4-1.4l-2.2.9-2-3.5 1.8-1.4a7 7 0 0 1 0-2.8L2.8 14.5l2-3.5 2.2.9a7 7 0 0 1 2.4-1.4L9.8 8h4.4l.4 2.2a7 7 0 0 1 2.4 1.4l2.2-.9 2 3.5-1.8 1.4a7 7 0 0 1 0 2.8z';
const FRAMEWORK_ICON  = 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z';
const PLUS_ICON       = 'M12 5v14M5 12h14';
const COLLAPSE_ICON   = 'M11 19l-7-7 7-7m8 14l-7-7 7-7';
const EXPAND_ICON     = 'M13 5l7 7-7 7M5 5l7 7-7 7';
const CLOSE_ICON      = 'M18 6L6 18M6 6l12 12';
const ONBOARD_ICON    = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z';

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

  // Persistent sidebar collapse state (synced with cookie/localStorage)
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
      badgeColor: '#0284c7',
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
      badgeColor: '#d97706',
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
      badgeColor: '#059669',
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
      badgeColor: '#6366f1',
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
            badgeColor: '#0284c7',
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

  /* ─── Render Sidebar Inner Content ─── */
  const sidebarBody = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: isCollapsed ? '14px 8px 14px' : '16px 12px 14px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'visible',
      }}
    >
      {/* ─── 1. Header Capsule with Workspace Identity + Collapse Toggle ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '4px 0 12px' : '6px 8px 12px',
          borderBottom: '1px solid ' + C.borderLight,
          marginBottom: 12,
          position: 'relative',
        }}
        onMouseEnter={() => isCollapsed && setHoveredItemId('workspace-head')}
        onMouseLeave={() => isCollapsed && setHoveredItemId(null)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* Avatar badge */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: C.grad,
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.28)',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/settings')}
            title={isCollapsed ? `${orgName} (${roleTitle})` : undefined}
          >
            {userInitial}
          </div>

          {!isCollapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: C.textH,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
                title={orgName}
              >
                {orgName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: user?.role === 'owner' ? '#b45309' : '#0369a1',
                    background: user?.role === 'owner' ? '#fef3c7' : '#e0f2fe',
                    padding: '1px 5px',
                    borderRadius: 4,
                    border: '1px solid ' + (user?.role === 'owner' ? '#fde68a' : '#bae6fd'),
                    letterSpacing: '0.2px',
                  }}
                >
                  {user?.role === 'owner' ? '★ Owner' : 'Member'}
                </span>
                <span style={{ fontSize: 10.5, color: C.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name ? user.name.split(' ')[0] : 'Architect'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Header Collapse / Expand Toggle Button */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          style={{
            background: isCollapsed ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
            border: isCollapsed ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid ' + C.borderLight,
            borderRadius: 7,
            padding: '5px',
            color: C.textM,
            cursor: 'pointer',
            display: isCollapsed ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.primaryLt;
            e.currentTarget.style.color = C.primaryDk;
            e.currentTarget.style.borderColor = '#c7d2fe';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isCollapsed ? 'rgba(99, 102, 241, 0.08)' : 'transparent';
            e.currentTarget.style.color = C.textM;
            e.currentTarget.style.borderColor = isCollapsed ? 'rgba(99, 102, 241, 0.2)' : C.borderLight;
          }}
        >
          <Icon d={isCollapsed ? EXPAND_ICON : COLLAPSE_ICON} size={14} color="currentColor" />
        </button>

        {/* Collapsed floating tooltip for header */}
        {isCollapsed && hoveredItemId === 'workspace-head' && (
          <div className="sidebar-floating-tooltip">
            <div style={{ fontWeight: 700, color: '#fff' }}>{orgName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{roleTitle} • Click to open Settings</div>
            <div className="tooltip-arrow" />
          </div>
        )}
      </div>

      {/* ─── 2. "+ New Blueprint" Primary CTA ─── */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <button
          onClick={() => {
            if (onNewBlueprint && typeof onNewBlueprint === 'function') {
              onNewBlueprint();
            } else {
              navigate('/session/new');
            }
            if (setMobileOpen) setMobileOpen(false);
          }}
          onMouseEnter={() => isCollapsed && setHoveredItemId('new-blueprint-btn')}
          onMouseLeave={() => isCollapsed && setHoveredItemId(null)}
          style={{
            width: '100%',
            background: C.grad,
            color: '#ffffff',
            border: 'none',
            padding: isCollapsed ? '10px 0' : '9px 12px',
            borderRadius: 9,
            fontWeight: 700,
            fontSize: 12.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 8,
            boxShadow: '0 3px 12px rgba(99, 102, 241, 0.25)',
            transition: 'all 0.18s ease',
          }}
          onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)'}
          onBlur={e => e.currentTarget.style.boxShadow = '0 3px 12px rgba(99, 102, 241, 0.25)'}
        >
          <Icon d={PLUS_ICON} size={16} color="#ffffff" />
          {!isCollapsed && <span>New Blueprint</span>}
        </button>

        {/* Floating tooltip when collapsed */}
        {isCollapsed && hoveredItemId === 'new-blueprint-btn' && (
          <div className="sidebar-floating-tooltip">
            <div style={{ fontWeight: 700, color: '#fff' }}>+ New Blueprint</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Start intake from prompt, SOP or document</div>
            <div className="tooltip-arrow" />
          </div>
        )}
      </div>

      {/* ─── 3. Workflow Navigation Items ─── */}
      <div style={{ marginBottom: 14 }}>
        {!isCollapsed && (
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: C.textSub,
              padding: '0 8px 6px',
            }}
          >
            Workspace Pipeline
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => {
            const isHovered = isCollapsed && hoveredItemId === item.id;
            return (
              <div key={item.id} style={{ position: 'relative' }}>
                <button
                  onClick={item.action}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '8px 0' : '7px 9px',
                    borderRadius: 8,
                    border: 'none',
                    borderLeft: item.isActive ? `3px solid ${C.primary}` : '3px solid transparent',
                    background: item.isActive
                      ? 'rgba(99, 102, 241, 0.09)'
                      : hoveredItemId === item.id && !isCollapsed
                      ? 'rgba(241, 245, 249, 0.85)'
                      : 'transparent',
                    color: item.isActive ? C.primaryDk : C.textB,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.14s ease',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <Icon
                      d={item.icon}
                      size={17}
                      color={item.isActive ? C.primary : hoveredItemId === item.id ? C.textH : C.textM}
                    />
                    {!isCollapsed && (
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: item.isActive ? 700 : 600,
                            color: item.isActive ? C.primaryDk : C.textH,
                            lineHeight: 1.25,
                          }}
                        >
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div
                            style={{
                              fontSize: 10,
                              color: item.isActive ? C.primary : C.textSub,
                              marginTop: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: item.badgeBg || (item.isActive ? '#e0e7ff' : '#f1f5f9'),
                        color: item.badgeColor || (item.isActive ? C.primaryDk : C.textM),
                        marginLeft: 4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Collapsed floating tooltip */}
                {isHovered && (
                  <div className="sidebar-floating-tooltip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{item.title}</span>
                      {item.badge && (
                        <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.subtitle}</div>
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
      <div style={{ marginBottom: 'auto' }}>
        {!isCollapsed && (
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: C.textSub,
              padding: '8px 8px 6px',
              borderTop: '1px solid ' + C.borderLight,
            }}
          >
            System & Tools
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {systemItems.map((item) => {
            const isHovered = isCollapsed && hoveredItemId === item.id;
            return (
              <div key={item.id} style={{ position: 'relative' }}>
                <button
                  onClick={item.action}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '8px 0' : '7px 9px',
                    borderRadius: 8,
                    border: 'none',
                    borderLeft: item.isActive ? `3px solid ${C.primary}` : '3px solid transparent',
                    background: item.isActive
                      ? 'rgba(99, 102, 241, 0.09)'
                      : hoveredItemId === item.id && !isCollapsed
                      ? 'rgba(241, 245, 249, 0.85)'
                      : 'transparent',
                    color: item.isActive ? C.primaryDk : C.textB,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.14s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Icon
                      d={item.icon}
                      size={16}
                      color={item.isActive ? C.primary : hoveredItemId === item.id ? C.textH : C.textM}
                    />
                    {!isCollapsed && (
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: item.isActive ? 700 : 600, color: item.isActive ? C.primaryDk : C.textH }}>
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div style={{ fontSize: 10, color: C.textSub, marginTop: 1 }}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {/* Collapsed floating tooltip */}
                {isHovered && (
                  <div className="sidebar-floating-tooltip">
                    <div style={{ fontWeight: 700, color: '#fff' }}>{item.title}</div>
                    {item.subtitle && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.subtitle}</div>
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
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid ' + C.borderLight,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {!isCollapsed ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              border: '1px solid ' + C.borderLight,
              borderRadius: 8,
              padding: '6px 9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: C.success,
                  boxShadow: '0 0 6px rgba(16, 185, 129, 0.7)',
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textB }}>MySQL 8.0 Live</span>
            </div>
            <span style={{ fontSize: 10, color: C.textSub, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
              Port 3306
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '4px 0',
              position: 'relative',
            }}
            onMouseEnter={() => setHoveredItemId('db-pill')}
            onMouseLeave={() => setHoveredItemId(null)}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: C.success,
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
              }}
            />
            {hoveredItemId === 'db-pill' && (
              <div className="sidebar-floating-tooltip">
                <div style={{ fontWeight: 700, color: '#fff' }}>MySQL 8.0 Live</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Connected on Port 3306</div>
                <div className="tooltip-arrow" />
              </div>
            )}
          </div>
        )}

        {/* Bottom Expand / Collapse Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={toggleCollapse}
            onMouseEnter={e => {
              if (isCollapsed) setHoveredItemId('toggle-collapse-btn');
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = C.primaryDk;
              e.currentTarget.style.borderColor = '#c7d2fe';
            }}
            onMouseLeave={e => {
              if (isCollapsed) setHoveredItemId(null);
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.color = C.textM;
              e.currentTarget.style.borderColor = C.borderLight;
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              width: '100%',
              padding: isCollapsed ? '7px 0' : '6px 8px',
              borderRadius: 7,
              border: '1px solid ' + C.borderLight,
              background: 'rgba(255, 255, 255, 0.6)',
              color: C.textM,
              cursor: 'pointer',
              fontSize: 11.5,
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon d={isCollapsed ? EXPAND_ICON : COLLAPSE_ICON} size={14} color="currentColor" />
              {!isCollapsed && <span>Collapse Sidebar</span>}
            </div>
            {!isCollapsed && (
              <span style={{ fontSize: 10, color: C.textSub, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                Ctrl+B
              </span>
            )}
          </button>

          {isCollapsed && hoveredItemId === 'toggle-collapse-btn' && (
            <div className="sidebar-floating-tooltip">
              <div style={{ fontWeight: 700, color: '#fff' }}>Expand Sidebar</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Shortcut: Ctrl+B</div>
              <div className="tooltip-arrow" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── DESKTOP GLASS SIDEBAR ─── */}
      <aside
        className="dashboard-desktop-sidebar"
        style={{
          position: 'fixed',
          top: 64, // Directly below 64px top Navbar
          left: 0,
          bottom: 0,
          width: isCollapsed ? 68 : 244,
          zIndex: 85,
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: '4px 0 20px rgba(15, 23, 42, 0.03)',
          transition: 'width 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {sidebarBody}
      </aside>

      {/* ─── MOBILE GLASS DRAWER OVERLAY ─── */}
      {mobileOpen && (
        <div
          className="dashboard-mobile-drawer-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 64,
              left: 0,
              bottom: 0,
              width: '80%',
              maxWidth: 290,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              borderRight: '1px solid ' + C.borderLight,
              boxShadow: '10px 0 32px rgba(0, 0, 0, 0.15)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: '1px solid ' + C.borderLight,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: C.grad,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {userInitial}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: C.textH }}>{orgName}</div>
                  <div style={{ fontSize: 10, color: C.textSub }}>Navigation Menu</div>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.textM,
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon d={CLOSE_ICON} size={18} color={C.textM} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {sidebarBody}
            </div>
          </div>
        </div>
      )}

      {/* ─── ARCHITECTURE BLUEPRINT DOCS MODAL ─── */}
      {docModalOpen && (
        <div
          onClick={() => setDocModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 620,
              width: '100%',
              padding: 28,
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.2)',
              border: '1px solid ' + C.border,
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={FRAMEWORK_ICON} size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.textH }}>
                    Compile AI Architecture Framework
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: C.textM }}>
                    How unstructured chaos becomes an executive blueprint in &lt; 30 seconds
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDocModalOpen(false)}
                style={{ background: 'none', border: 'none', color: C.textSub, cursor: 'pointer', fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: C.textB }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid ' + C.border, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: C.primaryDk, marginBottom: 4 }}>
                  1. Discovery Engine & Clarification
                </div>
                <div>Compile inspects uploaded SOPs, PRDs, audio transcripts, or rough notes, identifying critical gaps and proposing 4-6 high-yield architectural questions.</div>
              </div>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid ' + C.border, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: C.primaryDk, marginBottom: 4 }}>
                  2. Parallel Reasoning (BRD + HLD + Costing)
                </div>
                <div>Generates functional & non-functional requirements, end-to-end cloud topology, recommended tech stack, failure mode analysis, and realistic delivery phases.</div>
              </div>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid ' + C.border, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: C.primaryDk, marginBottom: 4 }}>
                  3. Section Regeneration & Multi-format Export
                </div>
                <div>Change constraints on the fly or download ready-to-present PDFs, Markdown, Word documents, and JSON payloads.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                onClick={() => setDocModalOpen(false)}
                style={{
                  background: C.primary,
                  color: '#fff',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: 9,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Global Styles for Floating Tooltips & Animation ─── */}
      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        .sidebar-floating-tooltip {
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: #0f172a;
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.35;
          white-space: nowrap;
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          z-index: 9999;
          pointer-events: none;
          animation: tooltipIn 0.14s ease-out forwards;
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
          border-right: 6px solid #0f172a;
        }

        @media (max-width: 900px) {
          .dashboard-desktop-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
