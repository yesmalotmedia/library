"use client";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useResponsive from "@/hooks/useResponsive";
import { T } from "@/lib/theme";

function SmsPopup({ messages, onClose }) {
  if (!messages?.length) return null;
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
      maxWidth: 420,
      width: "90%",
      boxShadow: T.shadowLg,
    },
    title: {
      fontFamily: T.fontDisplay,
      fontWeight: 700,
      fontSize: 16,
      marginBottom: 4,
    },
    sub: { fontSize: 12, color: T.text3, marginBottom: 16 },
    msg: {
      background: T.surface2,
      borderRadius: T.radiusSm,
      padding: "10px 14px",
      fontSize: 13,
      marginBottom: 8,
      border: `1px solid ${T.border}`,
    },
    btn: {
      marginTop: 16,
      padding: "9px 24px",
      background: T.accent,
      color: "#fff",
      border: "none",
      borderRadius: T.radiusSm,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
    },
  };
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={(e) => e.stopPropagation()}>
        <div style={s.title}>📱 הדמיית SMS</div>
        <div style={s.sub}>הממתינים לספרים אלו קיבלו הודעה:</div>
        {messages.map((m, i) => (
          <div key={i} style={s.msg}>
            <div style={{ fontWeight: 600, color: T.accent }}>
              → {m.phone || m.borrowerID}
            </div>
            <div style={{ fontSize: 12, color: T.text2 }}>
              ראשון שמגיע לספרייה זוכה
            </div>
          </div>
        ))}
        <button style={s.btn} onClick={onClose}>
          סגור
        </button>
      </div>
    </div>
  );
}

function ReturnsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { responsive } = useResponsive();
  const inputRef = useRef(null);
  const codeRef = useRef(null);
  const didInit = useRef(false);

  const [currentCode, setCurrentCode] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [smsMessages, setSmsMessages] = useState(null);
  const [addingMore, setAddingMore] = useState(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    inputRef.current?.focus();
    const sn = searchParams.get("copyCode") || searchParams.get("serialNum");
    if (sn) verifyBook(sn);
  }, []);

  useEffect(() => {
    if (addingMore) codeRef.current?.focus();
  }, [addingMore]);

  async function verifyBook(code) {
    const id = (code ?? currentCode).trim();
    if (!id) return;
    setError("");
    if (returnItems.find((i) => i.id === id)) {
      setError("קוד ספר זה כבר ברשימה");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      if (!data.isBorrowed) {
        setError(`"${data.bookName}" אינו מושאל כרגע`);
        return;
      }
      setReturnItems((prev) => [
        ...prev,
        {
          id,
          bookName: data.bookName,
          authorName: data.authorName,
          activeLoan: data.activeLoan,
        },
      ]);
      setCurrentCode("");
      setAddingMore(false);
    } catch {
      setError("שגיאה בחיפוש ספר");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (returnItems.length === 0) return;
    setConfirming(true);
    const results = [];
    const allSms = [];
    for (const item of returnItems) {
      try {
        const res = await fetch("/api/loans/return", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serialNum: item.id }),
        });
        const data = await res.json();
        results.push({ ...item, success: res.ok, data });
        if (data.waitlistNotified?.length > 0)
          allSms.push(...data.waitlistNotified);
      } catch {
        results.push({ ...item, success: false, data: { error: "שגיאת שרת" } });
      }
    }
    setResult(results);
    if (allSms.length > 0) setSmsMessages(allSms);
    setConfirming(false);
  }

  const s = useMemo(
    () => ({
      page: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily: T.fontBody,
        maxWidth: 560,
        margin: "0 auto",
        width: "100%",
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
      card: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: 20,
        boxShadow: T.shadowSm,
      },
      label: {
        fontSize: 12,
        fontWeight: 600,
        color: T.text2,
        marginBottom: 5,
        display: "block",
      },
      row: { display: "flex", gap: 8 },
      input: {
        flex: 1,
        padding: "9px 14px",
        border: `1.5px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontSize: 13.5,
        background: T.surface,
        color: T.text,
        outline: "none",
        fontFamily: T.fontBody,
      },
      btn: (color, disabled) => ({
        padding: "9px 18px",
        borderRadius: T.radiusSm,
        background: disabled ? T.text3 : color,
        color: "#fff",
        border: "none",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        fontFamily: T.fontBody,
      }),
      btnFull: (color, disabled) => ({
        width: "100%",
        padding: "12px",
        borderRadius: T.radiusSm,
        background: disabled ? T.text3 : color,
        color: "#fff",
        border: "none",
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: T.fontBody,
      }),
      btnOutline: (color) => ({
        width: "100%",
        padding: "12px",
        borderRadius: T.radiusSm,
        background: "transparent",
        color,
        border: `2px solid ${color}`,
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: T.fontBody,
      }),
      alertBox: {
        marginTop: 10,
        padding: "10px 14px",
        borderRadius: T.radiusSm,
        fontSize: 13,
        fontWeight: 500,
        background: T.redLt,
        color: T.red,
        border: `1px solid ${T.redBorder}`,
      },
      listCard: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        boxShadow: T.shadowSm,
        overflow: "hidden",
      },
      listHeader: {
        padding: "14px 18px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      },
      listTitle: { fontWeight: 600, fontSize: 14, color: T.text },
      listCount: {
        fontSize: 12,
        fontWeight: 600,
        color: T.accent,
        background: T.accentLt,
        borderRadius: 999,
        padding: "2px 10px",
      },
      listBody: { padding: "8px 0", overflowY: "auto", maxHeight: 280 },
      listItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 18px",
        borderBottom: `1px solid ${T.borderSoft}`,
      },
      listName: { fontWeight: 500, fontSize: 13.5, color: T.text },
      listMeta: { fontSize: 12, color: T.text3, marginTop: 1 },
      listRemove: {
        background: "none",
        border: "none",
        color: T.text3,
        cursor: "pointer",
        fontSize: 17,
        padding: "0 4px",
        lineHeight: 1,
      },
      actionsCard: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: 16,
        boxShadow: T.shadowSm,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      },
      successAlert: {
        padding: "12px 16px",
        borderRadius: T.radiusSm,
        fontSize: 15,
        fontWeight: 500,
        background: T.greenLt,
        color: T.green,
        border: `1px solid ${T.greenBorder}`,
      },
      resultItem: (ok) => ({
        padding: "10px 14px",
        borderRadius: T.radiusSm,
        border: `1px solid ${ok ? T.greenBorder : T.redBorder}`,
        background: ok ? T.greenLt : T.redLt,
        marginBottom: 8,
      }),
    }),
    [responsive],
  );

  if (result) {
    const succeeded = result.filter((r) => r.success);
    return (
      <div style={s.page}>
        {smsMessages && (
          <SmsPopup
            messages={smsMessages}
            onClose={() => setSmsMessages(null)}
          />
        )}
        <h1 style={s.title}>החזרה</h1>
        {succeeded.length > 0 && (
          <div style={s.successAlert}>
            ✅ {succeeded.length} ספרים הוחזרו בהצלחה!
          </div>
        )}
        <div style={s.card}>
          {result.map((r, i) => (
            <div key={i} style={s.resultItem(r.success)}>
              <div style={{ fontWeight: 600 }}>{r.bookName}</div>
              <div
                style={{
                  fontSize: 12,
                  color: r.success ? T.green : T.red,
                  marginTop: 2,
                }}
              >
                {r.success
                  ? `✓ הוחזר · ${r.data.loan?.ReturnAtDate}`
                  : `✗ ${r.data.error}`}
              </div>
            </div>
          ))}
        </div>
        <button
          style={{
            ...s.btn(T.accent),
            alignSelf: "flex-start",
            padding: "10px 24px",
          }}
          onClick={() => router.push("/")}
        >
          חזור לבית
        </button>
      </div>
    );
  }

  const hasItems = returnItems.length > 0;

  return (
    <div style={s.page}>
      {smsMessages && (
        <SmsPopup messages={smsMessages} onClose={() => setSmsMessages(null)} />
      )}
      <div>
        <h1 style={s.title}>החזרת ספר</h1>
        <p style={s.subtitle}>הזן קוד ספר ואשר החזרה</p>
      </div>

      {!hasItems && (
        <div style={s.card}>
          <label style={s.label}>קוד ספר</label>
          <div style={s.row}>
            <input
              ref={inputRef}
              style={s.input}
              placeholder="הזן קוד ספר ולחץ Enter..."
              value={currentCode}
              onChange={(e) => {
                setCurrentCode(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && verifyBook()}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
            <button
              style={s.btn(T.accent, loading)}
              onClick={() => verifyBook()}
              disabled={loading}
            >
              {loading ? "..." : "הוסף"}
            </button>
          </div>
          {error && <div style={s.alertBox}>{error}</div>}
        </div>
      )}

      {hasItems && (
        <div style={s.listCard}>
          <div style={s.listHeader}>
            <span style={s.listTitle}>ספרים להחזרה</span>
            <span style={s.listCount}>{returnItems.length}</span>
          </div>
          {error && (
            <div style={{ ...s.alertBox, margin: "10px 18px 0" }}>{error}</div>
          )}
          <div style={s.listBody}>
            {returnItems.map((item) => (
              <div key={item.id} style={s.listItem}>
                <div>
                  <div style={s.listName}>{item.bookName}</div>
                  <div style={s.listMeta}>
                    {item.authorName} · {item.id}
                  </div>
                </div>
                <button
                  style={s.listRemove}
                  onClick={() => {
                    setReturnItems((prev) =>
                      prev.filter((i) => i.id !== item.id),
                    );
                    setError("");
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasItems && (
        <div style={s.actionsCard}>
          {addingMore ? (
            <>
              <label style={s.label}>קוד ספר נוסף</label>
              <div style={s.row}>
                <input
                  ref={codeRef}
                  style={s.input}
                  placeholder="הזן קוד ספר נוסף ולחץ Enter..."
                  value={currentCode}
                  onChange={(e) => {
                    setCurrentCode(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && verifyBook()}
                  onFocus={(e) => (e.target.style.borderColor = T.accent)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />
                <button
                  style={s.btn(T.accent, loading)}
                  onClick={() => verifyBook()}
                  disabled={loading}
                >
                  {loading ? "..." : "הוסף"}
                </button>
                <button
                  style={s.btn(T.text2)}
                  onClick={() => {
                    setAddingMore(false);
                    setCurrentCode("");
                    setError("");
                  }}
                >
                  ביטול
                </button>
              </div>
              {error && <div style={s.alertBox}>{error}</div>}
            </>
          ) : (
            <>
              <button
                style={s.btnFull(T.green, confirming)}
                disabled={confirming}
                onClick={handleConfirm}
              >
                {confirming
                  ? "מעבד..."
                  : `↩️ אשר החזרה (${returnItems.length})`}
              </button>
              <button
                style={s.btnOutline(T.accent)}
                onClick={() => {
                  setAddingMore(true);
                  setError("");
                }}
              >
                ➕ הוסף ספר נוסף
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense>
      <ReturnsContent />
    </Suspense>
  );
}
