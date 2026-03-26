'use client';
import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { T } from '@/lib/theme';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(searchParams.get('from') || '/admin');
    } catch { setError('שגיאת שרת'); }
    finally { setLoading(false); }
  }

  const s = useMemo(() => ({
    page: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.bg, fontFamily: T.fontBody,
    },
    wrap: { width: '100%', maxWidth: 380, padding: '0 16px' },
    logoWrap: { textAlign: 'center', marginBottom: 32 },
    logoIcon: {
      width: 52, height: 52, background: T.accent, borderRadius: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, margin: '0 auto 16px',
      boxShadow: `0 4px 20px ${T.accentGlow}`,
    },
    logoTitle: { fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 6 },
    logoSub:   { color: T.text3, fontSize: 13 },
    card: {
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.radius, padding: 28, boxShadow: T.shadowMd,
    },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: T.text2, marginBottom: 6 },
    input: {
      width: '100%', padding: '10px 14px',
      border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
      fontSize: 14, background: T.surface, color: T.text,
      outline: 'none', fontFamily: T.fontBody,
      marginBottom: 16,
    },
    btn: {
      width: '100%', padding: 11, borderRadius: T.radiusSm,
      background: T.accent, color: '#fff', border: 'none',
      fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: T.fontBody,
      boxShadow: `0 1px 3px ${T.accentGlow}`,
    },
    alert: { padding: '11px 14px', borderRadius: T.radiusSm, fontSize: 13.5, fontWeight: 500, background: T.redLt, color: T.red, border: `1px solid ${T.redBorder}`, marginBottom: 14 },
    back: { display: 'block', textAlign: 'center', marginTop: 20, fontSize: 12, color: T.accent },
  }), []);

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>📚</div>
          <h1 style={s.logoTitle}>כניסת ספרן</h1>
          <p style={s.logoSub}>פאנל ניהול · סֵדֶר</p>
        </div>
        <div style={s.card}>
          <label style={s.label}>סיסמה</label>
          <input style={s.input} type="password" placeholder="••••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            onFocus={e => e.target.style.borderColor = T.accent}
            onBlur={e => e.target.style.borderColor = T.border}
            autoFocus
          />
          {error && <div style={s.alert}>{error}</div>}
          <button style={{ ...s.btn, opacity: (!password || loading) ? 0.5 : 1 }}
            onClick={handleLogin} disabled={!password || loading}
            onMouseEnter={e => e.currentTarget.style.background = T.accentDark}
            onMouseLeave={e => e.currentTarget.style.background = T.accent}>
            {loading ? 'מתחבר...' : 'כניסה לפאנל'}
          </button>
        </div>
        <a href="/" style={s.back}>חזור לעמוד הראשי</a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>;
}
