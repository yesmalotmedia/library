"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { T } from "@/lib/theme";

const BUG_TYPES = [
  "תקלה טכנית",
  "שגיאה בנתונים",
  "בעיית תצוגה",
  "פעולה לא עובדת",
  "בקשת שיפור",
  "אחר",
];

export default function BugReport() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "",
    description: "",
    reporter: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!form.description.trim()) {
      setError("נא למלא תיאור הבעיה");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.type || "ללא סוג",
          description: form.description,
          reporter: form.reporter,
          type: form.type,
          page: pathname,
        }),
      });
      if (!res.ok) throw new Error("שגיאה");
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setForm({ type: "", description: "", reporter: "" });
      }, 2500);
    } catch {
      setError("שגיאה בשליחה, נסה שוב");
    } finally {
      setSending(false);
    }
  }

  const s = {
    fab: {
      position: "fixed",
      bottom: 24,
      left: 24,
      zIndex: 300,
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: T.surface,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadowMd,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      color: T.text3,
      transition: "all 0.2s",
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.3)",
      zIndex: 400,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      padding: 24,
    },
    box: {
      background: T.surface,
      borderRadius: T.radius,
      padding: 24,
      width: 340,
      boxShadow: T.shadowLg,
      border: `1px solid ${T.border}`,
    },
    title: {
      fontFamily: T.fontDisplay,
      fontWeight: 700,
      fontSize: 15,
      color: T.text,
      marginBottom: 4,
    },
    sub: { fontSize: 12, color: T.text3, marginBottom: 16 },
    label: {
      fontSize: 12,
      fontWeight: 600,
      color: T.text2,
      marginBottom: 4,
      display: "block",
    },
    input: {
      width: "100%",
      padding: "8px 12px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      fontSize: 13,
      fontFamily: T.fontBody,
      marginBottom: 12,
      boxSizing: "border-box",
      outline: "none",
    },
    textarea: {
      width: "100%",
      padding: "8px 12px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      fontSize: 13,
      fontFamily: T.fontBody,
      resize: "vertical",
      minHeight: 80,
      marginBottom: 12,
      boxSizing: "border-box",
      outline: "none",
    },
    actions: { display: "flex", gap: 8, justifyContent: "flex-end" },
    btn: (color, disabled) => ({
      padding: "8px 18px",
      borderRadius: T.radiusSm,
      background: disabled ? T.text3 : color,
      color: "#fff",
      border: "none",
      fontSize: 13,
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: T.fontBody,
    }),
    btnGhost: {
      padding: "8px 14px",
      borderRadius: T.radiusSm,
      background: "transparent",
      color: T.text2,
      border: `1px solid ${T.border}`,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: T.fontBody,
    },
    alert: {
      padding: "8px 12px",
      borderRadius: T.radiusSm,
      background: T.redLt,
      color: T.red,
      border: `1px solid ${T.redBorder}`,
      fontSize: 12,
      marginBottom: 10,
    },
    success: {
      padding: "12px",
      borderRadius: T.radiusSm,
      background: T.greenLt,
      color: T.green,
      border: `1px solid ${T.greenBorder}`,
      fontSize: 13,
      textAlign: "center",
    },
  };

  return (
    <>
      <button
        style={s.fab}
        onClick={() => setOpen(true)}
        title="דווח על תקלה"
        onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
        onMouseLeave={(e) => (e.currentTarget.style.background = T.surface)}
      >
        🐛
      </button>

      {open && (
        <div style={s.overlay} onClick={() => setOpen(false)}>
          <div style={s.box} onClick={(e) => e.stopPropagation()}>
            <div style={s.title}>דיווח על תקלה</div>
            <div style={s.sub}>עמוד: {pathname}</div>

            {sent ? (
              <div style={s.success}>✅ הדיווח נשלח, תודה!</div>
            ) : (
              <>
                {error && <div style={s.alert}>{error}</div>}

                <label style={s.label}>סוג הבעיה</label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  {BUG_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, type: f.type === t ? "" : t }))
                      }
                      style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: T.fontBody,
                        transition: "all 0.15s",
                        background: form.type === t ? T.accent : T.surface2,
                        color: form.type === t ? "#fff" : T.text2,
                        border: `1.5px solid ${form.type === t ? T.accent : T.border}`,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <label style={s.label}>תיאור מפורט *</label>
                <textarea
                  style={s.textarea}
                  placeholder="מה קרה? מה ציפית שיקרה?"
                  value={form.description}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, description: e.target.value }));
                    setError("");
                  }}
                  onFocus={(e) => (e.target.style.borderColor = T.accent)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />

                <label style={s.label}>שם + טלפון (אופציונלי)</label>
                <input
                  style={s.input}
                  placeholder="שם ומספר טלפון..."
                  value={form.reporter}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reporter: e.target.value }))
                  }
                  onFocus={(e) => (e.target.style.borderColor = T.accent)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />

                <div style={s.actions}>
                  <button style={s.btnGhost} onClick={() => setOpen(false)}>
                    ביטול
                  </button>
                  <button
                    style={s.btn(T.accent, sending)}
                    disabled={sending}
                    onClick={handleSubmit}
                  >
                    {sending ? "שולח..." : "שלח"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
