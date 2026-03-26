/**
 * SMS Service
 * כרגע: הדמייה — מחזיר הצלחה ומדפיס ל-console
 * לחיבור אמיתי: החלף את sendSmsReal בלבד
 */

// ─── Real SMS (להחליף כשיש תשתית) ─────────────────────────
async function sendSmsReal(phone, message) {
  // דוגמה ל-Twilio:
  // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await client.messages.create({ body: message, from: process.env.TWILIO_FROM, to: phone });
  
  // דוגמה לאינפוריו:
  // await fetch('https://api.inforu.co.il/SendMessageXml.ashx', { ... })
  
  throw new Error('SMS real provider not configured');
}

// ─── Simulation ────────────────────────────────────────────
async function sendSmsSim(phone, message) {
  console.log(`[SMS SIM] To: ${phone} | Message: ${message}`);
  return { success: true, simulated: true };
}

// ─── Main export ───────────────────────────────────────────
export async function sendSms(phone, message) {
  const USE_REAL_SMS = process.env.SMS_ENABLED === 'true';
  try {
    if (USE_REAL_SMS) return await sendSmsReal(phone, message);
    else              return await sendSmsSim(phone, message);
  } catch (err) {
    console.error('[SMS Error]', err);
    return { success: false, error: err.message };
  }
}

export function buildReturnReminderMessage(borrowerName, bookName, dueDate) {
  return `שלום ${borrowerName}, תזכורת: הספר "${bookName}" אמור להיות מוחזר עד ${dueDate}. אנא החזר אותו בהקדם. תודה - הספרייה`;
}

export function buildWaitlistNotifyMessage(borrowerName, bookName) {
  return `שלום ${borrowerName}, הספר "${bookName}" שביקשת הוחזר לספרייה ופנוי לאיסוף. שים לב: ההודעה נשלחה גם לממתינים נוספים — ראשון שמגיע זוכה! תודה - הספרייה`;
}

export function buildOverdueMessage(borrowerName, bookName, dueDate) {
  return `שלום ${borrowerName}, הספר "${bookName}" היה אמור להיות מוחזר ב-${dueDate}. אנא החזרהו בהקדם. תודה - הספרייה`;
}
