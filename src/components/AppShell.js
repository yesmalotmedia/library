"use client";
import { useMemo, useState } from "react";
import BugReport from "@/components/BugReport";
import { usePathname } from "next/navigation";
import useResponsive from "@/hooks/useResponsive";
import { T } from "@/lib/theme";

const NAV_MAIN = [
  { href: "/", icon: "⊞", label: "לוח בקרה" },
  { href: "/search", icon: "⌕", label: "חיפוש ספר" },
  { href: "/my", icon: "👤", label: "אזור אישי" },
  { href: "/checkout", icon: "↗", label: "השאלה" },
  { href: "/returns", icon: "↙", label: "החזרה" },
];
const NAV_ADMIN = [{ href: "/admin", icon: "◈", label: "ניהול" }];

const Logo = ({ small }) => (
  <div style={{ lineHeight: 1.2 }}>
    <div
      style={{
        fontSize: small ? 15 : 17,
        fontWeight: 700,
        fontFamily: T.fontDisplay,
        letterSpacing: "-0.01em",
        color: T.text,
      }}
    >
      ספרי"ם
    </div>
    <div
      style={{ fontSize: 10, fontWeight: 400, color: T.text3, marginTop: 2 }}
    >
      <span style={{ fontWeight: 700, color: T.accent }}>ס</span>
      <span style={{ fontWeight: 700, color: T.accent }}>פ</span>
      <span style={{ fontWeight: 700, color: T.accent }}>ר</span>
      יית <span style={{ fontWeight: 700, color: T.accent }}>י</span>
      שיבת <span style={{ fontWeight: 700, color: T.accent }}>מ</span>
      עלות
    </div>
  </div>
);

export default function AppShell({ children }) {
  const { isMobile, isTablet, responsive } = useResponsive();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoginPage = pathname === "/login";

  const s = useMemo(
    () => ({
      shell: {
        display: "flex",
        minHeight: "100vh",
        fontFamily: T.fontBody,
        background: T.bg,
        color: T.text,
      },
      sidebar: {
        width: T.sidebarW,
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
        display: isMobile || isTablet ? "none" : "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        padding: "0 12px 16px",
        boxShadow: T.shadowSm,
      },
      topbar: {
        display: isMobile || isTablet ? "flex" : "none",
        alignItems: "center",
        justifyContent: "space-between",
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        height: 56,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 16px",
        zIndex: 100,
        boxShadow: T.shadowSm,
      },
      topbarLogo: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: T.fontDisplay,
        fontWeight: 700,
        fontSize: 16,
      },
      logoIcon: {
        width: 30,
        height: 30,
        background: T.accent,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        boxShadow: `0 2px 8px ${T.accentGlow}`,
      },
      hamburger: {
        background: "none",
        border: "none",
        fontSize: 22,
        cursor: "pointer",
        color: T.text2,
        padding: 4,
      },
      overlay: {
        display: menuOpen ? "block" : "none",
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 200,
      },
      drawer: {
        position: "fixed",
        top: 0,
        right: menuOpen ? 0 : -T.sidebarW - 20,
        width: T.sidebarW,
        bottom: 0,
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
        zIndex: 201,
        padding: "0 12px 16px",
        transition: `right 0.25s cubic-bezier(0.4,0,0.2,1)`,
        boxShadow: T.shadowLg,
      },
      sidebarLogo: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "20px 8px",
        borderBottom: `1px solid ${T.borderSoft}`,
        marginBottom: 12,
      },
      sidebarLogoIcon: {
        width: 32,
        height: 32,
        background: T.accent,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        flexShrink: 0,
        boxShadow: `0 2px 8px ${T.accentGlow}`,
      },
      sectionLabel: {
        fontSize: 10.5,
        fontWeight: 600,
        color: T.text3,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "12px 8px 4px",
      },
      divider: { height: 1, background: T.border, margin: "8px 0" },
      spacer: { flex: 1 },
      main: {
        marginRight: isMobile || isTablet ? 0 : T.sidebarW,
        flex: 1,
        padding: responsive("40px 44px", "24px 20px", "16px 14px"),
        paddingTop: isMobile || isTablet ? responsive(null, 76, 72) : 40,
        minHeight: "100vh",
      },
    }),
    [isMobile, isTablet, responsive, menuOpen],
  );

  const SidebarContent = () => (
    <>
      <div style={s.sidebarLogo}>
        <div style={s.sidebarLogoIcon}>📚</div>
        <Logo />
      </div>
      {NAV_MAIN.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          active={pathname === item.href}
          onClick={() => setMenuOpen(false)}
        />
      ))}
      <div style={s.spacer} />
      <div style={s.divider} />
      {NAV_ADMIN.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          active={pathname === item.href}
          onClick={() => setMenuOpen(false)}
          subtle
        />
      ))}
    </>
  );

  if (isLoginPage)
    return (
      <div
        style={{ fontFamily: T.fontBody, background: T.bg, minHeight: "100vh" }}
      >
        {children}
      </div>
    );

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <SidebarContent />
      </aside>
      <div style={s.topbar}>
        <div style={s.topbarLogo}>
          <div style={s.logoIcon}>📚</div>
          <Logo small />
        </div>
        <button style={s.hamburger} onClick={() => setMenuOpen((o) => !o)}>
          ☰
        </button>
      </div>
      <div style={s.overlay} onClick={() => setMenuOpen(false)} />
      <aside style={s.drawer}>
        <SidebarContent />
      </aside>
      <main style={s.main}>{children}</main>
      <BugReport />
    </div>
  );
}

function NavLink({ href, icon, label, active, onClick, subtle }) {
  const s = useMemo(
    () => ({
      link: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 10px",
        borderRadius: T.radiusSm,
        fontSize: subtle ? 13 : 13.5,
        fontWeight: active ? 600 : 500,
        color: active ? T.accent : subtle ? T.text3 : T.text2,
        background: active ? T.accentLt : "transparent",
        marginBottom: 2,
        cursor: "pointer",
        transition: `background ${T.transition}, color ${T.transition}`,
      },
      icon: {
        fontSize: 15,
        opacity: subtle ? 0.6 : 0.75,
        width: 18,
        textAlign: "center",
      },
    }),
    [active, subtle],
  );

  return (
    <a
      href={href}
      style={s.link}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = T.surface2;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={s.icon}>{icon}</span>
      {label}
    </a>
  );
}
