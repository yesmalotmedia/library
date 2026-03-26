'use client';
import { useMemo } from 'react';
import useResponsive from '@/hooks/useResponsive';
import { T } from '@/lib/theme';

const CARDS = [
  { href: '/search',   icon: '🔍', title: 'חיפוש ספר',  desc: 'חפש לפי שם, מחבר או קוד ספר',    color: T.accent,  bg: T.accentLt },
  { href: '/my',       icon: '👤', title: 'אזור אישי',   desc: 'הספרים שלי, היסטוריה והמתנות',   color: '#7c3aed', bg: '#f5f3ff'  },
  { href: '/checkout', icon: '📖', title: 'השאלת ספר',   desc: 'השאל ספר לפי קוד ספר ות"ז',      color: T.green,   bg: T.greenLt  },
  { href: '/returns',  icon: '↩️', title: 'החזרת ספר',   desc: 'רשום החזרה לפי קוד ספר',          color: T.yellow,  bg: T.yellowLt },
];

export default function HomePage() {
  const { responsive } = useResponsive();

  const s = useMemo(() => ({
    page:     { display: 'flex', flexDirection: 'column', gap: 32 },
    eyebrow:  { fontSize: 11.5, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 },
    title:    { fontFamily: T.fontDisplay, fontSize: responsive(28,24,22), fontWeight: 700, color: T.text, letterSpacing: '-0.02em', marginBottom: 6 },
    subtitle: { fontSize: 13.5, color: T.text3 },
    grid:     { display: 'grid', gridTemplateColumns: responsive('repeat(4,1fr)','repeat(2,1fr)','1fr'), gap: responsive(16,14,12) },
  }), [responsive]);

  return (
    <div style={s.page}>
      <div>
        <p style={s.eyebrow}>מערכת ניהול ספרייה</p>
        <h1 style={s.title}>ברוך הבא לספרייה 📚</h1>
        <p style={s.subtitle}>חפש ספר, השאל, החזר, או היכנס לאזור האישי שלך</p>
      </div>
      <div style={s.grid}>
        {CARDS.map(card => <ActionCard key={card.href} {...card} />)}
      </div>
    </div>
  );
}

function ActionCard({ href, icon, title, desc, color, bg }) {
  const s = useMemo(() => ({
    card: { display: 'flex', flexDirection: 'column', background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '22px 20px', cursor: 'pointer', transition: `transform ${T.transition}, box-shadow ${T.transition}`, boxShadow: T.shadowSm, position: 'relative', overflow: 'hidden', textDecoration: 'none' },
    bar:  { position: 'absolute', top: 0, right: 0, left: 0, height: 3, background: color },
    iconWrap: { width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 },
    title: { fontWeight: 700, fontSize: 15, marginBottom: 6, color: T.text },
    desc:  { color: T.text3, fontSize: 13, lineHeight: 1.5 },
  }), [bg, color]);

  return (
    <a href={href} style={s.card}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = T.shadowLg; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = T.shadowSm; }}>
      <div style={s.bar} />
      <div style={s.iconWrap}>{icon}</div>
      <div style={s.title}>{title}</div>
      <div style={s.desc}>{desc}</div>
    </a>
  );
}
