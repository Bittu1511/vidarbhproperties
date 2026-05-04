// ═══════════════════════════════════════
// ADMIN PANEL — Login, approve/reject/delete listings
// ═══════════════════════════════════════

//  ADMIN
// ═══════════════════════════════════════
let curAdminTab = 'pending'; 

async function adminLogin(){
  const pass = document.getElementById('admin-pass').value;
  if(!pass){ showToast('⚠️ Password enter करा'); return; }
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass));
  const hash = [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(hash === ADMIN_HASH){
    document.getElementById('admin-login').style.display='none';
    document.getElementById('admin-content').style.display='block';
    loadAdminTab('pending',document.getElementById('at-p'));
  } else {
    showToast('⚠️ Wrong password');
    document.getElementById('admin-pass').value='';
  }
}

async function loadAdminTab(status, btn){
  curAdminTab = status;
  document.querySelectorAll('#admin-content .filter-chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  const grid = document.getElementById('adminGrid');
  grid.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Loading...</div>';

  let q = sb.from('properties').select('*').order('created_at',{ascending:false});
  if(status !== 'all') q = q.eq('status', status);
  const {data, error} = await q;

  if(error){ grid.innerHTML='<div style="padding:20px;color:red">Error: '+error.message+'</div>'; return; }
  if(!data?.length){ grid.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted)">No listings in this tab</div>'; return; }

  grid.innerHTML = data.map(l=>`
    <div class="admin-row" id="arow-${l.id}">
      <img src="${(l.img?l.img.split(',')[0]:'')||'https://placehold.co/65x65/f5e6e2/c84b31?text=🏠'}" onerror="this.src='https://placehold.co/65x65/f5e6e2/c84b31?text=🏠'" alt="">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700">${esc(l.title)}</div>
        <div style="font-size:12px;color:var(--muted)">${fp(l.price)} · ${esc(l.location)}</div>
        <div style="font-size:11px;color:var(--muted)">${esc(l.seller)} · ${l.phone} · ${ta(l.created_at)}</div>
        <span class="status-badge status-${l.status||'pending'}" style="margin-top:4px;display:inline-block">${l.status||'pending'}</span>
        <div class="admin-actions">
          ${l.status!=='approved'?`<button class="btn-approve" onclick="adminUpd('${l.id}','approved',false)">✓ Approve</button>`:''}
          <button class="btn-approve" onclick="adminUpd('${l.id}','approved',true)">✓✓ Approve+Verify</button>
          ${l.status!=='rejected'?`<button class="btn-reject" onclick="adminUpd('${l.id}','rejected',false)">✗ Reject</button>`:''}
          ${l.status!=='pending'?`<button class="btn-approve" style="background:#FFF3E0;color:#E65100;border-color:#FFB74D" onclick="adminUpd('${l.id}','pending',false)">↩ Pending</button>`:''}
          <button class="btn-reject" onclick="adminDel('${l.id}')">🗑 Delete</button>
        </div>
      </div>
    </div>`).join('');
}

async function adminUpd(id, status, verify){
  const row = document.getElementById('arow-'+id);
  if(row){ row.style.opacity='0.5'; row.style.pointerEvents='none'; }

  const upd = { status: status };
  if(verify) upd.verified = true;

  const { data: updData, error } = await sb
    .from('properties')
    .update(upd)
    .eq('id', id)
    .select();

  if(error){
    alert('Update failed!\n\nError: ' + error.message + '\n\nCode: ' + error.code + '\n\nHint: ' + (error.hint||'none'));
    if(row){ row.style.opacity='1'; row.style.pointerEvents='auto'; }
    return;
  }

  if(!updData || updData.length === 0){
    alert('Update returned no rows! The listing ID may be wrong or RLS is blocking the update.');
    if(row){ row.style.opacity='1'; row.style.pointerEvents='auto'; }
    return;
  }

  showToast(
    status==='approved' ? '✅ Approved! Now live on homepage.' :
    status==='rejected' ? '✗ Rejected' : '↩ Moved to pending'
  );

  if(status === 'approved') loadListings(true);

  const tabMap = { pending:'at-p', approved:'at-a', rejected:'at-r', all:'at-all' };
  const tabBtn = document.getElementById(tabMap[curAdminTab] || 'at-p');
  if(tabBtn) await loadAdminTab(curAdminTab, tabBtn);
}

async function adminDel(id){
  if(!confirm('Permanently delete this listing?')) return;
  const {error} = await sb.from('properties').delete().eq('id', id);
  if(error){ showToast('⚠️ '+error.message); return; }
  showToast('🗑 Deleted');
  const tabBtn = document.getElementById(
    curAdminTab==='pending'?'at-p':curAdminTab==='approved'?'at-a':curAdminTab==='rejected'?'at-r':'at-all'
  );
  await loadAdminTab(curAdminTab, tabBtn);
}

