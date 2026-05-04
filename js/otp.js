// ═══════════════════════════════════════
// OTP SYSTEM — Send and verify OTP via Edge Function
// ═══════════════════════════════════════

//  OTP SYSTEM
// ═══════════════════════════════════════
let pendingEmail='';

async function sendOTPvia(email) {
  const r = await fetch(EDGE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_ANON },
    body: JSON.stringify({ email }) 
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Send failed: ' + r.status);
  return true;
}

async function verifyOTP(email, token) {
  const r = await fetch(EDGE + '?action=verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_ANON },
    body: JSON.stringify({ email, otp: token })
  });
  const j = await r.json();
  return r.ok && j.valid === true;
}

