"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import useResponsive from "@/hooks/useResponsive";
import { T } from "@/lib/theme";
import { CATEGORIES } from "@/lib/constants/categories";

const TABS = [
  { id: "books", label: "כל הספרים" },
  { id: "loans", label: "השאלות פעילות" },
  { id: "borrowers", label: "שואלים" },
];
const PAGE_SIZE = 100;
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

// ── Copy Button ──────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        padding: "8px 10px",
        borderRadius: T.radiusSm,
        background: copied ? T.greenLt : T.surface2,
        color: copied ? T.green : T.text3,
        border: `1px solid ${copied ? T.greenBorder : T.border}`,
        fontSize: 12,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: T.fontBody,
        transition: "all 0.2s",
      }}
    >
      {copied ? "✓ הועתק" : "העתק"}
    </button>
  );
}

// ── Book Modal ─────────────────────────────────────────────
function BookModal({ book, onClose, onSave, onSaveAndAdd }) {
  const isEdit = !!book && !book._isDuplicate;
  const [form, setForm] = useState(
    book || {
      tempCopyCode: "",
      bookName: "",
      authorName: "",
      authorRole: "",
      description: "",
      notes: "",
      category: "",
      room: "",
      area: "",
      tags: "",
      loan_policy: "",
    },
  );
  const originalCode = book?._isDuplicate ? "" : book?.tempCopyCode || "";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [catQuery, setCatQuery] = useState(form.category || "");
  const [catOpen, setCatOpen] = useState(false);

  const tags = form.tags
    ? form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const AREAS_LIBRARY_NAMED = [
    "ספרייה עגולה",
    "ספריית הוראה",
    "ספרייה מלבנית",
    "ספריית ילדים",
    "ספריית אנגלית",
    "משולש כניסה - ספריית תפילה על שם יהלומי",
  ];
  const AREAS_BM_MODAL = [
    "משולש ימין קדמי",
    "משולש ימין אחורי",
    "משולש שמאל קדמי",
    "משולש שמאל אחורי",
    "משולש כניסה",
    "משולש כניסה - ספריית תפילה על שם יהלומי",
  ];

  const normalizedQuery =
    catQuery.length >= 2 && catQuery[1] === " "
      ? catQuery[0] + "-" + catQuery.slice(2)
      : catQuery;
  const filteredCats = normalizedQuery.trim()
    ? CATEGORIES.filter(
        (c) =>
          c.code.toLowerCase().startsWith(normalizedQuery.toLowerCase()) ||
          c.desc.toLowerCase().includes(normalizedQuery.toLowerCase()),
      ).slice(0, 30)
    : [];
  const displayCats =
    normalizedQuery.trim().length === 1
      ? CATEGORIES.filter((c) =>
          c.code.toLowerCase().startsWith(normalizedQuery.toLowerCase()),
        ).slice(0, 30)
      : filteredCats;

  function handleRoomChange(room) {
    setForm((f) => ({ ...f, room, area: "" }));
  }
  function handleCategorySelect(cat) {
    setForm((f) => ({
      ...f,
      category: cat.code,
      area: f.room === "ספרייה" ? cat.code : f.area,
    }));
    setCatQuery(cat.code);
    setCatOpen(false);
  }
  function addTag(e) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim();
      if (!tags.includes(t))
        setForm((f) => ({ ...f, tags: [...tags, t].join(",") }));
      setTagInput("");
    }
  }
  function removeTag(tag) {
    setForm((f) => ({ ...f, tags: tags.filter((t) => t !== tag).join(",") }));
  }

  async function handleSave(saveAndAdd = false) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/books", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, _originalCode: originalCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      if (saveAndAdd === "duplicate" && onSaveAndAdd)
        onSaveAndAdd(form.tempCopyCode, { ...form, tempCopyCode: "" });
      else if (saveAndAdd && onSaveAndAdd) onSaveAndAdd(form.tempCopyCode);
      else onSave(form.tempCopyCode);
    } catch {
      setError("שגיאת שרת");
    } finally {
      setSaving(false);
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
      maxWidth: 580,
      width: "90%",
      boxShadow: T.shadowLg,
      maxHeight: "90vh",
      overflow: "auto",
    },
    title: {
      fontFamily: T.fontDisplay,
      fontWeight: 700,
      fontSize: 17,
      marginBottom: 20,
      color: T.text,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 16,
    },
    field: { display: "flex", flexDirection: "column", gap: 4 },
    label: { fontSize: 12, fontWeight: 600, color: T.text2 },
    input: (disabled) => ({
      padding: "8px 12px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      fontSize: 13.5,
      outline: "none",
      fontFamily: T.fontBody,
      background: disabled ? T.surface2 : T.surface,
      opacity: disabled ? 0.6 : 1,
    }),
    select: (disabled) => ({
      padding: "8px 12px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      fontSize: 13.5,
      fontFamily: T.fontBody,
      background: disabled ? T.surface2 : T.surface,
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
    }),
    textarea: {
      padding: "8px 12px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      fontSize: 13,
      fontFamily: T.fontBody,
      resize: "vertical",
      minHeight: 60,
    },
    actions: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      marginTop: 8,
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
      padding: "9px 20px",
      borderRadius: T.radiusSm,
      background: "transparent",
      color: T.text2,
      border: `1px solid ${T.border}`,
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
    },
    alert: {
      padding: "10px 14px",
      borderRadius: T.radiusSm,
      background: T.redLt,
      color: T.red,
      border: `1px solid ${T.redBorder}`,
      fontSize: 13,
      marginBottom: 12,
    },
    catWrap: { position: "relative" },
    catDrop: {
      position: "absolute",
      top: "100%",
      right: 0,
      left: 0,
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: T.radiusSm,
      boxShadow: T.shadowMd,
      zIndex: 100,
      maxHeight: 200,
      overflowY: "auto",
    },
    catItem: {
      padding: "7px 12px",
      fontSize: 13,
      cursor: "pointer",
      borderBottom: `1px solid ${T.borderSoft}`,
    },
    tagWrap: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      padding: "6px 8px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      minHeight: 38,
      alignItems: "center",
    },
    tag: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      background: T.accentLt,
      color: T.accent,
      borderRadius: 999,
      padding: "3px 10px",
      fontSize: 12.5,
      fontWeight: 600,
    },
    tagX: {
      background: "none",
      border: "none",
      color: T.accent,
      cursor: "pointer",
      fontSize: 14,
      lineHeight: 1,
      padding: 0,
    },
    tagInput: {
      border: "none",
      outline: "none",
      fontSize: 13,
      fontFamily: T.fontBody,
      background: "transparent",
      minWidth: 80,
      flex: 1,
    },
  };

  const F = (key, label, full, textarea) => (
    <div style={full ? { ...s.field, gridColumn: "1 / -1" } : s.field}>
      <label style={s.label}>{label}</label>
      {textarea ? (
        <textarea
          style={s.textarea}
          value={form[key] || ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <input
          style={s.input(false)}
          value={form[key] || ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          onFocus={(e) => (e.target.style.borderColor = T.accent)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
        />
      )}
    </div>
  );

  const areaOptions =
    form.room === "ספרייה"
      ? [...AREAS_LIBRARY_NAMED, ...(form.category ? [form.category] : [])]
      : form.room === "בית מדרש"
        ? AREAS_BM_MODAL
        : [];

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={(e) => e.stopPropagation()}>
        <div style={s.title}>{isEdit ? "עריכת ספר" : "הוספת ספר"}</div>
        {error && <div style={s.alert}>{error}</div>}
        <div style={s.grid}>
          {F("tempCopyCode", "קוד ספר *")}
          {F("bookName", "שם הספר *")}
          {F("authorName", "מחבר")}
          <div style={s.field}>
            <label style={s.label}>תפקיד</label>
            <select
              style={s.select(false)}
              value={form.authorRole || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, authorRole: e.target.value }))
              }
            >
              <option value="">בחר...</option>
              <option value="מחבר">מחבר</option>
              <option value="עורך">עורך</option>
              <option value="מכון">מכון</option>
              <option value="הוצאה">הוצאה</option>
            </select>
          </div>
          <div style={{ ...s.field, gridColumn: "1 / -1" }}>
            <label style={s.label}>קטגוריה</label>
            <div style={s.catWrap}>
              <input
                style={s.input(false)}
                placeholder="חפש קטגוריה (למשל א-01)..."
                value={catQuery}
                onChange={(e) => {
                  setCatQuery(e.target.value);
                  setCatOpen(true);
                  setForm((f) => ({ ...f, category: e.target.value }));
                }}
                onFocus={() => setCatOpen(true)}
                onBlur={() => setTimeout(() => setCatOpen(false), 150)}
              />
              {catOpen && displayCats.length > 0 && (
                <div style={s.catDrop}>
                  {displayCats.map((c) => (
                    <div
                      key={c.code}
                      style={s.catItem}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = T.surface2)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "")
                      }
                      onMouseDown={() => handleCategorySelect(c)}
                    >
                      <span style={{ fontWeight: 600 }}>{c.code}</span>
                      {c.desc && (
                        <span
                          style={{
                            color: T.text3,
                            fontSize: 12,
                            marginRight: 6,
                          }}
                        >
                          {c.desc}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>חדר</label>
            <select
              style={s.select(false)}
              value={form.room || ""}
              onChange={(e) => handleRoomChange(e.target.value)}
            >
              <option value="">בחר חדר...</option>
              <option value="ספרייה">ספרייה</option>
              <option value="בית מדרש">בית מדרש</option>
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>אזור</label>
            <select
              style={s.select(!form.room)}
              disabled={!form.room}
              value={form.area || ""}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            >
              <option value="">בחר אזור...</option>
              {areaOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>מדיניות השאלה</label>
            <select
              style={s.select(false)}
              value={form.loan_policy || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, loan_policy: e.target.value }))
              }
            >
              <option value="">רגיל</option>
              <option value="לעיון במקום בלבד">לעיון במקום בלבד</option>
              <option value="השאלה לטווח קצר">השאלה לטווח קצר</option>
            </select>
          </div>
          <div style={{ ...s.field, gridColumn: "1 / -1" }}>
            <label style={s.label}>תגיות — הקלד ולחץ Enter</label>
            <div
              style={s.tagWrap}
              onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
            >
              {tags.map((tag) => (
                <span key={tag} style={s.tag}>
                  {tag}
                  <button style={s.tagX} onClick={() => removeTag(tag)}>
                    ×
                  </button>
                </span>
              ))}
              <input
                style={s.tagInput}
                placeholder={tags.length === 0 ? "הוסף תגית..." : ""}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            </div>
          </div>
          {F("description", "תיאור", true, true)}
          {F("notes", "הערות", true, true)}
        </div>
        <div style={s.actions}>
          <button style={s.btnGhost} onClick={onClose}>
            ביטול
          </button>
          {!isEdit && (
            <button
              style={s.btn(T.green)}
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? "שומר..." : "שמור והוסף נוסף"}
            </button>
          )}
          {!isEdit && (
            <button
              style={s.btn("#7c3aed")}
              onClick={() => handleSave("duplicate")}
              disabled={saving}
            >
              {saving ? "שומר..." : "שמור ושכפל"}
            </button>
          )}
          <button
            style={s.btn(T.accent)}
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? "שומר..." : "שמור"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Policy Modal ──────────────────────────────────────
function BulkPolicyModal({ count, onClose, onSave }) {
  const [policy, setPolicy] = useState("");
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
      marginBottom: 16,
      color: T.text,
    },
    select: {
      width: "100%",
      padding: "9px 12px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      fontSize: 13.5,
      fontFamily: T.fontBody,
      background: T.surface,
      marginBottom: 16,
    },
    actions: { display: "flex", gap: 10, justifyContent: "flex-end" },
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
      padding: "9px 20px",
      borderRadius: T.radiusSm,
      background: "transparent",
      color: T.text2,
      border: `1px solid ${T.border}`,
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
    },
  };
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={(e) => e.stopPropagation()}>
        <div style={s.title}>שינוי מדיניות ל-{count} ספרים</div>
        <select
          style={s.select}
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
        >
          <option value="">רגיל</option>
          <option value="לעיון במקום בלבד">לעיון במקום בלבד</option>
          <option value="השאלה לטווח קצר">השאלה לטווח קצר</option>
        </select>
        <div style={s.actions}>
          <button style={s.btnGhost} onClick={onClose}>
            ביטול
          </button>
          <button style={s.btn(T.accent)} onClick={() => onSave(policy)}>
            החל
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Borrower Modal ─────────────────────────────────────────
function BorrowerModal({ borrower, onClose, onSave }) {
  const [form, setForm] = useState(
    borrower || {
      borrowerID: "",
      firstName: "",
      lastName: "",
      type: "תלמיד",
      year: "",
      phone: "",
      email: "",
      isBlocked: "FALSE",
      comments: "",
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!borrower;

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/borrowers", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      onSave();
    } catch {
      setError("שגיאת שרת");
    } finally {
      setSaving(false);
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
      maxWidth: 480,
      width: "90%",
      boxShadow: T.shadowLg,
      maxHeight: "90vh",
      overflow: "auto",
    },
    title: {
      fontFamily: T.fontDisplay,
      fontWeight: 700,
      fontSize: 17,
      marginBottom: 20,
      color: T.text,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 16,
    },
    field: { display: "flex", flexDirection: "column", gap: 4 },
    label: { fontSize: 12, fontWeight: 600, color: T.text2 },
    input: {
      padding: "8px 12px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      fontSize: 13.5,
      outline: "none",
      fontFamily: T.fontBody,
    },
    select: {
      padding: "8px 12px",
      border: `1.5px solid ${T.border}`,
      borderRadius: T.radiusSm,
      fontSize: 13.5,
      fontFamily: T.fontBody,
      background: T.surface,
    },
    actions: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      marginTop: 8,
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
      padding: "9px 20px",
      borderRadius: T.radiusSm,
      background: "transparent",
      color: T.text2,
      border: `1px solid ${T.border}`,
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
    },
    alert: {
      padding: "10px 14px",
      borderRadius: T.radiusSm,
      background: T.redLt,
      color: T.red,
      border: `1px solid ${T.redBorder}`,
      fontSize: 13,
      marginBottom: 12,
    },
  };

  const F = (key, label, full) => (
    <div style={full ? { ...s.field, gridColumn: "1 / -1" } : s.field}>
      <label style={s.label}>{label}</label>
      <input
        style={s.input}
        value={form[key] || ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        onFocus={(e) => (e.target.style.borderColor = T.accent)}
        onBlur={(e) => (e.target.style.borderColor = T.border)}
      />
    </div>
  );

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={(e) => e.stopPropagation()}>
        <div style={s.title}>{isEdit ? "עריכת שואל" : "הוספת שואל"}</div>
        {error && <div style={s.alert}>{error}</div>}
        <div style={s.grid}>
          {F("borrowerID", 'מספר ת"ז *')}
          {F("firstName", "שם פרטי *")}
          {F("lastName", "שם משפחה *")}
          <div style={s.field}>
            <label style={s.label}>סוג</label>
            <select
              style={s.select}
              value={form.type || "תלמיד"}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="תלמיד">תלמיד</option>
              <option value="מבקשי פניך">מבקשי פניך</option>
              <option value="בני מנשה">בני מנשה</option>
              <option value="צוות">צוות</option>
              <option value="אורח">אורח</option>
            </select>
          </div>
          {F("year", "מחזור (תלמידים בלבד)")}
          {F("phone", "טלפון")}
          {F("email", "אימייל")}
          <div style={s.field}>
            <label style={s.label}>חסום</label>
            <select
              style={s.select}
              value={form.isBlocked || "FALSE"}
              onChange={(e) =>
                setForm((f) => ({ ...f, isBlocked: e.target.value }))
              }
            >
              <option value="FALSE">לא</option>
              <option value="TRUE">כן</option>
            </select>
          </div>
          {F("comments", "הערות", true)}
        </div>
        <div style={s.actions}>
          <button style={s.btnGhost} onClick={onClose}>
            ביטול
          </button>
          <button
            style={s.btn(T.accent)}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "שומר..." : "שמור"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────
function ConfirmDialog({ message, warning, onConfirm, onCancel, danger }) {
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
    msg: { fontSize: 15, color: T.text, marginBottom: warning ? 10 : 20 },
    warning: {
      fontSize: 13,
      color: T.red,
      background: T.redLt,
      border: `1px solid ${T.redBorder}`,
      borderRadius: T.radiusSm,
      padding: "8px 12px",
      marginBottom: 20,
    },
    actions: { display: "flex", gap: 10, justifyContent: "flex-end" },
    btnDanger: {
      padding: "9px 20px",
      borderRadius: T.radiusSm,
      background: danger ? T.red : T.accent,
      color: "#fff",
      border: "none",
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
    },
    btnGhost: {
      padding: "9px 20px",
      borderRadius: T.radiusSm,
      background: "transparent",
      color: T.text2,
      border: `1px solid ${T.border}`,
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
    },
  };
  return (
    <div style={s.overlay}>
      <div style={s.box}>
        <div style={s.msg}>{message}</div>
        {warning && <div style={s.warning}>⚠️ {warning}</div>}
        <div style={s.actions}>
          <button style={s.btnGhost} onClick={onCancel}>
            ביטול
          </button>
          <button style={s.btnDanger} onClick={onConfirm}>
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Book Row ───────────────────────────────────────────────
function BookRow({
  r,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  onDuplicate,
  s,
  td,
  selectionMode,
  selected,
  onSelect,
  autoOpen,
  onOpened,
}) {
  const [open, setOpen] = useState(false);
  const [fullBook, setFullBook] = useState(null);

  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
      onOpened?.();
      setTimeout(() => {
        document
          .getElementById(`book-row-${r.tempCopyCode}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (open && r.isBorrowed && !fullBook) {
      fetch(`/api/books/${encodeURIComponent(r.tempCopyCode)}`)
        .then((res) => res.json())
        .then(setFullBook)
        .catch(() => {});
    }
  }, [open, r.isBorrowed, r.tempCopyCode]);

  const borrowed = r.isBorrowed;
  const inactive = r.isActive === "FALSE";
  const location = [r.room, r.area].filter(Boolean).join(", ");

  return (
    <>
      <tr
        id={`book-row-${r.tempCopyCode}`}
        style={{
          background: selected
            ? T.accentLt
            : open
              ? T.surface
              : inactive
                ? "#fafafa"
                : "",
          cursor: "pointer",
          opacity: inactive ? 0.65 : 1,
        }}
        onClick={() =>
          selectionMode ? onSelect(r.tempCopyCode) : setOpen((o) => !o)
        }
        onMouseEnter={(e) => {
          if (!open && !selected) e.currentTarget.style.background = "#f5f7ff";
        }}
        onMouseLeave={(e) => {
          if (!open && !selected)
            e.currentTarget.style.background = inactive ? "#fafafa" : "";
        }}
      >
        {selectionMode && (
          <td
            style={td({ width: 36, paddingRight: 12 })}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(r.tempCopyCode);
            }}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(r.tempCopyCode)}
              style={{ cursor: "pointer", width: 15, height: 15 }}
            />
          </td>
        )}
        {!selectionMode && (
          <td
            style={td({
              width: 20,
              paddingRight: 8,
              paddingLeft: 0,
              color: T.text3,
              fontSize: 11,
              borderTop: open ? `2px solid ${T.border}` : "none",
            })}
          >
            {open ? "⌃" : "⌄"}
          </td>
        )}
        {!selectionMode && (
          <td
            style={td({
              fontFamily: "monospace",
              fontSize: 11,
              color: T.text3,
              borderTop: open ? `2px solid ${T.border}` : "none",
              whiteSpace: "nowrap",
            })}
          >
            {r.serialNum || "—"}
          </td>
        )}
        <td
          style={td({
            fontFamily: "monospace",
            fontSize: 12,
            color: T.text3,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {r.tempCopyCode}
        </td>
        <td
          style={td({
            fontWeight: 600,
            maxWidth: 200,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.bookName || "—"}
          </div>
        </td>
        <td
          style={td({
            color: T.text2,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {r.authorName || "—"}
        </td>
        <td
          style={td({
            color: T.text3,
            fontSize: 12,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {location || "—"}
        </td>
        <td
          style={td({
            color: T.text3,
            fontSize: 12,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {r.loan_policy || "רגיל"}
        </td>
        <td style={td({ borderTop: open ? `2px solid ${T.border}` : "none" })}>
          {inactive ? (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 600,
                background: "#f3f4f6",
                color: T.text3,
              }}
            >
              לא פעיל
            </span>
          ) : (
            <span
              style={{
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
          )}
        </td>
        {!selectionMode && (
          <td
            style={td({
              textAlign: "left",
              borderTop: open ? `2px solid ${T.border}` : "none",
            })}
            onClick={(e) => e.stopPropagation()}
          >
            <button style={s.btnSmall(T.accent)} onClick={() => onEdit(r)}>
              ערוך
            </button>
          </td>
        )}
      </tr>

      {open && !selectionMode && (
        <tr>
          <td
            colSpan={8}
            style={{ padding: 0, borderBottom: `2px solid ${T.border}` }}
          >
            <div
              style={{ padding: "14px 20px", background: T.surface }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {r.description && (
                  <div style={{ gridColumn: "1/-1" }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: T.text3,
                        textTransform: "uppercase",
                        marginBottom: 3,
                      }}
                    >
                      תיאור
                    </div>
                    <div style={{ fontSize: 13, color: T.text2 }}>
                      {r.description}
                    </div>
                  </div>
                )}
                {r.notes && (
                  <div style={{ gridColumn: "1/-1" }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: T.text3,
                        textTransform: "uppercase",
                        marginBottom: 3,
                      }}
                    >
                      הערות
                    </div>
                    <div style={{ fontSize: 13, color: T.text2 }}>
                      {r.notes}
                    </div>
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: T.text3,
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    קטגוריה
                  </div>
                  <div style={{ fontSize: 13 }}>{r.category || "—"}</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: T.text3,
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    תגיות
                  </div>
                  <div style={{ fontSize: 13 }}>{r.tags || "—"}</div>
                </div>
              </div>
              {borrowed && fullBook?.activeLoan?.borrower && (
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: T.text3,
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    מושאל אצל
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                    {fullBook.activeLoan.borrower.firstName}{" "}
                    {fullBook.activeLoan.borrower.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>
                    ת"ז: {fullBook.activeLoan.borrower.borrowerID}
                    {fullBook.activeLoan.borrower.phone && (
                      <span style={{ marginRight: 10 }}>
                        📞 {fullBook.activeLoan.borrower.phone}
                      </span>
                    )}
                  </div>
                  {fullBook.activeLoan.loanDate && (
                    <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>
                      הושאל: {fullBook.activeLoan.loanDate}
                      {fullBook.activeLoan.dueDate &&
                        ` · להחזיר עד: ${fullBook.activeLoan.dueDate}`}
                    </div>
                  )}
                </div>
              )}
              {borrowed && !fullBook && (
                <div style={{ fontSize: 12, color: T.text3, marginBottom: 10 }}>
                  טוען פרטי שואל...
                </div>
              )}
              <div
                style={{
                  height: 1,
                  background: T.borderSoft,
                  margin: "0 0 12px",
                }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={s.btnSmall(T.accent)} onClick={() => onEdit(r)}>
                  ✏️ ערוך
                </button>
                <button
                  style={s.btnSmall(T.accent)}
                  onClick={() => onDuplicate(r)}
                >
                  ⧉ שכפל
                </button>
                {!inactive && (
                  <button
                    style={s.btnSmall(T.yellow)}
                    onClick={() => onDeactivate(r)}
                  >
                    🔒 סמן כלא פעיל
                  </button>
                )}
                {inactive && (
                  <button
                    style={s.btnSmall(T.green)}
                    onClick={() => onActivate(r)}
                  >
                    ✓ הפעל מחדש
                  </button>
                )}
                {inactive && (
                  <button style={s.btnSmall(T.red)} onClick={() => onDelete(r)}>
                    🗑️ מחק לצמיתות
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Borrower Row ───────────────────────────────────────────
function BorrowerRow({ r, s, td, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(null);

  useEffect(() => {
    if (open && !full) {
      fetch(`/api/borrowers/${encodeURIComponent(r.borrowerID)}`)
        .then((res) => res.json())
        .then(setFull)
        .catch(() => {});
    }
  }, [open, r.borrowerID]);

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: T.text3,
    textTransform: "uppercase",
    marginBottom: 3,
  };
  const valueStyle = { fontSize: 13, color: T.text };

  return (
    <>
      <tr
        style={{ cursor: "pointer", background: open ? T.surface : "" }}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "#f5f7ff";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "";
        }}
      >
        <td
          style={td({
            width: 20,
            paddingRight: 8,
            paddingLeft: 0,
            color: T.text3,
            fontSize: 11,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {open ? "⌃" : "⌄"}
        </td>
        <td
          style={td({
            fontFamily: "monospace",
            fontSize: 12,
            color: T.text3,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {r.borrowerID}
        </td>
        <td style={td({ borderTop: open ? `2px solid ${T.border}` : "none" })}>
          {r.firstName || "—"}
        </td>
        <td
          style={td({
            fontWeight: 500,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {r.lastName || "—"}
        </td>
        <td
          style={td({
            color: T.text3,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {r.shiur || "—"}
        </td>
        <td
          style={td({
            color: T.text3,
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {r.phone || "—"}
        </td>
        <td style={td({ borderTop: open ? `2px solid ${T.border}` : "none" })}>
          {r.isBlocked === "TRUE" && (
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
              חסום
            </span>
          )}
        </td>
        <td
          style={td({
            textAlign: "center",
            borderTop: open ? `2px solid ${T.border}` : "none",
          })}
        >
          {r.activeLoansCount > 0 ? (
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
              {r.activeLoansCount}
            </span>
          ) : (
            <span style={{ color: T.text3 }}>0</span>
          )}
        </td>
        <td
          style={td({ borderTop: open ? `2px solid ${T.border}` : "none" })}
          onClick={(e) => e.stopPropagation()}
        >
          <button style={s.btnSmall(T.accent)} onClick={() => onEdit(r)}>
            ערוך
          </button>
          <button style={s.btnSmall(T.red)} onClick={() => onDelete(r)}>
            מחק
          </button>
        </td>
      </tr>

      {open && (
        <tr>
          <td
            colSpan={9}
            style={{ padding: 0, borderBottom: `2px solid ${T.border}` }}
          >
            <div
              style={{ padding: "16px 20px", background: T.surface }}
              onClick={(e) => e.stopPropagation()}
            >
              {!full ? (
                <div style={{ fontSize: 13, color: T.text3 }}>טוען...</div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px,1fr))",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div style={labelStyle}>שם מלא</div>
                      <div style={valueStyle}>
                        {full.firstName} {full.lastName}
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>ת"ז</div>
                      <div style={valueStyle}>{full.borrowerID}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>סוג</div>
                      <div style={valueStyle}>{full.type || "—"}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>שיעור</div>
                      <div style={valueStyle}>{full.shiur || "—"}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>מחזור</div>
                      <div style={valueStyle}>{full.year || "—"}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>טלפון</div>
                      <div style={valueStyle}>{full.phone || "—"}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>אימייל</div>
                      <div style={valueStyle}>{full.email || "—"}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>סטטוס</div>
                      <div style={{ fontSize: 13 }}>
                        {full.isBlocked === "TRUE" ? (
                          <span style={{ color: T.red, fontWeight: 600 }}>
                            חסום
                          </span>
                        ) : (
                          <span style={{ color: T.green }}>פעיל</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>סה"כ השאלות</div>
                      <div style={valueStyle}>{full.totalLoans || 0}</div>
                    </div>
                    {full.comments && (
                      <div style={{ gridColumn: "1/-1" }}>
                        <div style={labelStyle}>הערות</div>
                        <div style={valueStyle}>{full.comments}</div>
                      </div>
                    )}
                  </div>

                  {full.activeLoans?.length > 0 && (
                    <>
                      <div
                        style={{
                          height: 1,
                          background: T.borderSoft,
                          margin: "0 0 12px",
                        }}
                      />
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: T.text3,
                          textTransform: "uppercase",
                          marginBottom: 8,
                        }}
                      >
                        ספרים מושאלים כרגע ({full.activeLoans.length})
                      </div>
                      {full.activeLoans.map((l) => (
                        <div
                          key={l.loanID}
                          style={{
                            padding: "7px 12px",
                            background: T.surface2,
                            borderRadius: T.radiusSm,
                            border: `1px solid ${T.border}`,
                            fontSize: 13,
                            marginBottom: 6,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {l.bookName || l.bookID}
                          </span>
                          <span style={{ color: T.text3, fontSize: 12 }}>
                            {l.loanDate}
                            {l.dueDate && ` · עד ${l.dueDate}`}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
              <div
                style={{
                  height: 1,
                  background: T.borderSoft,
                  margin: "12px 0",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button style={s.btnSmall(T.accent)} onClick={() => onEdit(r)}>
                  ✏️ ערוך
                </button>
                <button style={s.btnSmall(T.red)} onClick={() => onDelete(r)}>
                  🗑️ מחק
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Bulk Action Bar ────────────────────────────────────────
function BulkBar({ selected, rows, onClose, onAction, processing }) {
  const selectedRows = rows.filter((r) => selected.has(r.tempCopyCode));
  const allInactive = selectedRows.every((r) => r.isActive === "FALSE");
  const anyActive = selectedRows.some((r) => r.isActive !== "FALSE");
  const count = selected.size;
  const canDelete = allInactive && count > 0;

  const s = {
    bar: {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1e293b",
      borderRadius: T.radius,
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      zIndex: 500,
      whiteSpace: "nowrap",
    },
    count: { color: "#fff", fontSize: 13.5, fontWeight: 600, marginLeft: 4 },
    divider: { width: 1, height: 20, background: "#334155" },
    btn: (color, disabled) => ({
      padding: "7px 14px",
      borderRadius: T.radiusSm,
      background: disabled ? "#334155" : color,
      color: disabled ? "#64748b" : "#fff",
      border: "none",
      fontSize: 13,
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: T.fontBody,
    }),
    btnGhost: {
      padding: "7px 14px",
      borderRadius: T.radiusSm,
      background: "transparent",
      color: "#94a3b8",
      border: "1px solid #334155",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: T.fontBody,
    },
    tooltip: { fontSize: 11, color: "#94a3b8", marginRight: 4 },
  };

  return (
    <div style={s.bar}>
      <span style={s.count}>{count} נבחרו</span>
      <div style={s.divider} />
      {anyActive && (
        <button
          style={s.btn("#f59e0b")}
          disabled={processing}
          onClick={() => onAction("deactivate")}
        >
          🔒 סמן כלא פעיל
        </button>
      )}
      {!anyActive && (
        <button
          style={s.btn(T.green)}
          disabled={processing}
          onClick={() => onAction("activate")}
        >
          ✓ הפעל מחדש
        </button>
      )}
      <button
        style={s.btn(T.accent)}
        disabled={processing}
        onClick={() => onAction("policy")}
      >
        📋 שנה מדיניות
      </button>
      <div style={s.divider} />
      {!canDelete ? (
        <span style={s.tooltip}>מחיקה זמינה רק לספרים לא פעילים</span>
      ) : (
        <button
          style={s.btn(T.red)}
          disabled={processing}
          onClick={() => onAction("delete")}
        >
          🗑️ מחק
        </button>
      )}
      <div style={s.divider} />
      <button style={s.btnGhost} onClick={onClose}>
        ביטול
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const { responsive } = useResponsive();
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("books");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPolicy, setFilterPolicy] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterArea, setFilterArea] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [bookModal, setBookModal] = useState(null);
  const [openBookCode, setOpenBookCode] = useState(null);
  const [borrowerModal, setBorrowerModal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [policyModal, setPolicyModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [processing, setProcessing] = useState(false);

  async function handleBackup() {
    setBackingUp(true);
    setBackupMsg("");
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      setBackupMsg(
        res.ok
          ? `✓ גובה בהצלחה (${data.files?.length} קבצים)`
          : `שגיאה: ${data.error}`,
      );
      setTimeout(() => setBackupMsg(""), 4000);
    } catch {
      setBackupMsg("שגיאת שרת");
    } finally {
      setBackingUp(false);
    }
  }

  const refreshStats = () =>
    fetch("/api/admin?view=stats")
      .then((r) => r.json())
      .then(setStats);
  useEffect(() => {
    refreshStats();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      view: tab,
      page,
      limit: PAGE_SIZE,
      ...(search && { q: search }),
      ...(sortBy && { sortBy, sortDir }),
      ...(tab === "books" &&
        filterStatus !== "all" && { status: filterStatus }),
      ...(tab === "books" &&
        filterPolicy !== "all" && { policy: filterPolicy }),
      ...(tab === "books" && filterRoom !== "all" && { room: filterRoom }),
      ...(tab === "books" && filterArea !== "all" && { area: filterArea }),
      ...(tab === "borrowers" && filterType !== "all" && { type: filterType }),
    });
    try {
      const res = await fetch(`/api/admin?${params}`);
      const data = await res.json();
      setRows(data.loans || data.books || data.borrowers || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [
    tab,
    page,
    search,
    sortBy,
    sortDir,
    filterStatus,
    filterPolicy,
    filterRoom,
    filterArea,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    setPage(1);
    setSortBy("");
    setSortDir("asc");
    setFilterStatus("all");
    setFilterPolicy("all");
    setFilterRoom("all");
    setFilterArea("all");
    setSelectionMode(false);
    setSelected(new Set());
  }, [tab]);
  useEffect(() => {
    setPage(1);
  }, [search]);

  function handleSort(col) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.tempCopyCode)));
  }
  function exitSelectionMode() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  async function executeBulk(action, extra) {
    setProcessing(true);
    try {
      await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: true,
          action,
          ids: [...selected],
          ...(extra || {}),
        }),
      });
      exitSelectionMode();
      refreshStats();
      loadData();
    } finally {
      setProcessing(false);
    }
  }

  function handleBulkAction(action) {
    if (action === "policy") {
      setPolicyModal(true);
      return;
    }
    if (action === "delete") {
      setConfirmDialog({
        message: `מחיקת ${selected.size} ספרים`,
        warning: "פעולה זו היא בלתי הפיכה! כל הספרים הנבחרים יימחקו לצמיתות.",
        danger: true,
        onConfirm: () => {
          setConfirmDialog(null);
          executeBulk("delete");
        },
      });
      return;
    }
    if (action === "deactivate") {
      setConfirmDialog({
        message: `סמן ${selected.size} ספרים כלא פעילים?`,
        danger: false,
        onConfirm: () => {
          setConfirmDialog(null);
          executeBulk("deactivate");
        },
      });
      return;
    }
    executeBulk(action);
  }

  async function handleDeactivateBook(book) {
    setConfirmDialog({
      message: `סמן את "${book.bookName}" כלא פעיל?`,
      danger: false,
      onConfirm: async () => {
        await fetch("/api/admin/books", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tempCopyCode: book.tempCopyCode,
            action: "deactivate",
          }),
        });
        setConfirmDialog(null);
        loadData();
      },
    });
  }

  async function handleActivateBook(book) {
    await fetch("/api/admin/books", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tempCopyCode: book.tempCopyCode,
        action: "activate",
      }),
    });
    loadData();
  }

  async function handleDeleteBook(book) {
    setConfirmDialog({
      message: `מחיקת "${book.bookName}"`,
      warning: "פעולה זו היא בלתי הפיכה!",
      danger: true,
      onConfirm: async () => {
        const res = await fetch("/api/admin/books", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempCopyCode: book.tempCopyCode }),
        });
        const data = await res.json();
        if (!res.ok) {
          setConfirmDialog(null);
          alert(data.error);
          return;
        }
        setConfirmDialog(null);
        refreshStats();
        loadData();
      },
    });
  }

  async function handleDeleteBorrower(borrowerID) {
    await fetch("/api/admin/borrowers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowerID }),
    });
    setConfirmDialog(null);
    refreshStats();
    loadData();
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const s = useMemo(
    () => ({
      page: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily: T.fontBody,
      },
      header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
      statsGrid: {
        display: "grid",
        gridTemplateColumns: responsive(
          "repeat(5,1fr)",
          "repeat(3,1fr)",
          "repeat(2,1fr)",
        ),
        gap: responsive(12, 10, 8),
      },
      statCard: {
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: "16px 18px",
        boxShadow: T.shadowSm,
      },
      statValue: {
        fontFamily: T.fontDisplay,
        fontSize: 24,
        fontWeight: 700,
        color: T.text,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        marginBottom: 5,
      },
      statLabel: { fontSize: 12, color: T.text3, fontWeight: 500 },
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
      toolbar: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      },
      input: {
        maxWidth: 240,
        padding: "8px 14px",
        border: `1.5px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontSize: 13.5,
        background: T.surface,
        color: T.text,
        outline: "none",
        fontFamily: T.fontBody,
      },
      select: {
        padding: "8px 12px",
        border: `1.5px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontSize: 13,
        background: T.surface,
        color: T.text,
        outline: "none",
        fontFamily: T.fontBody,
        cursor: "pointer",
      },
      meta: { fontSize: 13, color: T.text3, flex: 1 },
      btn: (color) => ({
        padding: "8px 16px",
        borderRadius: T.radiusSm,
        background: color,
        color: "#fff",
        border: "none",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: T.fontBody,
      }),
      btnOutline: (color) => ({
        padding: "7px 14px",
        borderRadius: T.radiusSm,
        background: "transparent",
        color,
        border: `1.5px solid ${color}`,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: T.fontBody,
      }),
      btnGhost: {
        padding: "7px 14px",
        borderRadius: T.radiusSm,
        background: "transparent",
        color: T.text2,
        border: `1px solid ${T.border}`,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: T.fontBody,
      },
      btnSmall: (color) => ({
        padding: "4px 10px",
        borderRadius: T.radiusSm,
        background: "transparent",
        color,
        border: `1px solid ${color}`,
        fontSize: 11.5,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: T.fontBody,
        marginLeft: 4,
      }),
      tableWrap: {
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        overflow: "auto",
        boxShadow: T.shadowSm,
      },
      table: { width: "100%", borderCollapse: "collapse", minWidth: 600 },
      th: (active) => ({
        padding: "10px 16px",
        textAlign: "right",
        fontSize: 11.5,
        fontWeight: 600,
        color: active ? T.accent : T.text3,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        background: T.surface2,
        borderBottom: `1px solid ${T.border}`,
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
      }),
      pagination: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
      },
      logoutBtn: {
        padding: "7px 14px",
        borderRadius: T.radiusSm,
        background: "transparent",
        color: T.text2,
        border: `1px solid ${T.border}`,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: T.fontBody,
      },
    }),
    [responsive],
  );

  const td = (extra = {}) => ({
    padding: "10px 16px",
    fontSize: 13.5,
    borderBottom: `1px solid ${T.borderSoft}`,
    ...extra,
  });

  const COLS = {
    loans: [
      ["loanID", "מזהה"],
      ["bookID", "קוד ספר"],
      ["bookName", "שם הספר", false],
      ["borrowerID", "ת״ז"],
      ["borrower", "שם שואל", false],
      ["loanDate", "תאריך השאלה"],
      ["dueDate", "להחזיר עד"],
      ["", "", false],
    ],
    books: [
      ["", "", false],
      ["serialNum", "מס'", true],
      ["tempCopyCode", "קוד ספר"],
      ["bookName", "שם הספר"],
      ["authorName", "מחבר"],
      ["area", "מיקום"],
      ["loan_policy", "מדיניות"],
      ["status", "סטטוס", false],
      ["", "", false],
    ],
    borrowers: [
      ["", "", false],
      ["borrowerID", "ת״ז"],
      ["firstName", "שם פרטי"],
      ["lastName", "שם משפחה"],
      ["shiur", "שיעור"],
      ["phone", "טלפון"],
      ["isBlocked", "חסום"],
      ["activeLoansCount", "מושאלים"],
      ["", "", false],
    ],
  };

  return (
    <div style={s.page}>
      {bookModal && (
        <BookModal
          book={bookModal === "add" ? null : bookModal}
          onClose={() => setBookModal(null)}
          onSave={(savedCode) => {
            setBookModal(null);
            setTab("books");
            setSearch(savedCode);
            setOpenBookCode(savedCode);
            refreshStats();
          }}
          onSaveAndAdd={(savedCode, duplicateData) => {
            setBookModal(null);
            setTab("books");
            setSearch(savedCode);
            setOpenBookCode(savedCode);
            refreshStats();
            setTimeout(
              () =>
                setBookModal(
                  duplicateData
                    ? { ...duplicateData, _isDuplicate: true }
                    : "add",
                ),
              150,
            );
          }}
        />
      )}
      {borrowerModal && (
        <BorrowerModal
          borrower={borrowerModal === "add" ? null : borrowerModal}
          onClose={() => setBorrowerModal(null)}
          onSave={() => {
            setBorrowerModal(null);
            loadData();
            refreshStats();
          }}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          warning={confirmDialog.warning}
          danger={confirmDialog.danger}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      {policyModal && (
        <BulkPolicyModal
          count={selected.size}
          onClose={() => setPolicyModal(false)}
          onSave={(policy) => {
            setPolicyModal(false);
            executeBulk("update", { updates: { loan_policy: policy } });
          }}
        />
      )}
      {selectionMode && selected.size > 0 && (
        <BulkBar
          selected={selected}
          rows={rows}
          onClose={exitSelectionMode}
          onAction={handleBulkAction}
          processing={processing}
        />
      )}

      <div style={s.header}>
        <div>
          <h1 style={s.title}>פאנל ניהול</h1>
          <p style={s.subtitle}>סקירה כללית של הספרייה</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {backupMsg && (
            <span
              style={{
                fontSize: 12,
                color: backupMsg.startsWith("✓") ? T.green : T.red,
              }}
            >
              {backupMsg}
            </span>
          )}
          <button
            style={s.logoutBtn}
            disabled={backingUp}
            onClick={handleBackup}
          >
            {backingUp ? "מגבה..." : "💾 גיבוי"}
          </button>
          <button
            style={s.logoutBtn}
            onClick={async () => {
              await fetch("/api/auth", { method: "DELETE" });
              router.push("/login");
            }}
          >
            התנתק
          </button>
        </div>
      </div>

      <div style={s.statsGrid}>
        {[
          ["סה״כ ספרים", stats?.totalBooks],
          ["מושאלים", stats?.borrowedBooks],
          ["פנויים", stats?.availableBooks],
          ["שואלים", stats?.totalBorrowers],
          ["השאלות פעילות", stats?.activeLoans],
        ].map(([label, value]) => (
          <div key={label} style={s.statCard}>
            <div style={s.statValue}>{value?.toLocaleString() ?? "..."}</div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={s.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            style={s.tab(tab === t.id)}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.toolbar}>
        {!selectionMode && (
          <input
            style={s.input}
            placeholder="חיפוש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = T.accent)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        )}
        {tab === "books" && !selectionMode && (
          <>
            <button style={s.btn(T.accent)} onClick={() => setBookModal("add")}>
              + הוסף ספר
            </button>
            <select
              style={s.select}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">כל הסטטוסים</option>
              <option value="available">פנוי</option>
              <option value="borrowed">מושאל</option>
              <option value="inactive">לא פעיל</option>
            </select>
            <select
              style={s.select}
              value={filterPolicy}
              onChange={(e) => {
                setFilterPolicy(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">כל המדיניות</option>
              <option value="regular">רגיל</option>
              <option value="short">טווח קצר</option>
              <option value="inplace">לעיון במקום</option>
            </select>
            <select
              style={s.select}
              value={filterRoom}
              onChange={(e) => {
                setFilterRoom(e.target.value);
                setFilterArea("all");
                setPage(1);
              }}
            >
              <option value="all">כל החדרים</option>
              <option value="ספרייה">ספרייה</option>
              <option value="בית מדרש">בית מדרש</option>
            </select>
            {filterRoom === "ספרייה" && (
              <select
                style={s.select}
                value={filterArea}
                onChange={(e) => {
                  setFilterArea(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">כל האזורים</option>
                {AREAS_LIBRARY.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
            {filterRoom === "בית מדרש" && (
              <select
                style={s.select}
                value={filterArea}
                onChange={(e) => {
                  setFilterArea(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">כל האזורים</option>
                {AREAS_BM.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
            <button
              style={s.btnOutline(T.accent)}
              onClick={() => {
                setSelectionMode(true);
                setSelected(new Set());
              }}
            >
              ☑ פעולה על מרובים
            </button>
          </>
        )}
        {tab === "books" && selectionMode && (
          <>
            <button style={s.btnOutline(T.accent)} onClick={toggleSelectAll}>
              {selected.size === rows.length ? "בטל הכל" : "בחר הכל"}
            </button>
            <span style={{ fontSize: 13, color: T.text3 }}>
              {selected.size} נבחרו
            </span>
            <button style={s.btnGhost} onClick={exitSelectionMode}>
              יציאה ממצב בחירה
            </button>
          </>
        )}
        {tab === "borrowers" && (
          <button
            style={s.btn(T.accent)}
            onClick={() => setBorrowerModal("add")}
          >
            + הוסף שואל
          </button>
        )}
        {!loading && !selectionMode && (
          <span style={s.meta}>
            {total.toLocaleString()} תוצאות
            {totalPages > 1 && ` · עמוד ${page}/${totalPages}`}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ color: T.text3, padding: 20 }}>טוען...</div>
      ) : (
        <>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {selectionMode && tab === "books" && (
                    <th style={s.th(false)} onClick={toggleSelectAll}>
                      <input
                        type="checkbox"
                        checked={
                          selected.size === rows.length && rows.length > 0
                        }
                        onChange={toggleSelectAll}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                  )}
                  {COLS[tab].map(([key, label, sortable = true], i) => (
                    <th
                      key={i}
                      style={s.th(sortBy === key)}
                      onClick={() => sortable && key && handleSort(key)}
                    >
                      {label}
                      {sortBy === key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        padding: 24,
                        textAlign: "center",
                        color: T.text3,
                      }}
                    >
                      אין תוצאות
                    </td>
                  </tr>
                )}

                {tab === "loans" &&
                  rows.map((r) => {
                    const isOverdue =
                      r.dueDate &&
                      (() => {
                        try {
                          const [d, m, y] = r.dueDate.split("/");
                          return new Date(`${y}-${m}-${d}`) < new Date();
                        } catch {
                          return false;
                        }
                      })();
                    const name = r.borrower
                      ? `${r.borrower.firstName || ""} ${r.borrower.lastName || ""}`.trim()
                      : "—";
                    return (
                      <tr
                        key={r.loanID}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fafbff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "")
                        }
                      >
                        <td
                          style={td({
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: T.text3,
                          })}
                        >
                          {r.loanID}
                        </td>
                        <td
                          style={td({ fontFamily: "monospace", fontSize: 12 })}
                        >
                          {r.bookID}
                        </td>
                        <td style={td({ fontWeight: 500 })}>
                          {r.bookName || "—"}
                        </td>
                        <td style={td({ color: T.text3 })}>{r.borrowerID}</td>
                        <td style={td({ fontWeight: 500 })}>{name}</td>
                        <td style={td()}>{r.loanDate}</td>
                        <td style={td()}>
                          <span
                            style={{
                              color: isOverdue ? T.red : "inherit",
                              fontWeight: isOverdue ? 600 : 400,
                            }}
                          >
                            {r.dueDate || "—"}
                            {isOverdue && " ⚠️"}
                          </span>
                        </td>
                        <td style={td()}>
                          <a
                            href={`/returns?copyCode=${r.bookID}`}
                            style={s.btnSmall(T.red)}
                          >
                            החזר
                          </a>
                        </td>
                      </tr>
                    );
                  })}

                {tab === "books" &&
                  rows.map((r) => (
                    <BookRow
                      key={r.tempCopyCode || r.serialNum}
                      r={r}
                      s={s}
                      td={td}
                      onEdit={setBookModal}
                      onDeactivate={handleDeactivateBook}
                      onActivate={handleActivateBook}
                      onDelete={handleDeleteBook}
                      onDuplicate={(book) =>
                        setBookModal({
                          ...book,
                          tempCopyCode: "",
                          _isDuplicate: true,
                        })
                      }
                      selectionMode={selectionMode}
                      selected={selected.has(r.tempCopyCode)}
                      onSelect={toggleSelect}
                      autoOpen={openBookCode === r.tempCopyCode}
                      onOpened={() => setOpenBookCode(null)}
                    />
                  ))}

                {tab === "borrowers" &&
                  rows.map((r) => (
                    <BorrowerRow
                      key={r.borrowerID}
                      r={r}
                      s={s}
                      td={td}
                      onEdit={setBorrowerModal}
                      onDelete={(r) =>
                        setConfirmDialog({
                          message: `למחוק את ${r.firstName} ${r.lastName}?`,
                          danger: true,
                          onConfirm: () => handleDeleteBorrower(r.borrowerID),
                        })
                      }
                    />
                  ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={s.pagination}>
              <button
                style={s.btnGhost}
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                ⏮
              </button>
              <button
                style={s.btnGhost}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                → הקודם
              </button>
              <span style={{ fontSize: 13, color: T.text3 }}>
                {page} / {totalPages}
              </span>
              <button
                style={s.btnGhost}
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                הבא ←
              </button>
              <button
                style={s.btnGhost}
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              >
                ⏭
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
