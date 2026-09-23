import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getStoredToken } from './utils/cookieUtils';
import CookieConsentBanner from './components/common/CookieConsentBanner';

// ─── Route-level code splitting ───────────────────────────────────────────────
// Each page is loaded only when first navigated to, keeping the initial bundle
// minimal so the landing page renders almost instantly.
const Landing        = lazy(() => import('./pages/Landing'));
const Login          = lazy(() => import('./pages/Login'));
const Signup         = lazy(() => import('./pages/Signup'));
const Pricing        = lazy(() => import('./pages/Pricing'));
const Onboarding     = lazy(() => import('./pages/Onboarding'));
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const InputScreen    = lazy(() => import('./pages/InputScreen'));
const DiscoveryChat  = lazy(() => import('./pages/DiscoveryChat'));
const GeneratingScreen = lazy(() => import('./pages/GeneratingScreen'));
const ResultScreen   = lazy(() => import('./pages/ResultScreen'));
const VersionHistory = lazy(() => import('./pages/VersionHistory'));
const Settings       = lazy(() => import('./pages/Settings'));

// ─── Minimal page-level loading spinner ───────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(99,102,241,0.2)',
        borderTop: '3px solid #6366f1',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
function isAuthenticated() {
  return !!getStoredToken();
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <CookieConsentBanner />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/"        element={<Landing />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />

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
      </Suspense>
    </BrowserRouter>
  );
}
