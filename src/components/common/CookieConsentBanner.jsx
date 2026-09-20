import { useState, useEffect } from 'react';
import { hasCookieConsent, setCookieConsent } from '../../utils/cookieUtils';

const C = {
  primary:   '#6366f1',
  primaryDk: '#4f46e5',
  textH:     '#0f172a',
  textB:     '#334155',
  textM:     '#64748b',
  textSub:   '#94a3b8',
  border:    '#e4e7f0',
  borderLight: 'rgba(228, 231, 240, 0.85)',
  surface:   '#ffffff',
  grad:      'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
};

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasCookieConsent()) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = (type = 'accepted') => {
    setCookieConsent(type);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="compile-cookie-banner"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        maxWidth: 420,
        width: 'calc(100% - 48px)',
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid ' + C.borderLight,
        borderRadius: 18,
        padding: '20px 22px',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(99, 102, 241, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: C.grad,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
          }}
        >
          🍪
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.textH, marginBottom: 4 }}>
            Cookie & Storage Preferences
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: C.textM, margin: '0 0 14px 0' }}>
            Compile AI uses cookies to securely store your authentication session, workspace preferences, and transformation onboarding details across visits.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleAccept('accepted')}
              style={{
                flex: 1,
                minWidth: 130,
                background: C.grad,
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: 9,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              Accept & Allow
            </button>

            <button
              onClick={() => handleAccept('essential')}
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                color: C.textB,
                border: '1px solid ' + C.border,
                padding: '9px 14px',
                borderRadius: 9,
                fontWeight: 600,
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
