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
  const { responsive, isMobile } = useResponsive();
  const inputRef = useRef(null);
  const didInit = useRef(false);

  const [currentCode, setCurrentCode] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  const [error, setError] = useState("");
  const [lastAdded, setLastAdded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [smsMessages, setSmsMessages] = useState(null);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    inputRef.current?.focus();
    const sn = searchParams.get("copyCode") || searchParams.get("serialNum");
    if (sn) verifyBook(sn);
  }, []);

  async function verifyBook(code) {
    const id = (code ?? currentCode).trim();
    if (!id) return;
    setError("");
    setLastAdded(null);
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
      setLastAdded(data.bookName);
      setCurrentCode("");
      setTimeout(() => setLastAdded(null), 2500);
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
      split: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 16,
        alignItems: "start",
      },
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
      successBox: {
        marginTop: 10,
        padding: "10px 14px",
        borderRadius: T.radiusSm,
        fontSize: 13,
        fontWeight: 500,
        background: T.greenLt,
        color: T.green,
        border: `1px solid ${T.greenBorder}`,
      },
      listCard: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        boxShadow: T.shadowSm,
        display: "flex",
        flexDirection: "column",
        minHeight: 200,
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
      listBody: {
        flex: 1,
        padding: "8px 0",
        overflowY: "auto",
        maxHeight: 320,
      },
      listEmpty: {
        color: T.text3,
        fontSize: 13,
        textAlign: "center",
        padding: "40px 20px",
      },
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
      listFooter: { padding: "14px 18px", borderTop: `1px solid ${T.border}` },
      confirmBtn: (disabled) => ({
        width: "100%",
        padding: "11px",
        borderRadius: T.radiusSm,
        background: disabled ? T.text3 : T.green,
        color: "#fff",
        border: "none",
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: T.fontBody,
      }),
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
    [responsive, isMobile],
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

  return (
    <div style={s.page}>
      {smsMessages && (
        <SmsPopup messages={smsMessages} onClose={() => setSmsMessages(null)} />
      )}
      <div>
        <h1 style={s.title}>החזרת ספר</h1>
        <p style={s.subtitle}>הזן קודי ספרים ואשר החזרה</p>
      </div>

      <div style={s.split}>
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
                setLastAdded(null);
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
          {lastAdded && <div style={s.successBox}>✓ נוסף: {lastAdded}</div>}
          <div style={{ marginTop: 14, fontSize: 12, color: T.text3 }}>
            לחץ Enter אחרי כל קוד — השדה יתרוקן אוטומטית
          </div>
        </div>

        <div style={s.listCard}>
          <div style={s.listHeader}>
            <span style={s.listTitle}>ספרים להחזרה</span>
            {returnItems.length > 0 && (
              <span style={s.listCount}>{returnItems.length}</span>
            )}
          </div>
          <div style={s.listBody}>
            {returnItems.length === 0 ? (
              <div style={s.listEmpty}>הספרים שתוסיף יופיעו כאן</div>
            ) : (
              returnItems.map((item) => (
                <div key={item.id} style={s.listItem}>
                  <div>
                    <div style={s.listName}>{item.bookName}</div>
                    <div style={s.listMeta}>
                      {item.authorName} · {item.id}
                    </div>
                  </div>
                  <button
                    style={s.listRemove}
                    onClick={() =>
                      setReturnItems((prev) =>
                        prev.filter((i) => i.id !== item.id),
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          <div style={s.listFooter}>
            <button
              style={s.confirmBtn(returnItems.length === 0 || confirming)}
              disabled={returnItems.length === 0 || confirming}
              onClick={handleConfirm}
            >
              {confirming
                ? "מעבד..."
                : `↩️ אשר החזרה${returnItems.length > 0 ? ` (${returnItems.length})` : ""}`}
            </button>
          </div>
        </div>
      </div>
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
