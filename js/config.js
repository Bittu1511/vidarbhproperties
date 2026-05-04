// ═══════════════════════════════════════
// CONFIG, STATE, INIT — Supabase client, global variables, page init
// ═══════════════════════════════════════

/*
 * 🚨 CRITICAL SECURITY NOTICE:
 * Client-side admin verification (using ADMIN_HASH below) is NOT secure.
 * Because the Supabase Anon key is public, ANYONE can bypass this HTML page
 * and query your database directly. You MUST enforce Row Level Security (RLS)
 * in your Supabase SQL editor to protect the 'properties' table:
 * * CREATE POLICY "Admin Full Access" ON properties FOR ALL USING (
 * auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL@GMAIL.COM'
 * );
 */

// ═══════════════════════════════════════
//  CONFIG — Your Supabase credentials
// ═══════════════════════════════════════
const SB_URL  = 'https://vfsyuhjuzoslhjpqpcju.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc3l1aGp1em9zbGhqcHFwY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzEyMTAsImV4cCI6MjA5MTc0NzIxMH0._0g71VyYHLFaY4TRsFiKUhpXHMgQRLIM47seYRrid2s';


const ADMIN_HASH = '01dec783763957284afdbba53ec2638daf34e98187bf9072f2c4d1f05a5816ee'; 
const EDGE    = `${SB_URL}/functions/v1/send-otp`;

const sb = supabase.createClient(SB_URL, SB_ANON);

// ═══════════════════════════════════════
//  STATE
// ═══════════════════════════════════════
let lang='mr', activeCat='all', pMin=0, pMax=9e9;
let bhkF='', ownerOnly=false, verOnly=false;
let curL=null, curUser=null, selCatV='House';
let photoFiles=[], pageOff=0, srchTimer=null;
const PG=10;

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
async function init() {
  const saved = localStorage.getItem('vp_user');
  if (saved) {
    try {
      const u = JSON.parse(saved);
      const age = Date.now() - (u.loginTime || 0);
      const maxAge = 30 * 24 * 60 * 60 * 1000; 
      if (u.email && u.sessionToken && age < maxAge) {
        curUser = u;
        updateNavBtn();
      } else {
        localStorage.removeItem('vp_user'); 
      }
    } catch(e){ localStorage.removeItem('vp_user'); }
  }
  try { await Promise.all([loadListings(true), loadStats()]); } catch(e){}
  document.getElementById('loadingOverlay').style.display='none';
}

