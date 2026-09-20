import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import InputScreen from './pages/InputScreen';
import DiscoveryChat from './pages/DiscoveryChat';
import GeneratingScreen from './pages/GeneratingScreen';
import ResultScreen from './pages/ResultScreen';
import VersionHistory from './pages/VersionHistory';
import Settings from './pages/Settings';
import CookieConsentBanner from './components/common/CookieConsentBanner';
import { getStoredToken } from './utils/cookieUtils';

/* =========================================================================
 * [DEBUG_LOG_EVERY_SECOND] — FRONTEND BROWSER DEBUG LOGGER (Runs every second)
 * PURPOSE: Logs current page route, uptime tick, and timestamp to the browser console.
 * TODO FOR FINAL PUSH: Comment out or remove this component before final commit!
 * ========================================================================= */
function DebugSecondLogger() {
  const location = useLocation();

  useEffect(() => {
    let secondTick = 0;
    const timer = setInterval(() => {
      secondTick += 1;
      const timeStr = new Date().toTimeString().split(' ')[0];
      console.log(
        `%c[DEBUG 1s] [${timeStr}] [Tick #${secondTick}] Current Route: ${location.pathname}`,
        'color: #6366f1; font-weight: bold; background: #eef2ff; padding: 2px 6px; border-radius: 4px;'
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [location.pathname]);

  return null;
}
/* === END [DEBUG_LOG_EVERY_SECOND] === */

/* ─── Auth guard with cookie token check ─── */
function isAuthenticated() {
  return !!getStoredToken();
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* 
        [DEBUG_LOG_EVERY_SECOND]
        Comment out the line below before final push to disable browser 1-second logs:
      */}
      <DebugSecondLogger />

      {/* Cookie Consent Banner (asks only once, stores preference in cookies) */}
      <CookieConsentBanner />

      <Routes>
        {/* Public */}
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route path="/onboarding"    element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/session/new"   element={<ProtectedRoute><InputScreen /></ProtectedRoute>} />
        <Route path="/input"         element={<ProtectedRoute><InputScreen /></ProtectedRoute>} />
        <Route path="/session/:id"            element={<ProtectedRoute><DiscoveryChat /></ProtectedRoute>} />
        <Route path="/discovery"              element={<ProtectedRoute><DiscoveryChat /></ProtectedRoute>} />
        <Route path="/discovery/:id"          element={<ProtectedRoute><DiscoveryChat /></ProtectedRoute>} />
        <Route path="/session/:id/generating" element={<ProtectedRoute><GeneratingScreen /></ProtectedRoute>} />
        <Route path="/session/:id/result"     element={<ProtectedRoute><ResultScreen /></ProtectedRoute>} />
        <Route path="/blueprint"              element={<ProtectedRoute><ResultScreen /></ProtectedRoute>} />
        <Route path="/blueprint/:id"          element={<ProtectedRoute><ResultScreen /></ProtectedRoute>} />
        <Route path="/versions"               element={<ProtectedRoute><VersionHistory /></ProtectedRoute>} />
        <Route path="/session/:id/versions"   element={<ProtectedRoute><VersionHistory /></ProtectedRoute>} />
        <Route path="/blueprint/:id/versions" element={<ProtectedRoute><VersionHistory /></ProtectedRoute>} />
        <Route path="/settings"               element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/* Temporary stub for protected pages not yet built */
function PlaceholderPage({ title }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, border: '1px solid #e4e7f0', boxShadow: '0 4px 24px rgba(99,102,241,0.08)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <h2 style={{ color: '#0f172a', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>{title}</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>This page is coming soon. 🚧</p>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          ← Back to home
        </a>
      </div>
    </div>
  );
}
