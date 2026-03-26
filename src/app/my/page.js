"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import useResponsive from "@/hooks/useResponsive";
import { T } from "@/lib/theme";

const TIMEOUT_MS = 60 * 1000; // דקה

function StatusBadge({ isOverdue, daysLeft }) {
  if (isOverdue)
    return (
      <span
        style={{
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 600,
          background: T.redLt,
          color: T.red,
        }}
      >
        ⚠️ באיחור
      </span>
    );
  if (daysLeft !== null && daysLeft <= 2)
    return (
      <span
        style={{
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 600,
          background: T.yellowLt,
          color: T.yellow,
        }}
      >
        ⏰ נגמר בקרוב
      </span>
    );
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        background: T.greenLt,
        color: T.green,
      }}
    >
      ● פעיל
    </span>
  );
}

export default function MyPage() {
  const { responsive } = useResponsive();
  const [tzInput, setTzInput] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("active");
  const [waitlistBook, setWaitlistBook] = useState(null); // ספר להוסיף להמתנה
  const [waitlistCode, setWaitlistCode] = useState("");
  const [waitlistMsg, setWaitlistMsg] = useState("");
  const timerRef = useRef(null);

  // Auto-logout after 1 minute
  useEffect(() => {
    if (!data) return;
    resetTimer();
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [data]);

  function resetTimer() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setData(null);
      setTzInput("");
    }, TIMEOUT_MS);
  }

  async function handleLogin() {
    if (!tzInput.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/borrower?borrowerID=${encodeURIComponent(tzInput.trim())}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        return;
      }
      setData(json);
    } catch {
      setError("שגיאת שרת");
    } finally {
      setLoading(false);
    }
  }

  async function handleWaitlist() {
    if (!waitlistCode.trim()) return;
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNum: waitlistCode.trim(),
          borrowerID: data.borrower.borrowerID,
        }),
      });
      const json = await res.json();
      setWaitlistMsg(
        res.ok ? "✅ נוספת לרשימת ההמתנה! תקבל SMS כשהספר יתפנה." : json.error,
      );
    } catch {
      setWaitlistMsg("שגיאת שרת");
    }
  }

  const s = useMemo(
    () => ({
      page: {
        display: "flex",
        flexDirection: "column",
        gap: 24,
        fontFamily: T.fontBody,
      },
      title: {
        fontFamily: T.fontDisplay,
        fontSize: responsive(21, 19, 18),
        fontWeight: 700,
        color: T.text,
        letterSpacing: "-0.02em",
        marginBottom: 4,
      },
      subtitle: { fontSize: 13, color: T.text3 },
      loginCard: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: 28,
        boxShadow: T.shadowMd,
        maxWidth: 400,
      },
      label: {
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: T.text2,
        marginBottom: 6,
      },
      input: {
        width: "100%",
        padding: "10px 14px",
        border: `1.5px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontSize: 14,
        background: T.surface,
        color: T.text,
        outline: "none",
        fontFamily: T.fontBody,
      },
      btn: (color) => ({
        padding: "10px 20px",
        borderRadius: T.radiusSm,
        background: color,
        color: "#fff",
        border: "none",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: T.fontBody,
      }),
      btnGhost: {
        padding: "8px 16px",
        borderRadius: T.radiusSm,
        background: "transparent",
        color: T.text2,
        border: `1px solid ${T.border}`,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: T.fontBody,
      },
      alertBox: {
        padding: "11px 14px",
        borderRadius: T.radiusSm,
        fontSize: 13.5,
        fontWeight: 500,
        background: T.redLt,
        color: T.red,
        border: `1px solid ${T.redBorder}`,
      },
      successBox: {
        padding: "11px 14px",
        borderRadius: T.radiusSm,
        fontSize: 13.5,
        fontWeight: 500,
        background: T.greenLt,
        color: T.green,
        border: `1px solid ${T.greenBorder}`,
      },
      profileCard: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: "16px 20px",
        boxShadow: T.shadowSm,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      },
      tabs: { display: "flex", gap: 2, borderBottom: `1px solid ${T.border}` },
      tab: (active) => ({
        padding: "9px 16px",
        fontSize: 13.5,
        fontWeight: 600,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: active ? T.accent : T.text3,
        fontFamily: T.fontBody,
        borderBottom: `2px solid ${active ? T.accent : "transparent"}`,
        marginBottom: -1,
      }),
      loanCard: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: "14px 18px",
        boxShadow: T.shadowSm,
        marginBottom: 10,
      },
      loanTitle: {
        fontWeight: 600,
        fontSize: 14,
        color: T.text,
        marginBottom: 4,
      },
      loanMeta: { fontSize: 12, color: T.text2 },
      historyItem: {
        padding: "10px 14px",
        borderRadius: T.radiusSm,
        border: `1px solid ${T.borderSoft}`,
        background: T.surface,
        marginBottom: 8,
      },
      waitCard: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: 20,
        boxShadow: T.shadowSm,
        maxWidth: 480,
      },
      emptyState: {
        color: T.text3,
        fontSize: 13.5,
        padding: "24px 0",
        textAlign: "center",
      },
    }),
    [responsive],
  );

  // ── Login screen ────────────────────────────────────────
  if (!data) {
    return (
      <div style={s.page}>
        <div>
          <h1 style={s.title}>אזור אישי</h1>
          <p style={s.subtitle}>הכנס מספר ת"ז כדי לראות את הספרים שלך</p>
        </div>
        <div style={s.loginCard}>
          <label style={s.label}>מספר ת"ז</label>
          <input
            style={{ ...s.input, marginBottom: 16 }}
            placeholder={'הכנס מספר ת"ז...'}
            value={tzInput}
            onChange={(e) => {
              setTzInput(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            onFocus={(e) => (e.target.style.borderColor = T.accent)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
            autoFocus
          />
          {error && (
            <div style={{ ...s.alertBox, marginBottom: 14 }}>{error}</div>
          )}
          <button
            style={{
              ...s.btn(T.accent),
              width: "100%",
              opacity: !tzInput || loading ? 0.5 : 1,
            }}
            onClick={handleLogin}
            disabled={!tzInput || loading}
          >
            {loading ? "טוען..." : "כניסה"}
          </button>
        </div>
      </div>
    );
  }

  const { borrower, activeLoans, history, waitlist } = data;

  // ── Personal area ────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Profile header */}
      <div style={s.profileCard}>
        <div>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 700,
              fontSize: 17,
              color: T.text,
            }}
          >
            {borrower.firstName} {borrower.lastName}
          </div>
          <div style={{ fontSize: 13, color: T.text3, marginTop: 2 }}>
            ת"ז: {borrower.borrowerID}
            {borrower.shiur && ` · שיעור ${borrower.shiur}`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: T.fontDisplay,
                fontSize: 22,
                fontWeight: 700,
                color: activeLoans.some((l) => l.isOverdue) ? T.red : T.text,
              }}
            >
              {activeLoans.length}
            </div>
            <div style={{ fontSize: 11, color: T.text3 }}>ספרים מושאלים</div>
          </div>
          <button style={s.btnGhost} onClick={() => setData(null)}>
            יציאה
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button
          style={s.tab(tab === "active")}
          onClick={() => setTab("active")}
        >
          ספרים פעילים ({activeLoans.length})
        </button>
        <button
          style={s.tab(tab === "history")}
          onClick={() => setTab("history")}
        >
          היסטוריה ({history.length})
        </button>
        <button
          style={s.tab(tab === "waitlist")}
          onClick={() => setTab("waitlist")}
        >
          רשימת המתנה ({waitlist.length})
        </button>
        <button
          style={s.tab(tab === "notify")}
          onClick={() => setTab("notify")}
        >
          הודע לי
        </button>
      </div>

      {/* Active loans */}
      {tab === "active" && (
        <div>
          {activeLoans.length === 0 && (
            <div style={s.emptyState}>אין ספרים מושאלים כרגע</div>
          )}
          {activeLoans.map((loan) => (
            <div key={loan.loanID} style={s.loanCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={s.loanTitle}>
                    {loan.book?.bookName || loan.bookID}
                  </div>
                  <div style={s.loanMeta}>
                    {loan.book?.authorName} · קוד: {loan.bookID}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: loan.isOverdue ? T.red : T.text3,
                      marginTop: 4,
                    }}
                  >
                    הושאל: {loan.loanDate} · להחזיר: {loan.dueDate}
                    {loan.daysLeft !== null &&
                      !loan.isOverdue &&
                      ` (עוד ${loan.daysLeft} ימים)`}
                    {loan.isOverdue && " · באיחור!"}
                  </div>
                </div>
                <StatusBadge
                  isOverdue={loan.isOverdue}
                  daysLeft={loan.daysLeft}
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <a
                  href={`/returns?serialNum=${loan.bookID}`}
                  style={{
                    ...s.btn(T.green),
                    padding: "6px 14px",
                    fontSize: 12,
                    display: "inline-block",
                  }}
                >
                  ↩️ החזר
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div>
          {history.length === 0 && (
            <div style={s.emptyState}>אין היסטוריית השאלות</div>
          )}
          {[...history].reverse().map((loan, i) => (
            <div key={i} style={s.historyItem}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                {loan.book?.bookName || loan.bookID}
              </div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>
                הושאל: {loan.loanDate} · הוחזר: {loan.ReturnAtDate}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Waitlist */}
      {tab === "waitlist" && (
        <div>
          {waitlist.length === 0 && (
            <div style={s.emptyState}>אינך ברשימת המתנה לאף ספר</div>
          )}
          {waitlist.map((w, i) => (
            <div key={i} style={s.historyItem}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                {w.book?.bookName || w.serialNum}
              </div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>
                נרשמת: {w.requestedAt} · תקבל SMS כשיתפנה
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notify me */}
      {tab === "notify" && (
        <div style={s.waitCard}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 8,
              color: T.text,
            }}
          >
            הודע לי כשספר מתפנה
          </div>
          <div style={{ fontSize: 13, color: T.text3, marginBottom: 14 }}>
            הזן קוד ספר מושאל — תקבל SMS כשיוחזר.
            <br />
            ראשון שמגיע לספרייה זוכה בספר.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              style={{ ...s.input, flex: 1 }}
              placeholder="קוד ספר..."
              value={waitlistCode}
              onChange={(e) => {
                setWaitlistCode(e.target.value);
                setWaitlistMsg("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleWaitlist()}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
            <button style={s.btn(T.accent)} onClick={handleWaitlist}>
              הוסף
            </button>
          </div>
          {waitlistMsg && (
            <div
              style={waitlistMsg.startsWith("✅") ? s.successBox : s.alertBox}
            >
              {waitlistMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
