"use client";
import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { MAX_BORROWER_ID, MAX_COPY_CODE } from "@/lib/constants";
import { useSearchParams, useRouter } from "next/navigation";
import useResponsive from "@/hooks/useResponsive";
import { T } from "@/lib/theme";

// ── Active Loans Accordion ───────────────────────────────
function ActiveLoansAccordion({ loans }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      style={{ marginTop: 8, borderTop: "1px solid #bfdbfe", paddingTop: 6 }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          color: T.text2,
          fontFamily: T.fontBody,
          fontWeight: 600,
          padding: "2px 0",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {open ? "▲" : "▼"} הצג ספרים מושאלים ({loans.length})
      </button>
      {open && (
        <div style={{ marginTop: 6 }}>
          {loans.map((loan, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px 0",
                borderBottom:
                  i < loans.length - 1 ? "1px solid #dbeafe" : "none",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 12 }}>
                  {loan.book?.bookName || loan.bookID}
                </div>
                <div style={{ fontSize: 11, color: T.text3 }}>
                  קוד: {loan.bookID}
                  {loan.dueDate ? ` · עד: ${loan.dueDate}` : ""}
                </div>
              </div>
              {loan.isOverdue && (
                <span style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>
                  ⚠️ באיחור
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step Bar ────────────────────────────────────────────
function StepBar({ borrower, hasBooks }) {
  const step = !borrower ? 1 : !hasBooks ? 2 : 3;
  const steps = [
    { n: 1, label: 'הזן ת"ז' },
    { n: 2, label: "הזן קוד ספר" },
    { n: 3, label: "אשר השאלה" },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        marginBottom: 4,
      }}
    >
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background:
                  step > s.n ? T.green : step === s.n ? T.accent : T.border,
                color: step >= s.n ? "#fff" : T.text3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                transition: "all 0.3s",
                boxShadow: step === s.n ? `0 0 0 4px ${T.accentLt}` : "none",
              }}
            >
              {step > s.n ? "✓" : s.n}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: step === s.n ? 700 : 400,
                color: step === s.n ? T.accent : step > s.n ? T.green : T.text3,
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                height: 2,
                width: 60,
                background: step > i + 1 ? T.green : T.border,
                margin: "0 4px",
                marginBottom: 18,
                transition: "all 0.3s",
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Confirm Modal ────────────────────────────────────────
function ConfirmModal({ bookItems, borrower, confirming, onConfirm, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: T.surface,
          borderRadius: T.radius,
          padding: 28,
          maxWidth: 440,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 700,
            fontSize: 18,
            marginBottom: 6,
            color: T.text,
          }}
        >
          אישור השאלה
        </div>
        <div style={{ fontSize: 13, color: T.text3, marginBottom: 16 }}>
          {borrower?.firstName} {borrower?.lastName} · ת"ז:{" "}
          {borrower?.borrowerID}
        </div>
        <div
          style={{
            background: T.surface2,
            borderRadius: T.radiusSm,
            border: `1px solid ${T.border}`,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          {bookItems.map((item, i) => (
            <div
              key={item.id}
              style={{
                padding: "10px 14px",
                borderBottom:
                  i < bookItems.length - 1
                    ? `1px solid ${T.borderSoft}`
                    : "none",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {item.bookName}
              </div>
              <div style={{ fontSize: 11, color: T.text3 }}>
                {item.authorName} · קוד: {item.id}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: T.radiusSm,
              background: "transparent",
              color: T.text2,
              border: `1px solid ${T.border}`,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: T.fontBody,
            }}
          >
            ביטול
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            style={{
              padding: "10px 24px",
              borderRadius: T.radiusSm,
              background: confirming ? T.text3 : T.accent,
              color: "#fff",
              border: "none",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: confirming ? "not-allowed" : "pointer",
              fontFamily: T.fontBody,
            }}
          >
            {confirming
              ? "מעבד..."
              : `✓ אשר השאלת ${bookItems.length} ספר${bookItems.length > 1 ? "ים" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { responsive } = useResponsive();
  const inputRef = useRef(null);
  const codeRef = useRef(null);

  const [borrowerID, setBorrowerID] = useState("");
  const [borrower, setBorrower] = useState(null);
  const [borrowerError, setBorrowerError] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [bookItems, setBookItems] = useState([]);
  const [bookError, setBookError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [addingMore, setAddingMore] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const code = searchParams.get("copyCode") || searchParams.get("serialNum");
    if (code) setCurrentCode(code);
    // שחזר סשן אם קיים
    try {
      const saved = sessionStorage.getItem("checkout_borrower");
      if (saved) {
        const { data, exp } = JSON.parse(saved);
        if (exp > Date.now()) {
          setBorrower(data);
          setBorrowerID(data.borrowerID);
        } else {
          sessionStorage.removeItem("checkout_borrower");
        }
      }
    } catch {}
  }, []);

  // auto-login from URL borrowerID param
  useEffect(() => {
    const id = searchParams.get("borrowerID");
    if (id && !borrower) {
      setBorrowerID(id);
      fetch(`/api/borrower?borrowerID=${encodeURIComponent(id)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.borrower) setBorrower(data);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (borrower) inputRef.current?.focus();
  }, [borrower]);

  useEffect(() => {
    const code = searchParams.get("copyCode") || searchParams.get("serialNum");
    if (code && borrower) verifyBook(code);
  }, [borrower]);

  useEffect(() => {
    if (addingMore) codeRef.current?.focus();
  }, [addingMore]);

  async function verifyBorrower() {
    if (!borrowerID.trim()) return;
    setBorrowerError("");
    setBorrower(null);
    try {
      const res = await fetch(
        `/api/borrower?borrowerID=${encodeURIComponent(borrowerID.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setBorrowerError(data.error || "שואל לא נמצא");
        return;
      }
      if (data.borrower?.isBlocked === "TRUE") {
        setBorrowerError("שואל זה חסום במערכת");
        return;
      }
      const b = { ...data.borrower, activeLoans: data.activeLoans || [] };
      setBorrower(b);
      // שמור בסשן לדקה
      sessionStorage.setItem(
        "checkout_borrower",
        JSON.stringify({ data: b, exp: Date.now() + 60000 }),
      );
    } catch {
      setBorrowerError("שגיאה בחיפוש שואל");
    }
  }

  async function verifyBook(code) {
    const id = (code ?? currentCode).trim();
    if (!id) return;
    setBookError("");
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
      setCurrentCode("");
      setAddingMore(false);
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
      borrowerBox: {
        marginTop: 12,
        padding: "11px 14px",
        background: T.accentLt,
        borderRadius: T.radiusSm,
        border: "1px solid #bfdbfe",
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
      loanItem: {
        padding: "8px 12px",
        background: T.surface2,
        borderRadius: T.radiusSm,
        border: `1px solid ${T.border}`,
        fontSize: 13,
        marginBottom: 6,
      },
    }),
    [responsive],
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
                לא הושאלו:
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

  const hasBooks = bookItems.length > 0;

  return (
    <div style={s.page}>
      <div>
        <h1 style={s.title}>השאלת ספר</h1>
        <p style={s.subtitle}>מלא תעודת זהות, הזן קודי ספרים ואשר</p>
      </div>
      <StepBar borrower={borrower} hasBooks={hasBooks} />
      {hasBooks && (
        <button
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: T.radiusSm,
            background: T.green,
            color: "#fff",
            border: "none",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: T.fontBody,
            letterSpacing: "0.01em",
            boxShadow: `0 4px 14px rgba(34,197,94,0.4)`,
          }}
          onClick={handleConfirm}
        >
          ✓ בצע השאלה ({bookItems.length} ספר{bookItems.length > 1 ? "ים" : ""})
          ←
        </button>
      )}

      <div style={s.card}>
        {!borrower && (
          <>
            <label style={s.label}>מספר ת&quot;ז שואל</label>
            <div style={s.row}>
              <input
                style={s.input(false)}
                placeholder='הכנס מספר ת"ז...'
                maxLength={MAX_BORROWER_ID}
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
          </>
        )}
        {borrower && (
          <div style={s.borrowerBox}>
            <div style={{ fontWeight: 600 }}>
              {borrower.firstName} {borrower.lastName}
            </div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>
              ת&quot;ז: {borrower.borrowerID}
              {borrower.shiur && ` · שיעור ${borrower.shiur}`}
            </div>
            <div
              style={{ fontSize: 12, marginTop: 6, display: "flex", gap: 12 }}
            >
              <span
                style={{
                  color: borrower.activeLoans?.length > 0 ? T.red : T.green,
                  fontWeight: 600,
                }}
              >
                📚 {borrower.activeLoans?.length || 0} ספרים מושאלים
              </span>
              <span style={{ color: T.accent, fontWeight: 600 }}>
                ✓ יכול לשאול עוד{" "}
                {Math.max(0, 10 - (borrower.activeLoans?.length || 0))}
              </span>
            </div>
            {borrower.activeLoans?.length > 0 && (
              <ActiveLoansAccordion loans={borrower.activeLoans} />
            )}
          </div>
        )}
      </div>

      {borrower && !hasBooks && (
        <div style={s.card}>
          <label style={s.label}>קוד ספר</label>
          <div style={s.row}>
            <input
              ref={inputRef}
              style={s.input(false)}
              placeholder="הזן קוד ספר ולחץ Enter..."
              maxLength={MAX_COPY_CODE}
              value={currentCode}
              onChange={(e) => {
                setCurrentCode(e.target.value);
                setBookError("");
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
          {bookError && <div style={s.alertBox}>{bookError}</div>}
        </div>
      )}

      {hasBooks && (
        <div style={s.listCard}>
          <div style={s.listHeader}>
            <span style={s.listTitle}>ספרים להשאלה</span>
            <span style={s.listCount}>{bookItems.length}</span>
          </div>
          {bookError && (
            <div style={{ ...s.alertBox, margin: "10px 18px 0" }}>
              {bookError}
            </div>
          )}
          <div style={s.listBody}>
            {bookItems.map((item) => (
              <div key={item.id} style={s.listItem}>
                <div>
                  <div style={s.listName}>{item.bookName}</div>
                  <div style={s.listAuthor}>
                    {item.authorName} · {item.id}
                  </div>
                </div>
                <button
                  style={s.listRemove}
                  onClick={() => {
                    setBookItems((prev) =>
                      prev.filter((i) => i.id !== item.id),
                    );
                    setBookError("");
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasBooks && (
        <div style={s.actionsCard}>
          {addingMore ? (
            <>
              <label style={s.label}>קוד ספר נוסף</label>
              <div style={s.row}>
                <input
                  ref={codeRef}
                  style={s.input(false)}
                  placeholder="הזן קוד ספר נוסף ולחץ Enter..."
                  maxLength={MAX_COPY_CODE}
                  value={currentCode}
                  onChange={(e) => {
                    setCurrentCode(e.target.value);
                    setBookError("");
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
                    setBookError("");
                  }}
                >
                  ביטול
                </button>
              </div>
              {bookError && <div style={s.alertBox}>{bookError}</div>}
            </>
          ) : (
            <>
              <button
                style={s.btnOutline(T.accent)}
                onClick={() => {
                  setAddingMore(true);
                  setBookError("");
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

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
