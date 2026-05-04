// ═══════════════════════════════════════
// UI & UTILITIES — Page navigation, lightbox, lang toggle, helpers
// ═══════════════════════════════════════

//  PAGES & UI
// ═══════════════════════════════════════
function showPage(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.getElementById('bottomNav').style.display=['post','success','admin'].includes(page)?'none':'flex';
  document.querySelectorAll('.bn-item').forEach(b=>b.classList.remove('active'));
  if(page==='home'){
    document.getElementById('bn-home').classList.add('active');
    document.getElementById('searchInput').value='';
    loadListings(true);
  }
  if(page==='dash'){document.getElementById('bn-dash').classList.add('active');updateDashUI();}
  if(page==='saved'){document.getElementById('bn-saved').classList.add('active');renderSavedPage();}
  window.scrollTo(0,0);
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function openSheet(){document.getElementById('filterSheet').classList.add('open');}
function closeSheet(){document.getElementById('filterSheet').classList.remove('open');}
// function onav(el,pos,wid){if(el.value.length>1)el.value=el.value.slice(-1);if(el.value&&pos<5){const ins=document.querySelectorAll(`#${wid} .otp-input`);if(ins[pos+1])ins[pos+1].focus();}}
function onav(el,pos,wid){el.value=el.value.replace(/[^0-9]/g,'');if(el.value.length>1)el.value=el.value.slice(-1);if(el.value&&pos<5){const ins=document.querySelectorAll(`#${wid} .otp-input`);if(ins[pos+1])ins[pos+1].focus();}}

function otpKey(e, el, pos, wid) {
  if (e.key === 'Backspace' && !el.value && pos > 0) {
    const ins = document.querySelectorAll(`#${wid} .otp-input`);
    if (ins[pos - 1]) {
      ins[pos - 1].focus();
      ins[pos - 1].value = '';
    }
  }
}

function toggleLang(){lang=lang==='mr'?'en':'mr';document.getElementById('langBtn').textContent=lang==='mr'?'मराठी':'English';document.getElementById('hero-title').innerHTML=lang==='mr'?'महाराष्ट्र / विदर्भ मधील<br>मालमत्ता शोधा 🏡':'Find Property in<br>Paratwada / Achalpur 🏡';document.getElementById('hero-sub').textContent=lang==='mr'?'जमीन, घर, दुकान – थेट मालकाशी संपर्क':'Land, House, Shop – Direct owner contact';showToast(lang==='mr'?'मराठी भाषा सक्रिय':'English active');}

// ═══════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════
// ── LIGHTBOX ──
function openLightbox(src) {
  if (!src || src.includes('placehold.co')) return; // don't open for placeholder
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden'; // prevent background scroll
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
// Close lightbox with Escape key
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeLightbox(); });

function fp(p){if(!p)return'–';if(p>=10000000)return'₹'+(p/10000000).toFixed(1)+' Cr';if(p>=100000)return'₹'+(p/100000).toFixed(1)+' L';return'₹'+p.toLocaleString('en-IN');}
function ta(d){if(!d)return'–';const s=(Date.now()-new Date(d))/1000;if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' hrs ago';if(s<604800)return Math.floor(s/86400)+' days ago';return new Date(d).toLocaleDateString('en-IN');}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2800);}

let taps=0;
document.querySelector('.nav-logo').addEventListener('click',()=>{if(++taps>=5){taps=0;showPage('admin');}});

init();
</body>
