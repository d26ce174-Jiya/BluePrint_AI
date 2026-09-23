/**
 * Compile AI - Cookie Utility & Persistence Helper
 * Robust cookie management for authentication session, user profile, onboarding preferences,
 * and single-time cookie consent prompt.
 */

export const COOKIE_KEYS = {
  // Cookie consent
  CONSENT: 'compile_cookie_consent',

  // Authentication & Session
  USER: 'compile_user',
  TOKEN: 'compile_token',
  SESSION_EXPIRES_AT: 'compile_session_expires_at',

  // Onboarding
  ONBOARDED: 'compile_onboarded',
  ONBOARDING_DATA: 'compile_onboarding_data',

  // User preferences
  THEME: 'compile_theme',
  LANGUAGE: 'compile_language',
  TIMEZONE: 'compile_timezone',

  // AI preferences
  AI_MODEL: 'compile_ai_model',
  AI_LANGUAGE: 'compile_ai_language',
  AI_RESPONSE_STYLE: 'compile_ai_response_style',

  // Workspace
  ACTIVE_WORKSPACE: 'compile_active_workspace',

  // UI state
  SIDEBAR_COLLAPSED: 'compile_sidebar_collapsed',
  LAST_ROUTE: 'compile_last_route',
};

export const SESSION_DURATION_DAYS = 10;

/**
 * Set a cookie with safe URI encoding and expiration
 */
export function setCookie(name, value, days = 365, path = '/') {
  try {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const encodedValue = encodeURIComponent(String(value));
    document.cookie = `${name}=${encodedValue}; expires=${expires}; path=${path}; SameSite=Lax`;
  } catch (err) {
    console.warn(`Could not set cookie "${name}":`, err);
  }
}

/**
 * Retrieve a cookie value by name using a clean split-based parser (no regex escaping flaws)
 */
export function getCookie(name) {
  try {
    if (typeof document === 'undefined' || !document.cookie) return null;
    const parts = document.cookie.split(';');
    for (let i = 0; i < parts.length; i++) {
      const item = parts[i].trim();
      if (item.startsWith(name + '=')) {
        return decodeURIComponent(item.substring(name.length + 1));
      }
    }
    return null;
  } catch (err) {
    console.warn(`Could not read cookie "${name}":`, err);
    return null;
  }
}

/**
 * Delete a cookie by expiring it
 */
export function deleteCookie(name, path = '/') {
  try {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Lax`;
  } catch (err) {
    console.warn(`Could not delete cookie "${name}":`, err);
  }
}

/**
 * Store a JSON object in a cookie
 */
export function setCookieJSON(name, data, days = 365, path = '/') {
  try {
    const jsonStr = JSON.stringify(data);
    setCookie(name, jsonStr, days, path);
  } catch (err) {
    console.warn(`Could not stringify JSON for cookie "${name}":`, err);
  }
}

/**
 * Retrieve a parsed JSON object from a cookie
 */
export function getCookieJSON(name) {
  const val = getCookie(name);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch (err) {
    console.warn(`Could not parse JSON from cookie "${name}":`, err);
    return null;
  }
}

/* ─── Cookie Consent Helpers (Asked ONLY ONCE) ─── */

/**
 * Check if the user has already answered the cookie consent prompt
 */
export function hasCookieConsent() {
  const consent = getCookie(COOKIE_KEYS.CONSENT) || (typeof localStorage !== 'undefined' ? localStorage.getItem(COOKIE_KEYS.CONSENT) : null);
  return consent === 'accepted' || consent === 'essential';
}

/**
 * Record cookie consent permanently so the prompt is never shown again
 */
export function setCookieConsent(type = 'accepted') {
  setCookie(COOKIE_KEYS.CONSENT, type, 365);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(COOKIE_KEYS.CONSENT, type);
  } catch (e) {}
}

/* ─── User Profile & 10-Day Authentication Session Persistence ─── */

/**
 * Check if the active session has exceeded the 10-day duration limit
 * Returns true if expired and automatically cleans up session tokens.
 */
export function isSessionExpired() {
  const expiresAtStr = getCookie(COOKIE_KEYS.SESSION_EXPIRES_AT) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(COOKIE_KEYS.SESSION_EXPIRES_AT) : null);

  if (!expiresAtStr) return false;
  const expiresAt = Number(expiresAtStr);
  if (isNaN(expiresAt)) return false;

  // Condition 2: 10 days have elapsed since login
  if (Date.now() > expiresAt) {
    clearAuthCookies();
    return true;
  }
  return false;
}

/**
 * Get stored user profile from cookie (with localStorage fallback)
 * Persists seamlessly across page refreshes.
 */
export function getStoredUser() {
  if (isSessionExpired()) return null;

  const fromCookie = getCookieJSON(COOKIE_KEYS.USER);
  if (fromCookie) return fromCookie;

  try {
    if (typeof localStorage !== 'undefined') {
      const fromLocal = localStorage.getItem('compile_user');
      if (fromLocal) {
        const parsed = JSON.parse(fromLocal);
        setCookieJSON(COOKIE_KEYS.USER, parsed, SESSION_DURATION_DAYS);
        return parsed;
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Store user profile in both cookie and localStorage for 10 days
 */
export function setStoredUser(user, days = SESSION_DURATION_DAYS) {
  if (!user) return;
  setCookieJSON(COOKIE_KEYS.USER, user, days);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('compile_user', JSON.stringify(user));
    }
  } catch (e) {}
}

/**
 * Get stored auth token from cookie.
 * Persists through browser refresh, ends ONLY:
 * 1) When user explicitly clicks sign out
 * 2) After 10 days have elapsed
 */
export function getStoredToken() {
  if (isSessionExpired()) return null;
  return getCookie(COOKIE_KEYS.TOKEN);
}

/**
 * Start an authenticated session for 10 days.
 * Sets token in cookie with expiration timestamp 10 days in the future.
 * Security note: Sensitive tokens are kept out of localStorage to prevent XSS exposure.
 * For production, backend Set-Cookie with HttpOnly + Secure flags is recommended.
 */
export function setStoredToken(token, days = SESSION_DURATION_DAYS) {
  if (!token) return;
  const expiresAt = Date.now() + days * 864e5; // Exactly 10 days in ms

  setCookie(COOKIE_KEYS.TOKEN, token, days);
  setCookie(COOKIE_KEYS.SESSION_EXPIRES_AT, String(expiresAt), days);

  // Clean any legacy token from localStorage to avoid stale or duplicated tokens
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('compile_token');
      localStorage.setItem(COOKIE_KEYS.SESSION_EXPIRES_AT, String(expiresAt));
    }
  } catch (e) {}
}

/**
 * Condition 1: Ended by clicking "Sign out"
 * Clears the session token, user profile, and session expiry timer.
 * IMPORTANT: NEVER deletes the user's onboarding completion status or cookie consent!
 */
export function clearAuthCookies() {
  deleteCookie(COOKIE_KEYS.TOKEN);
  deleteCookie(COOKIE_KEYS.USER);
  deleteCookie(COOKIE_KEYS.SESSION_EXPIRES_AT);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('compile_token');
      localStorage.removeItem('compile_user');
      localStorage.removeItem(COOKIE_KEYS.SESSION_EXPIRES_AT);
    }
  } catch (e) {}
}

/* ─── Onboarding State Persistence (User-Scoped & Permanent) ─── */

/**
 * Mark a brand new registered account as needing onboarding.
 * Wipes any stale global browser cookies so prior browser sessions don't leak into the new user.
 */
export function markNewAccountPendingOnboarding(user) {
  if (!user) return;

  // Clear any stale global onboarding cookies from previous accounts on this browser
  deleteCookie(COOKIE_KEYS.ONBOARDED);
  deleteCookie(COOKIE_KEYS.ONBOARDING_DATA);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(COOKIE_KEYS.ONBOARDED);
      localStorage.removeItem(COOKIE_KEYS.ONBOARDING_DATA);
    }
  } catch (e) {}

  const pendingUser = {
    ...user,
    onboardingCompleted: false,
  };

  if (user.id) {
    setCookie(`compile_onboarded_${user.id}`, 'false', 365);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(`compile_onboarded_${user.id}`, 'false');
    } catch (e) {}
  }

  if (user.email) {
    const emailKey = String(user.email).toLowerCase().replace(/[^a-z0-9]/g, '_');
    setCookie(`compile_onboarded_${emailKey}`, 'false', 365);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(`compile_onboarded_${emailKey}`, 'false');
    } catch (e) {}
  }

  setStoredUser(pendingUser);
}

/**
 * Permanently mark onboarding as completed for a user.
 */
export function markOnboardingCompleted(user) {
  const target = user || getStoredUser() || {};
  setCookie(COOKIE_KEYS.ONBOARDED, 'true', 365);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(COOKIE_KEYS.ONBOARDED, 'true');
  } catch (e) {}

  if (target.id) {
    setCookie(`compile_onboarded_${target.id}`, 'true', 365);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(`compile_onboarded_${target.id}`, 'true');
    } catch (e) {}
  }

  if (target.email) {
    const emailKey = String(target.email).toLowerCase().replace(/[^a-z0-9]/g, '_');
    setCookie(`compile_onboarded_${emailKey}`, 'true', 365);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(`compile_onboarded_${emailKey}`, 'true');
    } catch (e) {}
  }

  const updated = {
    ...target,
    onboardingCompleted: true,
  };
  setStoredUser(updated);
}

/**
 * Check if the user has already completed onboarding.
 * Strictly user-scoped: Never lets previous browser cookies bounce a new user.
 */
export function hasCompletedOnboarding(user) {
  const targetUser = user || getStoredUser();
  if (!targetUser) return false;

  // If explicitly flagged as pending/false, definitely not onboarded
  if (targetUser.onboardingCompleted === false) {
    return false;
  }

  // 1. Check user ID scope
  if (targetUser.id) {
    const idVal = getCookie(`compile_onboarded_${targetUser.id}`) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem(`compile_onboarded_${targetUser.id}`) : null);
    if (idVal === 'false') return false;
    if (idVal === 'true') return true;
  }

  // 2. Check user email scope
  if (targetUser.email) {
    const emailKey = String(targetUser.email).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const emailVal = getCookie(`compile_onboarded_${emailKey}`) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem(`compile_onboarded_${emailKey}`) : null);
    if (emailVal === 'false') return false;
    if (emailVal === 'true') return true;
  }

  // 3. Check explicit boolean property on targetUser
  if (
    targetUser.onboardingCompleted === true ||
    targetUser.isOnboarded === true ||
    targetUser.is_onboarded === 1 ||
    targetUser.onboarding_completed === 1
  ) {
    return true;
  }

  return false;
}

/**
 * Store completed onboarding data in cookies permanently
 */
export function setOnboardingData(data) {
  // 1. Store the full payload in cookies
  setCookieJSON(COOKIE_KEYS.ONBOARDING_DATA, {
    ...data,
    savedAt: new Date().toISOString(),
  }, 365);

  // 2. Set the completion flag in cookies & localStorage
  setCookie(COOKIE_KEYS.ONBOARDED, 'true', 365);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COOKIE_KEYS.ONBOARDED, 'true');
      localStorage.setItem(COOKIE_KEYS.ONBOARDING_DATA, JSON.stringify(data));
    }
  } catch (e) {}

  // 3. Mark for this user specifically
  const currentUser = getStoredUser() || {};
  const userId = data.userId || currentUser.id;
  const userEmail = data.userEmail || currentUser.email;

  if (userId) {
    setCookie(`compile_onboarded_${userId}`, 'true', 365);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(`compile_onboarded_${userId}`, 'true');
    } catch (e) {}
  }
  if (userEmail) {
    const emailKey = String(userEmail).toLowerCase().replace(/[^a-z0-9]/g, '_');
    setCookie(`compile_onboarded_${emailKey}`, 'true', 365);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(`compile_onboarded_${emailKey}`, 'true');
    } catch (e) {}
  }

  // 4. Update stored user profile in cookies
  const updatedUser = {
    ...currentUser,
    company: data.workspaceName || currentUser.company,
    industry: data.industry || currentUser.industry,
    roleTitle: data.role || currentUser.roleTitle,
    goals: data.goals || currentUser.goals,
    onboardingCompleted: true,
  };
  setStoredUser(updatedUser);
}

/**
 * Retrieve saved onboarding data from cookies
 */
export function getOnboardingData() {
  const fromCookie = getCookieJSON(COOKIE_KEYS.ONBOARDING_DATA);
  if (fromCookie) return fromCookie;

  try {
    if (typeof localStorage !== 'undefined') {
      const fromLocal = localStorage.getItem(COOKIE_KEYS.ONBOARDING_DATA);
      if (fromLocal) return JSON.parse(fromLocal);
    }
  } catch (e) {}

  return null;
}

/* ─── User & Workspace Preferences Helpers ─── */

/**
 * Get stored UI theme ('light' | 'dark' | 'system')
 */
export function getStoredTheme() {
  return (
    getCookie(COOKIE_KEYS.THEME) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(COOKIE_KEYS.THEME) : null) ||
    'light'
  );
}

export function setStoredTheme(theme = 'light') {
  setCookie(COOKIE_KEYS.THEME, theme, 365);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(COOKIE_KEYS.THEME, theme);
  } catch (e) {}
}

/**
 * Get stored platform language (ISO code e.g. 'en', 'es', 'de', 'ja', 'hi')
 */
export function getStoredLanguage() {
  return (
    getCookie(COOKIE_KEYS.LANGUAGE) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(COOKIE_KEYS.LANGUAGE) : null) ||
    'en'
  );
}

export function setStoredLanguage(lang = 'en') {
  setCookie(COOKIE_KEYS.LANGUAGE, lang, 365);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(COOKIE_KEYS.LANGUAGE, lang);
  } catch (e) {}
}

/**
 * Active Workspace helper
 */
export function getActiveWorkspace() {
  return (
    getCookie(COOKIE_KEYS.ACTIVE_WORKSPACE) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(COOKIE_KEYS.ACTIVE_WORKSPACE) : null)
  );
}

export function setActiveWorkspace(workspaceId) {
  if (!workspaceId) return;
  setCookie(COOKIE_KEYS.ACTIVE_WORKSPACE, workspaceId, 365);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(COOKIE_KEYS.ACTIVE_WORKSPACE, workspaceId);
  } catch (e) {}
}

/**
 * AI Generation Preferences (Model, Language, Response Style)
 */
export function getStoredAiPreferences() {
  return {
    model: getCookie(COOKIE_KEYS.AI_MODEL) || 'claude-3-5-sonnet',
    language: getCookie(COOKIE_KEYS.AI_LANGUAGE) || getStoredLanguage(),
    responseStyle: getCookie(COOKIE_KEYS.AI_RESPONSE_STYLE) || 'executive-consultant',
  };
}

export function setStoredAiPreferences({ model, language, responseStyle } = {}) {
  if (model) {
    setCookie(COOKIE_KEYS.AI_MODEL, model, 365);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(COOKIE_KEYS.AI_MODEL, model); } catch (e) {}
  }
  if (language) {
    setCookie(COOKIE_KEYS.AI_LANGUAGE, language, 365);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(COOKIE_KEYS.AI_LANGUAGE, language); } catch (e) {}
  }
  if (responseStyle) {
    setCookie(COOKIE_KEYS.AI_RESPONSE_STYLE, responseStyle, 365);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(COOKIE_KEYS.AI_RESPONSE_STYLE, responseStyle); } catch (e) {}
  }
}

/**
 * UI State: Sidebar collapsed state persistence
 */
export function getStoredSidebarCollapsed() {
  const val = getCookie(COOKIE_KEYS.SIDEBAR_COLLAPSED) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(COOKIE_KEYS.SIDEBAR_COLLAPSED) : null);
  return val === 'true';
}

export function setStoredSidebarCollapsed(collapsed) {
  const strVal = collapsed ? 'true' : 'false';
  setCookie(COOKIE_KEYS.SIDEBAR_COLLAPSED, strVal, 365);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(COOKIE_KEYS.SIDEBAR_COLLAPSED, strVal);
  } catch (e) {}
}

/* ═══════════════════════════════════════════════════════════════
 * User Roles & RBAC Management (Synchronized with Backend)
 * Roles: 'admin' (Owner/Full Access), 'developer' (Editor/Builder), 'viewer' (Read Only)
 * ═══════════════════════════════════════════════════════════════ */

export const USER_ROLES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  VIEWER: 'viewer',
};

/**
 * Normalize backend/database role string to frontend role convention
 */
export function normalizeFrontendRole(rawRole) {
  if (!rawRole) return 'developer';
  const r = String(rawRole).trim().toLowerCase();
  if (r === 'owner' || r === 'admin') return 'admin';
  if (r === 'member' || r === 'developer') return 'developer';
  if (r === 'viewer' || r === 'read_only') return 'viewer';
  return 'developer';
}

/**
 * Get the current user's authenticated role derived from backend user profile / JWT token.
 * Prevents client-side forged localStorage privilege escalation.
 */
export function getUserRole() {
  try {
    const user = getStoredUser();
    if (user && user.role) {
      return normalizeFrontendRole(user.role);
    }
    return 'admin';
  } catch {
    return 'admin';
  }
}

/**
 * Update user role through the backend API and update stored session & state
 */
export async function setUserRole(role) {
  const cleanRole = normalizeFrontendRole(role);
  const token = getStoredToken();

  if (token) {
    try {
      const res = await fetch('http://localhost:5000/api/auth/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: cleanRole }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setStoredToken(data.token);
        }
        if (data.user) {
          const currentUser = getStoredUser() || {};
          setStoredUser({ ...currentUser, ...data.user, role: cleanRole });
        }
      }
    } catch (e) {
      console.warn('Could not sync role change to backend:', e);
    }
  }

  // Local state update
  const user = getStoredUser() || {};
  user.role = cleanRole;
  setStoredUser(user);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('role_changed', { detail: { role: cleanRole } }));
  }

  return cleanRole;
}

/**
 * Synchronize user role and profile from the backend /me endpoint
 */
export async function syncUserRoleWithBackend() {
  try {
    const token = getStoredToken();
    if (!token) return getUserRole();

    const res = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        const currentUser = getStoredUser() || {};
        const normalized = normalizeFrontendRole(data.user.role);
        setStoredUser({ ...currentUser, ...data.user, role: normalized });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('role_changed', { detail: { role: normalized } }));
        }
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Could not sync user profile/role from backend:', err);
  }
  return getUserRole();
}

export function canDeploy() {
  return getUserRole() === 'admin';
}

export function canEditCode() {
  const role = getUserRole();
  return role === 'admin' || role === 'developer';
}

export function canApproveBlueprint() {
  const role = getUserRole();
  return role === 'admin' || role === 'developer';
}

export function canCreateBlueprint() {
  const role = getUserRole();
  return role === 'admin' || role === 'developer';
}

export function canRegenerate() {
  const role = getUserRole();
  return role === 'admin' || role === 'developer';
}


/**
 * Subscription Plan Management
 * Plans: 'free' | 'starter' | 'enterprise'
 */
export function getUserPlan() {
  try {
    return localStorage.getItem('compile_user_plan') || getCookie('compile_user_plan') || 'free';
  } catch {
    return 'free';
  }
}

export function setUserPlan(planId) {
  const cleanPlan = ['free', 'starter', 'enterprise'].includes(planId) ? planId : 'free';
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem('compile_user_plan', cleanPlan);
    setCookie('compile_user_plan', cleanPlan, 365);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('plan_changed', { detail: { plan: cleanPlan } }));
    }
  } catch (e) {
    console.warn('Failed to set user plan:', e);
  }
  return cleanPlan;
}

/**
 * Credits Management (Default: 5 Credits)
 */
export function getUserCredits() {
  try {
    const raw = localStorage.getItem('compile_credits');
    if (raw !== null && !isNaN(parseInt(raw, 10))) {
      return parseInt(raw, 10);
    }
    return 5; // Default free tier credits
  } catch {
    return 5;
  }
}

export function deductUserCredit(amount = 1) {
  try {
    const current = getUserCredits();
    const updated = Math.max(0, current - amount);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('compile_credits', updated.toString());
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credits_changed', { detail: { credits: updated, deducted: amount } }));
    }
    return updated;
  } catch {
    return 4;
  }
}

export function setUserCredits(amount) {
  try {
    const val = Math.max(0, parseInt(amount, 10) || 0);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('compile_credits', val.toString());
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credits_changed', { detail: { credits: val } }));
    }
    return val;
  } catch {
    return 0;
  }
}

export async function syncUserCreditsWithBackend() {
  try {
    const token = getStoredToken();
    if (!token) return getUserCredits();
    const res = await fetch('http://localhost:5000/api/payment/balance', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.credits === 'number') {
        return setUserCredits(data.credits);
      }
    }
  } catch (err) {
    console.warn('Could not sync credits with backend:', err);
  }
  return getUserCredits();
}

export function addCredits(amount = 10) {
  try {
    const current = getUserCredits();
    const updated = current + amount;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('compile_credits', updated.toString());
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credits_changed', { detail: { credits: updated, added: amount } }));
    }
    return updated;
  } catch {
    return 15;
  }
}
