// ═══════════════════════════════════════
// AUTH / LOGIN — Login modal, session management, user tracking
// ═══════════════════════════════════════

//  LOGIN MODAL FUNCTIONS
// ═══════════════════════════════════════
function openLoginModal() {
  if (curUser) {
    showLmStep(3);
    document.getElementById('lmTitle').textContent='My Account';
    document.getElementById('lmSub').textContent='Logged in ✓';
    document.getElementById('lm-show-email').textContent=curUser.email||'';
  } else {
    showLmStep(1);
    document.getElementById('lmTitle').textContent='Login / Sign Up';
    document.getElementById('lmSub').textContent='Email OTP ने login करा • No password needed';
    setTimeout(()=>document.getElementById('lm-email').focus(),200);
  }
  document.getElementById('loginOverlay').classList.add('open');
}

function showLmStep(n) {
  ['lm-s1','lm-s2','lm-s3'].forEach((id,i)=>{
    document.getElementById(id).style.display = (i+1===n)?'block':'none';
  });
}

async function sendLoginOTP() {
  const email = document.getElementById('lm-email').value.trim().toLowerCase();
  if (!email||!email.includes('@')) { showToast('⚠️ Valid email enter करा'); return; }
  const btn=document.getElementById('lmBtn');
  btn.disabled=true; btn.textContent='📧 Sending...';
  try {
    await sendOTPvia(email);
    pendingEmail=email;
    showLmStep(2);
    document.querySelectorAll('#lm-otp .otp-input').forEach(i=>i.value='');
    setTimeout(()=>document.querySelector('#lm-otp .otp-input')?.focus(),100);
    showToast('✅ OTP Gmail वर पाठवला!');
  } catch(e) {
    showToast('⚠️ '+e.message);
  }
  btn.disabled=false; btn.textContent='📧 OTP पाठवा';
}

async function verifyLoginOTP() {
  const token=Array.from(document.querySelectorAll('#lm-otp .otp-input')).map(i=>i.value).join('');
  if (token.length<6) { showToast('⚠️ 6-digit OTP enter करा'); return; }
  const ok=await verifyOTP(pendingEmail,token);
  if (!ok) { showToast('⚠️ Wrong or expired OTP! Resend करा.'); return; }
  const sessionToken = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36)+Date.now().toString(36));
  curUser={email:pendingEmail, id:pendingEmail, sessionToken, loginTime: Date.now()};
  localStorage.setItem('vp_user',JSON.stringify(curUser));
  updateNavBtn(); updateDashUI();
  showLmStep(3);
  document.getElementById('lm-show-email').textContent=curUser.email;
  document.getElementById('lmTitle').textContent='My Account';
  showToast('✅ Login successful! Welcome 🎉');
  recordUser(pendingEmail).catch(()=>{});
}

async function recordUser(email) {
  try {
    const normalized = email.trim().toLowerCase();
    await fetch(`${SB_URL}/functions/v1/record-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_ANON },
      body: JSON.stringify({ email: normalized })
    });
  } catch(e) {
    console.debug('User record skipped:', e.message);
  }
}

function doLogout() {
  curUser=null; localStorage.removeItem('vp_user');
  updateNavBtn(); updateDashUI();
  closeModal('loginOverlay'); showPage('home');
  showToast('Logged out');
}

function updateNavBtn() {
  const btn=document.getElementById('navLoginBtn');
  const icon=document.getElementById('navLoginIcon');
  const text=document.getElementById('navLoginText');
  if(curUser){
    btn.classList.add('logged-in'); icon.textContent='✓';
    text.textContent=(curUser.email||'Me').split('@')[0].slice(0,10);
  } else {
    btn.classList.remove('logged-in'); icon.textContent='👤'; text.textContent='Login';
  }
}
