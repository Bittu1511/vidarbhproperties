// ═══════════════════════════════════════
// POST LISTING — Multi-step form, photo upload, submit
// ═══════════════════════════════════════

//  POST LISTING
// ═══════════════════════════════════════
function checkLoginPost(){
  if(!curUser){openLoginModal();showToast('पहिले Login करा');return;}
  showPage('post');
}

function goStep(n){
  if(n===3){
    if(!document.getElementById('f-title').value){showToast('⚠️ Title भरा');return;}
    if(!document.getElementById('f-price').value){showToast('⚠️ Price भरा');return;}
    if(!document.getElementById('f-loc').value){showToast('⚠️ Location भरा');return;}
  }
  if(n===4){
    if(!curUser){
      setStep(4);
      document.getElementById('fs4-nologin').style.display='block';
      document.getElementById('fs4-form').style.display='none';
      return;
    }
    document.getElementById('fs4-nologin').style.display='none';
    document.getElementById('fs4-form').style.display='block';
    document.getElementById('fs4-userinfo').textContent=`✓ Logged in as: ${curUser.email}`;
  }
  setStep(n);
}

function setStep(n){
  for(let i=1;i<=4;i++){
    document.getElementById(`fs-${i}`).classList.toggle('active',i===n);
    const s=document.getElementById(`ws-${i}`);
    s.classList.remove('active','done');
    if(i<n)s.classList.add('done');
    else if(i===n)s.classList.add('active');
  }
  window.scrollTo({top:0,behavior:'smooth'});
}

function selCat(el,cat){document.querySelectorAll('.cat-select-item').forEach(e=>e.classList.remove('active'));el.classList.add('active');selCatV=cat;}

function handlePhotos(input){
  photoFiles=Array.from(input.files).slice(0,5);
  const p=document.getElementById('photoPreview');p.innerHTML='';
  photoFiles.forEach(f=>{const r=new FileReader();r.onload=e=>{const i=document.createElement('img');i.src=e.target.result;i.className='photo-thumb';p.appendChild(i);};r.readAsDataURL(f);});
  showToast(`${photoFiles.length} फोटो सिलेक्ट झाले`);
}

async function submitListing(){
  if(!curUser){openLoginModal();return;}
  const name=document.getElementById('f-name').value.trim();
  const phone=document.getElementById('f-phone').value.trim();
  if(!name){showToast('⚠️ नाव भरा');return;}
  if(!phone||phone.length!==10){showToast('⚠️ Valid 10-digit phone भरा');return;}
  const btn=document.getElementById('submitBtn');
  btn.disabled=true;

  // ── UPLOAD IMAGES ──
  let imgUrls = [];
  if(photoFiles.length > 0){
    btn.textContent='⏳ Photos upload होत आहेत...';
    try {
      const uploadPromises = photoFiles.map(async (f) => {
        const ext = (f.name.split('.').pop()||'jpg').toLowerCase();
        const fn = `listings/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const {data, error:ue} = await sb.storage.from('property-images').upload(fn, f, {cacheControl:'3600', upsert:false, contentType:f.type});
        
        if (ue) throw ue;
        const {data:{publicUrl}} = sb.storage.from('property-images').getPublicUrl(fn);
        return publicUrl;
      });
      
      imgUrls = await Promise.all(uploadPromises);
      showToast('✅ Photos uploaded!');
    } catch(uploadEx){
      console.error('Upload exception:', uploadEx);
      showToast('⚠️ Photo error: '+uploadEx.message);
    }
  }

  btn.textContent='⏳ Saving...';
  const ptype=document.querySelector('input[name="ptype"]:checked')?.value||'Owner';
  const insertData = {
    title:document.getElementById('f-title').value,
    category:selCatV,
    price: Math.min(Math.max(parseInt(document.getElementById('f-price').value)||0, 1), 999999999), 
    area:document.getElementById('f-area').value,
    bedrooms:document.getElementById('f-bhk').value,
    location:document.getElementById('f-loc').value,
    desc:document.getElementById('f-desc').value,
    seller:name,
    seller_type:ptype,
    phone,
    img: imgUrls.length ? imgUrls.join(',') : null,
    maps_url: (() => {
      const u = document.getElementById('f-maps').value.trim();
      if (u && (u.includes('maps.google') || u.includes('goo.gl/maps') || u.includes('maps.app.goo.gl'))) return u;
      return null;
    })(),
    verified:false,
    user_email: curUser.email
  };
  
  try { Object.assign(insertData, { status:'pending', badge:ptype==='Owner'?'Owner':'Broker', badge_class:ptype==='Owner'?'owner':'' }); } catch(e){}
  const {error:ie}=await sb.from('properties').insert(insertData);
  btn.disabled=false;btn.textContent='🎉 जाहिरात सबमिट करा';
  if(ie){showToast('⚠️ Error: '+ie.message);return;}
  ['f-title','f-price','f-area','f-loc','f-maps','f-desc','f-name','f-phone'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('photoPreview').innerHTML='';photoFiles=[];
  setStep(1);showPage('success');
}

