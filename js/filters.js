// ═══════════════════════════════════════
// FILTERS & SEARCH — Category, price, BHK, transliteration
// ═══════════════════════════════════════

//  FILTERS
// ═══════════════════════════════════════
function filterCat(cat,el){activeCat=cat;document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');loadListings(true);}
function setPrice(min,max,el){pMin=min;pMax=max;document.querySelectorAll('.filter-bar .filter-chip').forEach(c=>{if(!c.textContent.includes('Filter'))c.classList.remove('active');});el.classList.add('active');loadListings(true);}
function selBhk(el,v){document.querySelectorAll('.sheet .filter-chip').forEach(c=>c.classList.remove('active'));el.classList.add('active');bhkF=v;}
function applyFilter(){ownerOnly=document.getElementById('fo-owner').checked;verOnly=document.getElementById('fo-verified').checked;closeSheet();loadListings(true);showToast('Filter applied!');}
// ── SEARCH TRANSLITERATION ──
// Maps common English spellings → Marathi equivalents so
const TRANSLITERATION = {
  // Cities & towns
  'paratwada':   'परतवाडा',
  'achalpur':    'अचलपूर',
  'amravati':    'अमरावती',
  'vidarbha':    'विदर्भ',
  'nagpur':      'नागपूर',
  'wardha':      'वर्धा',
  'yavatmal':    'यवतमाळ',
  'akola':       'अकोला',
  'buldhana':    'बुलढाणा',
  'washim':      'वाशिम',
  // Property types
  'house':       'घर',
  'plot':        'जमीन',
  'land':        'जमीन',
  'farm':        'शेत',
  'shop':        'दुकान',
  'flat':        'फ्लॅट',
  // Common search terms
  'road':        'रोड',
  'colony':      'कॉलनी',
  'layout':      'लेआउट',
  'market':      'बाजार',
  'school':      'शाळा',
  'hospital':    'दवाखाना',
  'new':         'नवीन',
  'sale':        'विक्री',
  'buy':         'खरेदी',
  'cheap':       'स्वस्त',
  'bhk':         'BHK',
  'acre':        'एकर',
  'sqft':        'चौ.फूट',
  // Reverse: Marathi → English
  'परतवाडा':    'paratwada',
  'अचलपूर':     'achalpur',
  'अमरावती':    'amravati',
  'जमीन':       'plot',
  'घर':         'house',
  'शेत':        'farm',
  'दुकान':      'shop',
  'विक्री':     'sale',
  'नवीन':       'new',
};

function buildSearchTerms(input) {
  const q = input.trim().toLowerCase();
  const terms = new Set([q]); // always include original query
  // Direct map lookup
  if (TRANSLITERATION[q]) terms.add(TRANSLITERATION[q]);
  // Also check if any key contains the query (partial match)
  Object.entries(TRANSLITERATION).forEach(([eng, mar]) => {
    if (eng.includes(q) || q.includes(eng)) {
      terms.add(eng);
      terms.add(mar);
    }
  });
  return [...terms].filter(Boolean).slice(0, 6); // max 6 terms to avoid query bloat
}

function dbSearch(){clearTimeout(srchTimer);srchTimer=setTimeout(()=>loadListings(true),500);}

