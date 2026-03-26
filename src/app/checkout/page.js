"use client";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useResponsive from "@/hooks/useResponsive";
import { T } from "@/lib/theme";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { responsive, isMobile } = useResponsive();
  const inputRef = useRef(null);

  const [borrowerID, setBorrowerID] = useState("");
  const [borrower, setBorrower] = useState(null);
  const [borrowerError, setBorrowerError] = useState("");

  const [currentCode, setCurrentCode] = useState("");
  const [bookItems, setBookItems] = useState([]);
  const [bookError, setBookError] = useState("");
  const [lastAdded, setLastAdded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);

  // מילוי שדה הקוד מה-URL בטעינה
  useEffect(() => {
    const code = searchParams.get("copyCode") || searchParams.get("serialNum");
    if (code) setCurrentCode(code);
  }, []);

  // פוקוס אוטומטי על שדה הספר אחרי אימות שואל
  useEffect(() => {
    if (borrower) inputRef.current?.focus();
  }, [borrower]);

  // הרצת בדיקת ספר אחרי אימות תלמיד
  useEffect(() => {
    const code = searchParams.get("copyCode") || searchParams.get("serialNum");
    if (code && borrower) verifyBook(code);
  }, [borrower]);

  async function verifyBorrower() {
    if (!borrowerID.trim()) return;
    setBorrowerError("");
    setBorrower(null);
    try {
      const res = await fetch(
        `/api/borrowers/${encodeURIComponent(borrowerID.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setBorrowerError(data.error);
        return;
      }
      if (data.isBlocked === "TRUE") {
        setBorrowerError("תלמיד זה חסום במערכת");
        return;
      }
      setBorrower(data);
    } catch {
      setBorrowerError("שגיאה בחיפוש תלמיד");
    }
  }

  async function verifyBook(code) {
    const id = (code ?? currentCode).trim();
    if (!id) return;
    setBookError("");
    setLastAdded(null);
    if (bookItems.find((i) => i.id === id)) {
      setBookError("קוד ספר זה כבר נוסף");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) {
        setBookError(data.error);
        return;
      }
      if (data.isBorrowed) {
        setBookError(`"${data.bookName}" כבר מושאל`);
        return;
      }
      if ((data.loan_policy || "").trim() === "לעיון במקום בלבד") {
        setBookError(`"${data.bookName}" לעיון במקום בלבד`);
        return;
      }
      setBookItems((prev) => [
        ...prev,
        { id, bookName: data.bookName, authorName: data.authorName },
      ]);
      setLastAdded(data.bookName);
      setCurrentCode("");
      setTimeout(() => setLastAdded(null), 2500);
    } catch {
      setBookError("שגיאה בחיפוש ספר");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!borrower || bookItems.length === 0) return;
    setConfirming(true);
    try {
      const res = await fetch("/api/loans/checkout-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNums: bookItems.map((i) => i.id),
          borrowerID: borrower.borrowerID,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookError(data.error);
        return;
      }
      setResult(data);
    } catch {
      setBookError("שגיאת שרת");
    } finally {
      setConfirming(false);
    }
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
      input: (disabled) => ({
        flex: 1,
        padding: "9px 14px",
        border: `1.5px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontSize: 13.5,
        background: disabled ? T.surface2 : T.surface,
        color: T.text,
        outline: "none",
        fontFamily: T.fontBody,
        opacity: disabled ? 0.6 : 1,
      }),
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
      borrowerBox: {
        marginTop: 12,
        padding: "11px 14px",
        background: T.accentLt,
        borderRadius: T.radiusSm,
        border: `1px solid #bfdbfe`,
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
      listAuthor: { fontSize: 12, color: T.text3, marginTop: 1 },
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
      loanItem: {
        padding: "8px 12px",
        background: T.surface2,
        borderRadius: T.radiusSm,
        border: `1px solid ${T.border}`,
        fontSize: 13,
        marginBottom: 6,
      },
    }),
    [responsive, isMobile],
  );

  if (result)
    return (
      <div style={s.page}>
        <h1 style={s.title}>השאלה</h1>
        <div style={s.successAlert}>✅ ההשאלה בוצעה בהצלחה!</div>
        <div style={s.card}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {result.borrower?.firstName} {result.borrower?.lastName}
          </div>
          <div style={{ fontSize: 13, color: T.text3, marginBottom: 14 }}>
            הספרים הבאים הושאלו:
          </div>
          {result.results?.map((r, i) => (
            <div key={i} style={s.loanItem}>
              <div style={{ fontWeight: 600 }}>{r.book?.bookName}</div>
              <div style={{ fontSize: 12, color: T.text3 }}>
                להחזיר עד: {r.loan?.dueDate}
              </div>
            </div>
          ))}
          {result.errors?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 13,
                  color: T.red,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                ⚠️ לא הושאלו:
              </div>
              {result.errors.map((e, i) => (
                <div
                  key={i}
                  style={{ ...s.alertBox, marginTop: 0, marginBottom: 6 }}
                >
                  {e.id}: {e.error}
                </div>
              ))}
            </div>
          )}
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

  return (
    <div style={s.page}>
      <div>
        <h1 style={s.title}>השאלת ספר</h1>
        <p style={s.subtitle}>אמת תלמיד, הזן קודי ספרים ואשר</p>
      </div>

      <div style={s.card}>
        <label style={s.label}>מספר ת&quot;ז תלמיד</label>
        <div style={s.row}>
          <input
            style={s.input(false)}
            placeholder='הכנס מספר ת"ז...'
            value={borrowerID}
            onChange={(e) => {
              setBorrowerID(e.target.value);
              setBorrower(null);
              setBorrowerError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && verifyBorrower()}
            onFocus={(e) => (e.target.style.borderColor = T.accent)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
            autoFocus
          />
          <button style={s.btn(T.accent)} onClick={verifyBorrower}>
            אמת
          </button>
        </div>
        {borrowerError && <div style={s.alertBox}>{borrowerError}</div>}
        {borrower && (
          <div style={s.borrowerBox}>
            <div style={{ fontWeight: 600 }}>
              {borrower.firstName} {borrower.lastName}
            </div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>
              ת&quot;ז: {borrower.borrowerID}
              {borrower.shiur && ` · שיעור ${borrower.shiur}`}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          ...s.split,
          opacity: borrower ? 1 : 0.4,
          pointerEvents: borrower ? "auto" : "none",
        }}
      >
        <div style={s.card}>
          <label style={s.label}>קוד ספר</label>
          <div style={s.row}>
            <input
              ref={inputRef}
              style={s.input(!borrower)}
              placeholder="הזן קוד ספר ולחץ Enter..."
              value={currentCode}
              onChange={(e) => {
                setCurrentCode(e.target.value);
                setBookError("");
                setLastAdded(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && verifyBook()}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
              disabled={!borrower}
            />
            <button
              style={s.btn(T.accent, !borrower || loading)}
              onClick={() => verifyBook()}
              disabled={!borrower || loading}
            >
              {loading ? "..." : "הוסף"}
            </button>
          </div>
          {bookError && <div style={s.alertBox}>{bookError}</div>}
          {lastAdded && <div style={s.successBox}>✓ נוסף: {lastAdded}</div>}
          <div style={{ marginTop: 14, fontSize: 12, color: T.text3 }}>
            לחץ Enter אחרי כל קוד — השדה יתרוקן אוטומטית
          </div>
        </div>

        <div style={s.listCard}>
          <div style={s.listHeader}>
            <span style={s.listTitle}>ספרים להשאלה</span>
            {bookItems.length > 0 && (
              <span style={s.listCount}>{bookItems.length}</span>
            )}
          </div>
          <div style={s.listBody}>
            {bookItems.length === 0 ? (
              <div style={s.listEmpty}>הספרים שתוסיף יופיעו כאן</div>
            ) : (
              bookItems.map((item) => (
                <div key={item.id} style={s.listItem}>
                  <div>
                    <div style={s.listName}>{item.bookName}</div>
                    <div style={s.listAuthor}>
                      {item.authorName} · {item.id}
                    </div>
                  </div>
                  <button
                    style={s.listRemove}
                    onClick={() =>
                      setBookItems((prev) =>
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
              style={s.confirmBtn(
                !borrower || bookItems.length === 0 || confirming,
              )}
              disabled={!borrower || bookItems.length === 0 || confirming}
              onClick={handleConfirm}
            >
              {confirming
                ? "מעבד..."
                : `✓ אשר השאלה${bookItems.length > 0 ? ` (${bookItems.length})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
