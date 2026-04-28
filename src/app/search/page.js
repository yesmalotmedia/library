"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import useResponsive from "@/hooks/useResponsive";
import { T } from "@/lib/theme";

const AREAS_LIBRARY = [
  "ספרייה עגולה",
  "ספריית הוראה",
  "ספרייה מלבנית",
  "ספריית ילדים",
  "ספריית אנגלית",
];
const AREAS_BM = [
  "משולש ימין קדמי",
  "משולש ימין אחורי",
  "משולש שמאל קדמי",
  "משולש שמאל אחורי",
  "משולש כניסה",
  "משולש כניסה - ספריית תפילה על שם יהלומי",
];

// ── Notify Me Popup ────────────────────────────────────────
function NotifyPopup({ book, onClose }) {
  const [tz, setTz] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!tz.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNum: book.tempCopyCode,
          borrowerID: tz.trim(),
        }),
      });
      const data = await res.json();
      setMsg(res.ok ? "success" : data.error);
    } catch {
      setMsg("שגיאת שרת");
    } finally {
      setLoading(false);
    }
  }

  const s = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    box: {
      background: T.surface,
      borderRadius: T.radius,
      padding: 28,
      maxWidth: 380,
      width: "90%",
      boxShadow: T.shadowLg,
    },
    title: {
      fontFamily: T.fontDisplay,
      fontWeight: 700,
      fontSize: 16,
      marginBottom: 4,
      color: T.text,
    },
    sub: { fontSize: 13, color: T.text3, marginBottom: 18 },
    label: {
      display: "block",
      fontSize: 12,
      fontWeight: 600,
      color: T.text2,
      marginBottom: 5,
    },
    input: {
      width: "100%",
      padding: "9px 14px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      fontSize: 14,
      outline: "none",
      fontFamily: T.fontBody,
      marginBottom: 12,
    },
    actions: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      marginTop: 4,
    },
    btn: (color) => ({
      padding: "9px 20px",
      borderRadius: T.radiusSm,
      background: color,
      color: "#fff",
      border: "none",
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
    }),
    btnGhost: {
      padding: "9px 16px",
      borderRadius: T.radiusSm,
      background: "transparent",
      color: T.text2,
      border: `1px solid ${T.border}`,
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
    },
    success: {
      padding: "12px 14px",
      borderRadius: T.radiusSm,
      background: T.greenLt,
      color: T.green,
      border: `1px solid ${T.greenBorder}`,
      fontSize: 13.5,
    },
    error: {
      padding: "10px 14px",
      borderRadius: T.radiusSm,
      background: T.redLt,
      color: T.red,
      border: `1px solid ${T.redBorder}`,
      fontSize: 13.5,
      marginBottom: 10,
    },
  };

  if (msg === "success")
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.box} onClick={(e) => e.stopPropagation()}>
          <div style={s.title}>🔔 נרשמת בהצלחה!</div>
          <div style={{ ...s.success, marginTop: 12 }}>
            תקבל SMS כשהספר <strong>{book.bookName}</strong> יתפנה.
            <br />
            שים לב — ראשון שמגיע לספרייה זוכה!
          </div>
          <div style={s.actions}>
            <button style={s.btn(T.accent)} onClick={onClose}>
              סגור
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={(e) => e.stopPropagation()}>
        <div style={s.title}>🔔 הודע לי כשהספר מתפנה</div>
        <div style={s.sub}>{book.bookName} — כרגע מושאל</div>
        {msg && <div style={s.error}>{msg}</div>}
        <label style={s.label}>מספר ת&quot;ז</label>
        <input
          style={s.input}
          placeholder='הכנס מספר ת"ז...'
          value={tz}
          onChange={(e) => {
            setTz(e.target.value);
            setMsg("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          onFocus={(e) => (e.target.style.borderColor = T.accent)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
          autoFocus
        />
        <div style={s.actions}>
          <button style={s.btnGhost} onClick={onClose}>
            ביטול
          </button>
          <button
            style={s.btn(T.accent)}
            onClick={handleSubmit}
            disabled={!tz || loading}
          >
            {loading ? "שולח..." : "הרשם"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Accordion content ──────────────────────────────────────
function AccordionContent({ book, onNotify }) {
  const [fullBook, setFullBook] = useState(null);
  const policy = (book.loan_policy || "").trim();
  const borrowed = book.isBorrowed;

  useEffect(() => {
    fetch(`/api/books/${encodeURIComponent(book.tempCopyCode)}`)
      .then((r) => r.json())
      .then(setFullBook)
      .catch(() => {});
  }, [book.tempCopyCode]);

  const b = fullBook || book;

  const s = {
    wrap: {
      padding: "14px 20px 16px",
      background: T.surface,
      borderTop: `1px solid ${T.borderSoft}`,
      borderBottom: `2px solid ${T.border}`,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 10,
      marginBottom: 12,
    },
    label: {
      fontSize: 11,
      fontWeight: 600,
      color: T.text3,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      marginBottom: 3,
    },
    value: { fontSize: 13, color: T.text, fontWeight: 500 },
    text: { fontSize: 13, color: T.text2, lineHeight: 1.6, marginBottom: 10 },
    divider: { height: 1, background: T.borderSoft, margin: "10px 0" },
    actions: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
    },
    btnSm: (color, bg) => ({
      padding: "5px 14px",
      borderRadius: T.radiusSm,
      background: bg || color,
      color: bg ? color : "#fff",
      border: `1px solid ${color}`,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
      textDecoration: "none",
      display: "inline-block",
    }),
  };

  return (
    <div style={s.wrap} onClick={(e) => e.stopPropagation()}>
      <div style={s.grid}>
        {b.description && (
          <div style={{ gridColumn: "1/-1" }}>
            <div style={s.label}>תיאור</div>
            <div style={s.text}>{b.description}</div>
          </div>
        )}
        {b.notes && (
          <div style={{ gridColumn: "1/-1" }}>
            <div style={s.label}>הערות</div>
            <div style={s.text}>{b.notes}</div>
          </div>
        )}
        <div>
          <div style={s.label}>קטגוריה</div>
          <div style={s.value}>{b.category || "—"}</div>
        </div>
        <div>
          <div style={s.label}>מדיניות</div>
          <div style={s.value}>{policy || "רגיל"}</div>
        </div>
        {b.activeLoan?.dueDate && (
          <div>
            <div style={s.label}>להחזיר עד</div>
            <div style={{ ...s.value, color: T.red }}>
              {b.activeLoan.dueDate}
            </div>
          </div>
        )}
      </div>
      {b.isBorrowed && b.activeLoan?.borrower && (
        <div style={{ gridColumn: "1/-1", marginBottom: 4 }}>
          <div style={s.label}>מושאל אצל</div>
          <div style={s.value}>
            {b.activeLoan.borrower.firstName} {b.activeLoan.borrower.lastName}
          </div>
          {b.activeLoan.borrower.phone && (
            <div style={{ ...s.value, fontSize: 12, color: T.text2 }}>
              📞 {b.activeLoan.borrower.phone}
            </div>
          )}
        </div>
      )}
      <div style={s.divider} />
      <div style={s.actions}>
        {!borrowed && policy !== "לעיון במקום בלבד" && (
          <>
            <a
              href={`/checkout?copyCode=${b.tempCopyCode}`}
              style={s.btnSm(T.green)}
            >
              📖 השאל
            </a>
            <button style={s.btnSm(T.accent, T.accentLt)} onClick={() => {}}>
              🛒 הוסף לסל
            </button>
          </>
        )}
        {borrowed && (
          <>
            <a
              href={`/returns?copyCode=${b.tempCopyCode}`}
              style={s.btnSm(T.accent)}
            >
              ↩️ החזר
            </a>
            <button
              style={s.btnSm(T.yellow, T.yellowLt)}
              onClick={() => onNotify(b)}
            >
              🔔 הודע לי
            </button>
          </>
        )}
        {policy === "לעיון במקום בלבד" && (
          <span style={{ fontSize: 12, color: T.text3 }}>לעיון במקום בלבד</span>
        )}
      </div>
    </div>
  );
}

// ── Book row ───────────────────────────────────────────────
function BookRow({ book, expandedId, onToggle, onNotify }) {
  const isExpanded = expandedId === book.tempCopyCode;
  const borrowed = book.isBorrowed;
  const policy = (book.loan_policy || "").trim();
  const location = [book.room, book.area].filter(Boolean).join(" · ");

  const tdBase = (extra = {}) => ({
    padding: "10px 14px",
    fontSize: 13.5,
    borderBottom: isExpanded ? "none" : `1px solid ${T.borderSoft}`,
    borderTop: isExpanded ? `2px solid ${T.border}` : "none",
    ...extra,
  });

  const actionBtn = (color, bg, label, href, onClick) => {
    const style = {
      padding: "5px 12px",
      borderRadius: T.radiusSm,
      fontSize: 12,
      fontWeight: 600,
      background: bg || color,
      color: bg ? color : "#fff",
      border: `1px solid ${color}`,
      cursor: "pointer",
      fontFamily: T.fontBody,
      textDecoration: "none",
      display: "inline-block",
      whiteSpace: "nowrap",
    };
    if (href)
      return (
        <a href={href} style={style} onClick={(e) => e.stopPropagation()}>
          {label}
        </a>
      );
    return (
      <button
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <tr
        style={{ background: isExpanded ? T.surface : "", cursor: "pointer" }}
        onClick={() => onToggle(book.tempCopyCode)}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.background = "#f5f7ff";
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) e.currentTarget.style.background = "";
        }}
      >
        <td
          style={tdBase({
            width: 24,
            paddingRight: 8,
            paddingLeft: 0,
            color: T.text3,
            fontSize: 11,
          })}
        >
          {isExpanded ? "⌃" : "⌄"}
        </td>
        <td
          style={tdBase({
            fontFamily: "monospace",
            fontSize: 12,
            color: T.text3,
          })}
        >
          {book.tempCopyCode}
        </td>
        <td style={tdBase({ fontWeight: 600, maxWidth: 220 })}>
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {book.bookName || "—"}
          </div>
        </td>
        <td style={tdBase({ color: T.text2 })}>{book.authorName || "—"}</td>
        <td style={tdBase({ color: T.text2, fontSize: 13 })}>
          {location || "—"}
        </td>
        <td style={tdBase()}>
          <span
            style={{
              display: "inline-flex",
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 600,
              background: borrowed ? T.redLt : T.greenLt,
              color: borrowed ? T.red : T.green,
            }}
          >
            {borrowed ? "● מושאל" : "● פנוי"}
          </span>
        </td>
        <td style={tdBase({ textAlign: "left", whiteSpace: "nowrap" })}>
          {!isExpanded && (
            <div
              style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
            >
              {!borrowed &&
                policy !== "לעיון במקום בלבד" &&
                actionBtn(
                  T.green,
                  null,
                  "📖 השאל",
                  `/checkout?copyCode=${book.tempCopyCode}`,
                  null,
                )}
              {borrowed &&
                actionBtn(
                  T.accent,
                  null,
                  "↩️ החזר",
                  `/returns?copyCode=${book.tempCopyCode}`,
                  null,
                )}
              {borrowed &&
                actionBtn(T.yellow, T.yellowLt, "🔔", null, () =>
                  onNotify(book),
                )}
            </div>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <AccordionContent book={book} onNotify={onNotify} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function SearchPage() {
  const { responsive, isMobile } = useResponsive();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [notifyBook, setNotifyBook] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advFields, setAdvFields] = useState({
    bookName: "",
    authorName: "",
    copyCode: "",
    category: "",
    room: "all",
    area: "all",
    policy: "all",
  });

  const hasAdvancedFilters = Object.entries(advFields).some(
    ([k, v]) => v && v !== "all" && v !== "",
  );

  const s = useMemo(
    () => ({
      page: {
        display: "flex",
        flexDirection: "column",
        gap: 24,
        fontFamily: T.fontBody,
      },
      eyebrow: {
        fontSize: 11.5,
        fontWeight: 600,
        color: T.accent,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 6,
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
      searchCard: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: "16px 20px",
        boxShadow: T.shadowSm,
      },
      searchRow: { display: "flex", gap: 10 },
      inputWrap: { position: "relative", flex: 1 },
      searchIcon: {
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        color: T.text3,
        fontSize: 16,
        pointerEvents: "none",
      },
      input: {
        width: "100%",
        padding: "9px 36px 9px 14px",
        border: `1.5px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontSize: 13.5,
        background: T.surface,
        color: T.text,
        outline: "none",
        fontFamily: T.fontBody,
      },
      btnSearch: {
        padding: "9px 24px",
        borderRadius: T.radiusSm,
        background: T.accent,
        color: "#fff",
        border: "none",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: T.fontBody,
      },
      meta: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 13,
        color: T.text3,
      },
      badge: {
        background: T.accentLt,
        color: T.accent,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
      },
      tableWrap: {
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        overflow: "hidden",
        boxShadow: T.shadowSm,
      },
      table: { width: "100%", borderCollapse: "collapse" },
      th: {
        padding: "10px 14px",
        textAlign: "right",
        fontSize: 11.5,
        fontWeight: 600,
        color: T.text3,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        background: T.surface2,
        borderBottom: `1px solid ${T.border}`,
        whiteSpace: "nowrap",
      },
      alert: {
        padding: "12px 16px",
        borderRadius: T.radiusSm,
        fontSize: 13.5,
        background: T.redLt,
        color: T.red,
        border: `1px solid ${T.redBorder}`,
      },
      fieldInput: {
        padding: "7px 10px",
        border: `1.5px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontSize: 13,
        fontFamily: T.fontBody,
        outline: "none",
        width: "100%",
      },
      fieldSelect: {
        padding: "7px 10px",
        border: `1.5px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontSize: 13,
        fontFamily: T.fontBody,
        background: T.surface,
        cursor: "pointer",
        width: "100%",
      },
      fieldLabel: {
        fontSize: 11.5,
        fontWeight: 600,
        color: T.text3,
        marginBottom: 4,
        display: "block",
      },
    }),
    [responsive, isMobile],
  );

  const doSearch = useCallback(
    async (q) => {
      const isAdv = hasAdvancedFilters || showAdvanced;
      if (!q.trim() && !isAdv) return;
      setLoading(true);
      setError("");
      setExpandedId(null);
      try {
        let url;
        if (isAdv) {
          const params = new URLSearchParams({
            advanced: "true",
            limit: "2000",
          });
          if (q.trim()) params.set("q", q.trim());
          Object.entries(advFields).forEach(([k, v]) => {
            if (v && v !== "all") params.set(k, v);
          });
          url = `/api/books?${params}`;
        } else {
          url = `/api/books?q=${encodeURIComponent(q)}&limit=2000`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה");
        setResults(data.results || []);
        setSearched(true);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [advFields, hasAdvancedFilters, showAdvanced],
  );

  const advInput = (key, placeholder) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={s.fieldLabel}>{placeholder}</label>
      <input
        style={s.fieldInput}
        placeholder={`${placeholder}...`}
        value={advFields[key]}
        onChange={(e) => setAdvFields((p) => ({ ...p, [key]: e.target.value }))}
        onFocus={(e) => (e.target.style.borderColor = T.accent)}
        onBlur={(e) => (e.target.style.borderColor = T.border)}
      />
    </div>
  );

  return (
    <div style={s.page}>
      {notifyBook && (
        <NotifyPopup book={notifyBook} onClose={() => setNotifyBook(null)} />
      )}

      <div>
        <p style={s.eyebrow}>ספרייה</p>
        <h1 style={s.title}>חיפוש ספר</h1>
        <p style={s.subtitle}>חפש לפי שם הספר, שם המחבר או קוד ספר</p>
      </div>

      <div style={s.searchCard}>
        {!showAdvanced && (
          <div style={s.searchRow}>
            <div style={s.inputWrap}>
              <span style={s.searchIcon}>⌕</span>
              <input
                style={s.input}
                placeholder="שם ספר, מחבר, קוד ספר..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
                autoFocus
              />
            </div>
            <button
              style={s.btnSearch}
              onClick={() => doSearch(query)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.accentDark)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = T.accent)
              }
              disabled={loading}
            >
              {loading ? "מחפש..." : "חיפוש"}
            </button>
            <button
              style={{
                padding: "9px 12px",
                borderRadius: T.radiusSm,
                background: "transparent",
                color: T.text3,
                border: `1px solid ${T.border}`,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: T.fontBody,
              }}
              onClick={() => setShowAdvanced(true)}
            >
              ⚙ מתקדם
            </button>
          </div>
        )}

        {showAdvanced && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: `1px solid ${T.borderSoft}`,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
              }}
            >
              {advInput("bookName", "שם ספר")}
              {advInput("authorName", "מחבר")}
              {advInput("copyCode", "קוד ספר")}
              {advInput("category", "קטגוריה")}

              {/* חדר */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={s.fieldLabel}>חדר</label>
                <select
                  style={s.fieldSelect}
                  value={advFields.room}
                  onChange={(e) =>
                    setAdvFields((p) => ({
                      ...p,
                      room: e.target.value,
                      area: "all",
                    }))
                  }
                >
                  <option value="all">כל החדרים</option>
                  <option value="ספרייה">ספרייה</option>
                  <option value="בית מדרש">בית מדרש</option>
                </select>
              </div>

              {/* אזור */}
              {advFields.room !== "all" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label style={s.fieldLabel}>אזור</label>
                  <select
                    style={s.fieldSelect}
                    value={advFields.area}
                    onChange={(e) =>
                      setAdvFields((p) => ({ ...p, area: e.target.value }))
                    }
                  >
                    <option value="all">כל האזורים</option>
                    {(advFields.room === "ספרייה"
                      ? AREAS_LIBRARY
                      : AREAS_BM
                    ).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* מדיניות */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={s.fieldLabel}>מדיניות</label>
                <select
                  style={s.fieldSelect}
                  value={advFields.policy}
                  onChange={(e) =>
                    setAdvFields((p) => ({ ...p, policy: e.target.value }))
                  }
                >
                  <option value="all">כל המדיניות</option>
                  <option value="regular">רגיל</option>
                  <option value="short">טווח קצר</option>
                  <option value="inplace">לעיון במקום</option>
                </select>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <button
                style={{
                  padding: "7px 18px",
                  borderRadius: T.radiusSm,
                  background: T.accent,
                  color: "#fff",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: T.fontBody,
                }}
                onClick={() => doSearch(query)}
              >
                חפש
              </button>
              <button
                style={{
                  padding: "7px 14px",
                  borderRadius: T.radiusSm,
                  background: "transparent",
                  color: T.text3,
                  border: `1px solid ${T.border}`,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: T.fontBody,
                }}
                onClick={() => {
                  setAdvFields({
                    bookName: "",
                    authorName: "",
                    copyCode: "",
                    category: "",
                    room: "all",
                    area: "all",
                    policy: "all",
                  });
                  setResults([]);
                  setSearched(false);
                }}
              >
                נקה
              </button>
              {hasAdvancedFilters && (
                <span style={{ fontSize: 12, color: T.accent }}>
                  • פילטרים פעילים
                </span>
              )}
              <button
                style={{
                  padding: "7px 14px",
                  borderRadius: T.radiusSm,
                  background: "transparent",
                  color: T.text3,
                  border: `1px solid ${T.border}`,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: T.fontBody,
                  marginRight: "auto",
                }}
                onClick={() => {
                  setShowAdvanced(false);
                  setAdvFields({
                    bookName: "",
                    authorName: "",
                    copyCode: "",
                    category: "",
                    room: "all",
                    area: "all",
                    policy: "all",
                  });
                  setResults([]);
                  setSearched(false);
                }}
              >
                ▲ חזור לחיפוש פשוט
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <div style={s.alert}>{error}</div>}

      {searched && !loading && (
        <div style={s.meta}>
          <span>
            {results.length > 0
              ? `${results.length} תוצאות`
              : "לא נמצאו תוצאות"}
          </span>
          {results.length > 0 && (
            <span style={s.badge}>
              {results.filter((b) => !b.isBorrowed).length} פנויים
            </span>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 24 }}></th>
                {["קוד ספר", "שם הספר", "מחבר", "מיקום", "סטטוס", ""].map(
                  (h, i) => (
                    <th key={i} style={s.th}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {results.map((book) => (
                <BookRow
                  key={book.tempCopyCode}
                  book={book}
                  expandedId={expandedId}
                  onToggle={(id) =>
                    setExpandedId((prev) => (prev === id ? null : id))
                  }
                  onNotify={setNotifyBook}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
