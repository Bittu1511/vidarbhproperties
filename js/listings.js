// ═══════════════════════════════════════
// LISTINGS — Load, render, skeleton, card HTML
// ═══════════════════════════════════════

// ═══════════════════════════════════════
//  STATS
// ═══════════════════════════════════════
async function loadStats() {
  const [{count:t},{count:v}] = await Promise.all([
    sb.from('properties').select('*',{count:'exact',head:true}).eq('status','approved'),
    sb.from('properties').select('*',{count:'exact',head:true}).eq('status','approved').eq('verified',true)
  ]);
  document.getElementById('stat-total').textContent=(t||0)+'+';
  document.getElementById('stat-verified').textContent=v||0;
}

// ═══════════════════════════════════════
//  LISTINGS
// ═══════════════════════════════════════
const listingStore = {};

async function loadListings(reset=false) {
  if(reset){pageOff=0; document.getElementById('listingsGrid').innerHTML=skels();}
  const raw=document.getElementById('searchInput').value.trim();
  let qry=sb.from('properties').select('*').eq('status','approved')
    .gte('price',pMin).lte('price',pMax)
    .order('created_at',{ascending:false})
    .range(pageOff,pageOff+PG-1);
  if(activeCat!=='all') qry=qry.eq('category',activeCat);
  if(bhkF) qry=qry.eq('bedrooms',bhkF);
  if(ownerOnly) qry=qry.eq('seller_type','Owner');
  if(verOnly) qry=qry.eq('verified',true);
  if(raw) {
    // Build multi-term search: English input + Marathi equivalents
    const terms = buildSearchTerms(raw);
    // Each term searches title, location, desc, category
    const clauses = terms.flatMap(t => [
      `title.ilike.%${t}%`,
      `location.ilike.%${t}%`,
      `desc.ilike.%${t}%`,
      `category.ilike.%${t}%`
    ]);
    qry = qry.or(clauses.join(','));
  }
  const {data,error}=await qry;
  if(error){showToast('⚠️ Error loading');return;}
  const grid=document.getElementById('listingsGrid');
  if(reset) grid.innerHTML='';
  if(!data?.length){
    if(reset) grid.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted);grid-column:1/-1;width:100%"><div style="font-size:40px">🔍</div><div style="font-weight:700;margin-top:8px">कोणतीही जाहिरात आढळली नाही</div></div>';
    document.getElementById('loadMoreWrap').style.display='none'; return;
  }
  data.forEach((l,i)=>{ listingStore[l.id]=l; const d=document.createElement('div');d.innerHTML=cardH(l,i);grid.appendChild(d.firstElementChild);});
  pageOff+=data.length;
  document.getElementById('loadMoreWrap').style.display=data.length<PG?'none':'block';
}
async function loadMore(){await loadListings(false);}

function skels(){return Array(3).fill(0).map(()=>`<div class="skel-card" style="margin-bottom:0"><div class="skel" style="height:180px"></div><div style="padding:14px"><div class="skel" style="height:22px;width:55%;margin-bottom:8px"></div><div class="skel" style="height:15px;width:80%;margin-bottom:10px"></div><div class="skel" style="height:38px"></div></div></div>`).join('');}

function cardH(l,i){
  const p=fp(l.price);
  const imgList = l.img ? l.img.split(',') : [];
  const img = imgList[0] || 'https://placehold.co/600x180/f5e6e2/c84b31?text=No+Photo';
  const ago=ta(l.created_at), bc=l.badge_class||'';
  
  return `<div class="listing-card" style="animation-delay:${i*.05}s" onclick="openDetail('${l.id}')">
    <div class="card-img-wrap">
      <img src="${img}" alt="${esc(l.title)}" loading="lazy" onerror="this.src='https://placehold.co/600x180/f5e6e2/c84b31?text=No+Photo'">
      <span class="card-badge ${bc}">${esc(l.badge||l.category)}</span>
      <button class="card-save" onclick="event.stopPropagation();toggleSaveFromCard('${l.id}',this)">${getSaved().includes(l.id)?'❤️':'🔖'}</button>
    </div>
    <div class="card-body">
      <div class="card-price">${p}</div>
      <div class="card-title">${esc(l.title)}</div>
      <div class="card-meta">
        ${l.area?`<span class="card-tag">📐 ${esc(l.area)}</span>`:''}
        ${l.bedrooms?`<span class="card-tag">🛏 ${esc(l.bedrooms)}</span>`:''}
        <span class="card-tag">${l.seller_type==='Owner'?'🏡 Owner':'🤝 Broker'}</span>
        ${l.verified?'<span class="card-tag" style="color:var(--green)">✓ Verified</span>':''}
      </div>
      <div class="card-loc">📍 ${esc(l.location)}${ago !== '–' ? ' · '+ago : ''}</div>
      <div class="card-actions">
        <button class="btn-call" onclick="event.stopPropagation();contactFromCard('call','${l.id}')">📞 Call</button>
        <button class="btn-wa" onclick="event.stopPropagation();contactFromCard('whatsapp','${l.id}')">💬 WhatsApp</button>
      </div>
    </div>
  </div>`;
}

