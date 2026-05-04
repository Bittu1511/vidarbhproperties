// ═══════════════════════════════════════
// DETAIL — Open listing detail, contact actions, saved listings
// ═══════════════════════════════════════

//  DETAIL
// ═══════════════════════════════════════
async function openDetail(id){
  document.getElementById('loadingOverlay').style.display='flex';
  const {data:l}=await sb.from('properties').select('*').eq('id',id).single();
  document.getElementById('loadingOverlay').style.display='none';
  if(!l){showToast('⚠️ Not found');return;}
  
  // Trigger view counter and log success/failure to console
  sb.rpc('increment_view', { property_id: id })
    .then(() => console.log("✅ View successfully incremented in DB"))
    .catch(err => console.error("❌ View increment failed:", err));

  curL=l; listingStore[l.id]=l; 
  
  const imgList = l.img ? l.img.split(',') : [];
  document.getElementById('d-img').src=imgList[0] || 'https://placehold.co/600x260/f5e6e2/c84b31?text=No+Image';
  
  document.getElementById('d-price').textContent=fp(l.price);
  document.getElementById('d-title').textContent=l.title;
  document.getElementById('d-cat').textContent=l.category;
  document.getElementById('d-ver').textContent=l.verified?'✓ Verified':'⏳ Pending';
  document.getElementById('d-ver').className='d-badge'+(l.verified?' ver':'');
  document.getElementById('d-area').textContent=l.area||'–';
  document.getElementById('d-type').textContent=l.category;
  document.getElementById('d-loc').textContent=l.location;
  document.getElementById('d-date').textContent = l.created_at ? ta(l.created_at) : 'Recently';
  document.getElementById('d-desc').textContent=l.desc||'No description.';
  document.getElementById('d-seller').textContent=l.seller||'–';
  document.getElementById('d-stype').textContent=l.seller_type||'Owner';
  document.getElementById('d-sver').textContent=l.verified?'✓ Phone Verified':'Not verified yet';
  document.getElementById('d-avatar').textContent=l.seller_type==='Broker'?'🤝':'👤';

  const mapWrap = document.getElementById('d-map-wrap');
  if(l.maps_url && l.maps_url.startsWith('http')){
    mapWrap.innerHTML = `
      <a href="${esc(l.maps_url)}" target="_blank" rel="noopener"
         style="display:flex;align-items:center;gap:10px;text-decoration:none;color:#1976D2;font-weight:700;font-size:14px">
        <span style="font-size:28px">📍</span>
        <div>
          <div>${esc(l.location)}</div>
          <div style="font-size:12px;font-weight:500;text-decoration:underline">Google Maps वर उघडा →</div>
        </div>
      </a>`;
    mapWrap.style.cursor='pointer';
  } else {
    mapWrap.innerHTML='<span style="font-size:14px;font-weight:700;color:#1976D2">📍 '+esc(l.location)+'<br><span style="font-size:11px;font-weight:400;opacity:0.7">Map link available after seller adds it</span></span>';
  }

  const saves = getSaved();
  document.getElementById('d-save-btn').textContent = saves.includes(id) ? '❤️' : '🔖';

  showPage('detail');
}
function handleCall(){if(!curUser){showToast('📞 Call साठी Login करा');openLoginModal();return;}if(curL){logInq(curL.id,'call');callNum(curL.phone,curL.seller);}}
function handleWA(){if(!curUser){showToast('💬 WhatsApp साठी Login करा');openLoginModal();return;}if(curL){logInq(curL.id,'whatsapp');waNum(curL.phone,curL.title);}}
function callNum(p,n){showToast(`📞 Calling ${n}...`);setTimeout(()=>{window.location.href=`tel:+91${p}`;},400);}
function waNum(p,t){const m=encodeURIComponent(`नमस्कार! मला vidarbhproperties.in वर आपली जाहिरात आवडली: "${t}". कृपया अधिक माहिती द्या.`);showToast('💬 Opening...');setTimeout(()=>window.open(`https://wa.me/91${p}?text=${m}`,'_blank'),300);}

function contactFromCard(type, lid){
  if(!curUser){
    showToast(type==='call'?'📞 Call साठी Login करा':'💬 WhatsApp साठी Login करा');
    openLoginModal();
    return;
  }
  const l = listingStore[lid];
  if(!l){ showToast('⚠️ Listing not found'); return; }
  logInq(lid, type);
  if(type==='call') callNum(l.phone, l.seller);
  else waNum(l.phone, l.title);
}
function shareLink(){
  const u='https://vidarbhproperties.in';
  const txt = curL ? `${curL.title} - ${fp(curL.price)} | VidarbhProperties\n${u}` : u;
  if(navigator.share) navigator.share({title:curL?.title, text:txt, url:u});
  else { navigator.clipboard?.writeText(u); showToast('🔗 Link copied!'); }
}
async function logInq(lid,type){try{await sb.from('inquiries').insert({listing_id:lid,contact_type:type,user_phone:curUser?.email||'anon'});}catch(e){}}

// ── SAVED LISTINGS (localStorage) ──
function getSaved(){ try{ return JSON.parse(localStorage.getItem('vp_saved')||'[]'); }catch(e){ return []; } }
function setSaved(arr){ localStorage.setItem('vp_saved', JSON.stringify(arr)); }

// ADD THIS NEW FUNCTION TO FETCH INQUIRIES
async function loadMyInquiries() {
  const grid = document.getElementById('myInqGrid');
  grid.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">लोड होत आहे...</div>';
  
  try {
    // Get the properties owned by this user
    const { data: myProps, error: propErr } = await sb.from('properties').select('id, title').eq('user_email', curUser.email).order('created_at', {ascending: false}).eq('user_email', curUser.email).limit(50);
    if (propErr) throw new Error("Properties fetch failed: " + propErr.message);
    
    if (!myProps || myProps.length === 0) {
      document.getElementById('ds-i').textContent = '0';
      grid.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">अजून कोणतीही Inquiry नाही</div>';
      return;
    }

    const propIds = myProps.map(p => p.id);
    
    // Fetch inquiries for those properties
    const { data: inqs, error: inqErr } = await sb.from('inquiries').select('*').in('listing_id', propIds).order('created_at', {ascending: false});
    if (inqErr) throw new Error("Inquiries fetch failed: " + inqErr.message);
    
    console.log("✅ Successfully fetched inquiries:", inqs);
    
    // Update the counter on the dashboard
    document.getElementById('ds-i').textContent = inqs?.length || 0;

    if (!inqs || inqs.length === 0) {
      grid.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">अजून कोणतीही Inquiry नाही</div>';
      return;
    }

    // Draw the inquiries on the screen with the User's Contact Info
    grid.innerHTML = inqs.map(iq => {
      const prop = myProps.find(p => p.id === iq.listing_id);
      
      // Grab the logged-in user's email/phone saved during the inquiry
      const inquirer = iq.user_phone; 

      return `
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px">${esc(prop?.title || 'Unknown Property')}</div>
          
          <div style="background:var(--bg);border-radius:6px;padding:8px;margin-bottom:8px;border:1px solid var(--border);">
            <div style="font-size:11px;color:var(--muted);text-transform:font-weight:700;margin-bottom:2px;">Inquiry By:</div>
            <div style="font-size:13px;font-weight:700;color:var(--brand);">${esc(inquirer)}</div>
          </div>

          <div style="font-size:12px;color:var(--muted);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:600;color:var(--dark);">${iq.contact_type === 'call' ? '📞 Phone Call' : '💬 WhatsApp'}</span>
            <span>${ta(iq.created_at)}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("❌ Dashboard Inquiry Error:", err);
    grid.innerHTML = `<div style="padding:20px;text-align:center;color:red;font-size:12px">${err.message}</div>`;
  }
}

function toggleSaveFromCard(id, btn){
  const saves = getSaved();
  const idx = saves.indexOf(id);
  if(idx === -1){
    saves.push(id);
    setSaved(saves);
    btn.textContent='❤️';
    showToast('❤️ Saved!');
  } else {
    saves.splice(idx,1);
    setSaved(saves);
    btn.textContent='🔖';
    showToast('🔖 Removed from saved');
  }
}

function toggleSaveListing(){
  if(!curL) return;
  const saves = getSaved();
  const idx = saves.indexOf(curL.id);
  if(idx === -1){
    saves.push(curL.id);
    setSaved(saves);
    document.getElementById('d-save-btn').textContent='❤️';
    showToast('❤️ Saved!');
  } else {
    saves.splice(idx,1);
    setSaved(saves);
    document.getElementById('d-save-btn').textContent='🔖';
    showToast('🔖 Removed from saved');
  }
}

async function renderSavedPage(){
  const saves = getSaved();
  const grid = document.getElementById('savedGrid');
  document.getElementById('saved-count').textContent = saves.length + ' saved';
  if(!saves.length){
    grid.innerHTML = `<div class="saved-empty"><div style="font-size:48px;margin-bottom:12px">🔖</div><div style="font-size:16px;font-weight:700;color:var(--dark);margin-bottom:8px">No saved listings yet</div><div style="font-size:13px">Listings वर ❤️ tap करा to save</div></div>`;
    return;
  }
  grid.innerHTML = '<div style="text-align:center;color:var(--muted);padding:16px">Loading...</div>';
  const {data} = await sb.from('properties').select('*').in('id', saves);
  if(!data?.length){ grid.innerHTML='<div class="saved-empty"><div style="font-size:48px">😕</div><div style="margin-top:8px;font-weight:700">Listings not found</div></div>'; return; }
  const tmp = document.createElement('div');
  tmp.className = 'listings-grid';
  data.forEach((l,i)=>{ const d=document.createElement('div'); d.innerHTML=cardH(l,i); tmp.appendChild(d.firstElementChild); });
  grid.innerHTML = '';
  grid.appendChild(tmp);
}

