// ═══════════════════════════════════════
// DASHBOARD — User listings, inquiries, profile
// ═══════════════════════════════════════

//  DASHBOARD
// ═══════════════════════════════════════
function updateDashUI(){
  const nl=document.getElementById('dash-nologin'),ct=document.getElementById('dash-content');
  if(!curUser){nl.style.display='block';ct.style.display='none';document.getElementById('dash-name').textContent='–';document.getElementById('dash-email').textContent='–';return;}
  nl.style.display='none';ct.style.display='block';
  const em=curUser.email||'';
  document.getElementById('dash-name').textContent=em.split('@')[0];
  document.getElementById('dash-email').textContent=em;
  document.getElementById('p-name').textContent=em.split('@')[0];
  document.getElementById('p-email').textContent=em;
  loadMyListings();
  loadMyInquiries();
}

async function loadMyListings(){
  const grid=document.getElementById('myListingsGrid');
  grid.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted)">जाहिराती लोड होत आहेत...</div>';
  const {data, error}=await sb.from('properties').select('*').eq('user_email', curUser.email).order('created_at',{ascending:false}).limit(20);
  if (error) console.error("❌ Error fetching properties for dashboard:", error);

  document.getElementById('ds-l').textContent=data?.length||0;

  // Calculate views safely and update the UI
  const totalViews = data?.reduce((sum, item) => sum + (Number(item.views) || 0), 0) || 0;
  document.getElementById('ds-v').textContent = totalViews;

  if(!data?.length){grid.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted)">अजून कोणतीही जाहिरात नाही</div>';return;}
  
  grid.innerHTML=data.map(l=>`
    <div class="my-listing-item">
      <img class="my-listing-img" src="${(l.img?l.img.split(',')[0]:'')||'https://placehold.co/75x75/f5e6e2/c84b31?text=🏠'}" alt="" onerror="this.src='https://placehold.co/75x75/f5e6e2/c84b31?text=🏠'">
      <div class="my-listing-body">
        <div class="my-listing-title">${esc(l.title)}</div>
        <div class="my-listing-price">${fp(l.price)}</div>
        <div style="margin-top:3px"><span class="status-badge status-${l.status}">${l.status==='approved'?'● Active':l.status==='pending'?'⏳ Pending':'✓ Sold'}</span></div>
        <div class="my-listing-actions">
          <button class="btn-sm btn-sm-del" onclick="delListing('${l.id}')">🗑 Delete</button>
        </div>
      </div>
    </div>`).join('');
}

async function delListing(id){if(!confirm('Delete?'))return;await sb.from('properties').delete().eq('id',id);showToast('🗑 Deleted');loadMyListings();}

function dashTab(btn,tabId){
  document.querySelectorAll('.dash-tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');
  ['dt-l','dt-i','dt-p'].forEach(id=>{document.getElementById(id).style.display=id===tabId?'block':'none';});
}

