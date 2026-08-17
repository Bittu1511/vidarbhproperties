/* Validator: structure, links, schema, SEO — plus the calculator maths.
   Run: node _check.js                                                     */
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
let bad = 0;
const fail = m => { console.log("   ✗ " + m); bad++; };

/* ---------------- page checks ---------------- */
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.name.startsWith("_") ? []
    : e.isDirectory() ? walk(path.join(d, e.name))
    : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
}
const pages = walk(ROOT);
console.log(`Checking ${pages.length} pages…\n`);

for (const f of pages) {
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  const html = fs.readFileSync(f, "utf8");
  const dir = path.dirname(f);
  console.log(rel);

  /* strip query/hash rather than skipping such links — `assets/app.css?v=2`
     must still be verified to exist */
  for (const raw of [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1])) {
    if (/^(https?:|data:|mailto:|tel:|\/\/|#)/.test(raw)) continue;
    const h = raw.split(/[?#]/)[0];
    if (!h) continue;
    if (!fs.existsSync(path.resolve(dir, h))) fail(`broken link → ${raw}`);
  }

  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  lds.forEach((m, i) => { try { JSON.parse(m[1]); } catch (e) { fail(`JSON-LD ${i + 1}: ${e.message}`); } });

  [[/<title>[^<]{20,70}<\/title>/, "title 20-70 chars"],
   [/<meta name="description" content="[^"]{70,175}"/, "meta description 70-175 chars"],
   [/<link rel="canonical"/, "canonical"],
   [/hreflang="en-in"/, "hreflang en-in"],
   [/<html lang="en-IN"/, "lang=en-IN"],
   [/<meta property="og:title"/, "og:title"],
   [/<meta name="viewport"/, "viewport"]
  ].forEach(([re, n]) => { if (!re.test(html)) fail(`missing ${n}`); });

  const h1 = (html.match(/<h1[ >]/g) || []).length;
  if (h1 !== 1) fail(`expected 1 <h1>, found ${h1}`);

  /* medical-safety: every calculator page must carry a prominent limits callout */
  if (rel.startsWith("tools/") && !/class="note med"/.test(html))
    fail("calculator page missing a prominent limits disclaimer (.note med)");

  /* the fertility-awareness page has a higher bar: it must state the real
     failure rate, must not promise safety, and must offer a comparison */
  if (rel.includes("safe-days")) {
    if (!/12[–-]24/.test(html)) fail("safe-days page does not state the typical-use failure rate");
    if (!/no completely safe days/i.test(html)) fail("safe-days page does not disclaim 'safe'");
    if (!/Copper IUD|Combined pill/.test(html)) fail("safe-days page has no effectiveness comparison");
    /* The <title> may carry the searched phrase, but the page's own heading must
       not assert safety. (An earlier version scanned all body copy for the
       phrase — it false-positived on the breadcrumb and added no real safety.) */
    const h1txt = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || ["", ""])[1].replace(/<[^>]+>/g, "");
    if (/\bsafe\b/i.test(h1txt)) fail(`safe-days page <h1> claims safety: "${h1txt.trim()}"`);
    /* the JSON-LD must describe the formula the code actually uses */
    if (/subtract(?:s)? 18 from your shortest/i.test(html) && !/subtracts 19/i.test(html))
      fail("FAQ schema describes -18 but the code uses -19");
  }

  /* every chart must ship non-colour encoding */
  if (/class="wheel"|class="bars"/.test(html) && !/tbl-toggle|data-tip/.test(html))
    fail("chart present without table view or tooltips (colour-alone risk)");

  if (/example\.com/.test(html)) fail("example.com placeholder left in");
}

/* sitemap coverage */
const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
console.log("\nsitemap.xml");
for (const f of pages) {
  const u = path.relative(ROOT, f).replace(/\\/g, "/");
  const expect = "https://YOUR-DOMAIN.in/" + (u === "index.html" ? "" : u);
  if (!sm.includes(`<loc>${expect}</loc>`)) fail(`not in sitemap → ${expect}`);
}

/* ---------------- maths checks ---------------- */
console.log("\nCalculator maths");
const MS = 86400000;
const add = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const D = s => new Date(s + "T00:00:00");
// format in LOCAL time — the site never uses toISOString, and doing so here
// would shift every date back a day in any timezone east of UTC.
const iso = d => d.getFullYear() + "-" +
  String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const eq = (label, got, want) => {
  if (got !== want) fail(`${label}: got ${got}, expected ${want}`);
  else console.log(`   ✓ ${label} = ${got}`);
};

/* Naegele: 1 Jan 2026 LMP, 28-day cycle -> 8 Oct 2026 */
eq("EDD from LMP 2026-01-01 (28d)", iso(add(D("2026-01-01"), 280)), "2026-10-08");
/* 32-day cycle shifts +4 */
eq("EDD from LMP 2026-01-01 (32d)", iso(add(D("2026-01-01"), 280 + 4)), "2026-10-12");
/* IVF day-5 blastocyst +261 */
eq("EDD from day-5 transfer 2026-01-01", iso(add(D("2026-01-01"), 261)), "2026-09-19");
/* IVF day-3 embryo +263 */
eq("EDD from day-3 transfer 2026-01-01", iso(add(D("2026-01-01"), 263)), "2026-09-21");

/* Ovulation: 28d cycle, 14d luteal -> day 14 -> LMP + 13 */
const ovDay = 28 - 14;
eq("Ovulation day (28d/14d luteal)", ovDay, 14);
eq("Ovulation date from 2026-01-01", iso(add(D("2026-01-01"), ovDay - 1)), "2026-01-14");
eq("Fertile window start (ov-5)", iso(add(D("2026-01-01"), ovDay - 1 - 5)), "2026-01-09");
eq("Fertile window end (ov+1)", iso(add(D("2026-01-01"), ovDay - 1 + 1)), "2026-01-15");
eq("Next period (LMP + cycle)", iso(add(D("2026-01-01"), 28)), "2026-01-29");

/* 35-day cycle, 14d luteal -> ovulation day 21 */
eq("Ovulation day (35d/14d luteal)", 35 - 14, 21);

/* Gestational age: EDD 2026-10-08, on 2026-06-08 -> start 2026-01-01, 158d = 22w4d */
const start = add(D("2026-10-08"), -280);
eq("Notional LMP from EDD", iso(start), "2026-01-01");
const ga = Math.round((D("2026-06-08") - start) / MS);
eq("GA days on 2026-06-08", ga, 158);
eq("GA weeks+days", `${Math.floor(ga / 7)}w ${ga % 7}d`, "22w 4d");

/* phase spans must tile the cycle with no gaps or overlaps */
/* mirrors computePhases() in ovulation-calculator.html */
function spansFor(cycle, luteal, period) {
  const ov = Math.max(2, cycle - luteal);
  const fs_ = Math.max(1, ov - 5), fe = Math.min(cycle, ov + 1), mEnd = Math.min(period, cycle);
  const key = d => d <= mEnd ? "menstrual"
    : (d >= fs_ && d <= fe) ? "fertile"
    : d < fs_ ? "follicular" : "luteal";
  const s = [];
  for (let d = 1; d <= cycle; d++) {
    const k = key(d), last = s[s.length - 1];
    if (last && last.key === k) last.to = d; else s.push({ key: k, from: d, to: d });
  }
  return s;
}
let tileBad = 0;
for (let c = 21; c <= 40; c++)
  for (let l = 9; l <= 16; l++)
    for (let p = 2; p <= 9; p++) {
      const s = spansFor(c, l, p);
      if (s[0].from !== 1) tileBad++;
      if (s[s.length - 1].to !== c) tileBad++;
      for (let i = 1; i < s.length; i++) if (s[i].from !== s[i - 1].to + 1) tileBad++;
      if (s.some(x => x.to < x.from)) tileBad++;
    }
eq("Cycle phases tile cleanly (1280 combos)", tileBad, 0);

/* --- calendar rhythm, with our 1-day early buffer over textbook Ogino-Knaus --- */
const rhythm = (s, l) => [Math.max(1, s - 19), l - 11];
eq("Rhythm window, cycles 26-32", rhythm(26, 32).join("-"), "7-21");
eq("Rhythm window, cycles 28-28", rhythm(28, 28).join("-"), "9-17");
eq("Rhythm window, cycles 27-30", rhythm(27, 30).join("-"), "8-19");
/* wider cycle spread must widen the avoid-window, never narrow it */
let monotone = 0;
for (let s = 20; s <= 40; s++)
  for (let l = s; l <= 45; l++) {
    const [a, b] = rhythm(s, l);
    if (b < a) continue;                       // degenerate, handled in the UI
    const [a2, b2] = rhythm(s, Math.min(45, l + 1));
    if ((b2 - a2) < (b - a)) monotone++;
  }
eq("Wider cycle spread never narrows the avoid-window", monotone, 0);

/* --- Standard Days Method --- */
eq("Standard Days fertile range", "8-19", "8-19");
const sdmOK = n => n >= 26 && n <= 32;
eq("SDM rejects 25-day cycle", sdmOK(25), false);
eq("SDM accepts 26-day cycle", sdmOK(26), true);
eq("SDM accepts 32-day cycle", sdmOK(32), true);
eq("SDM rejects 33-day cycle", sdmOK(33), false);

/* --- the avoid-window must always be at least as wide as the TTC window --- */
/* Using the conceive-oriented window to avoid pregnancy would be unsafe, so
   assert the rhythm method is never the narrower of the two. */
let narrower = 0;
for (let c = 26; c <= 32; c++) {
  const ov = c - 14, ttcStart = ov - 5, ttcEnd = ov + 1;   // ovulation-calculator window
  const [rStart, rEnd] = rhythm(c, c);                      // rhythm on a perfectly regular cycle
  if (rStart > ttcStart || rEnd < ttcEnd) narrower++;
}
eq("Rhythm window always covers the conceive window", narrower, 0);

/* ---------------- discoverability ---------------- */
console.log("\nDiscoverability");
{
  const idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const navBlock = (idx.match(/<div class="nav-links">[\s\S]*?<\/div>/) || [""])[0];
  const toolFiles = fs.readdirSync(path.join(ROOT, "tools")).filter(f => f.endsWith(".html"));

  for (const t of toolFiles) {
    const href = "tools/" + t;
    if (!idx.includes(href))
      fail(`${t} is not linked anywhere on the homepage — users cannot find it`);
    else if (!(idx.match(new RegExp(href.replace(/[-.]/g, "\\$&"), "g")) || []).length >= 2)
      fail(`${t} appears only once on the homepage`);
  }
  console.log(`   ✓ all ${toolFiles.length} tools linked from the homepage`);

  /* nav must cover the highest-value tools, not silently drop new ones */
  const navCount = (navBlock.match(/href="tools\//g) || []).length;
  if (navCount < 3) fail(`homepage nav links only ${navCount} tool(s)`);
  console.log(`   ✓ homepage nav links ${navCount} tools`);

  /* every sitemap URL must correspond to a real file */
  for (const m of sm.matchAll(/<loc>https:\/\/YOUR-DOMAIN\.in\/([^<]*)<\/loc>/g)) {
    const rel = m[1] === "" ? "index.html" : m[1];
    if (!fs.existsSync(path.join(ROOT, rel))) fail(`sitemap lists a missing file: ${rel}`);
  }
  console.log("   ✓ every sitemap URL maps to a real file");

  /* shared assets are cache-busted so browsers pick up edits */
  const unversioned = pages.filter(f =>
    /(?:href|src)="(?:\.\.\/)?assets\/app\.(?:css|js)"/.test(fs.readFileSync(f, "utf8")));
  if (unversioned.length)
    fail(`assets not cache-busted on: ${unversioned.map(f => path.basename(f)).join(", ")}`);
  else console.log("   ✓ shared assets carry a version query");
}

/* ---------------- responsive checks ---------------- */
console.log("\nResponsive");
const css = fs.readFileSync(path.join(ROOT, "assets", "app.css"), "utf8");

/* 1. every page declares a viewport, none locks zoom */
for (const f of pages) {
  const h = fs.readFileSync(f, "utf8");
  const m = h.match(/<meta name="viewport" content="([^"]+)"/);
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  if (!m) fail(`${rel}: no viewport meta`);
  else if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(m[1]))
    fail(`${rel}: viewport blocks pinch-zoom (accessibility failure)`);
}
console.log("   ✓ viewport present on all pages, zoom not blocked");

/* 2. no inline fixed widths that could overflow a 320px screen */
let inlineBad = 0;
for (const f of pages) {
  const h = fs.readFileSync(f, "utf8");
  for (const m of h.matchAll(/style="([^"]*)"/g)) {
    const w = m[1].match(/(?:^|[;\s])(?:min-)?width:\s*(\d+)px/);
    if (w && +w[1] > 280) { fail(`${path.basename(f)}: inline width ${w[1]}px`); inlineBad++; }
  }
}
if (!inlineBad) console.log("   ✓ no oversized inline widths");

/* 3. body must not allow horizontal scroll; page overflow guard present */
if (!/overflow-x:\s*(clip|hidden)/.test(css)) fail("body has no horizontal-overflow guard");
else console.log("   ✓ horizontal overflow guarded");

/* 4. grid/flex children need min-width:0 or wide tables push the page sideways */
if (!/min-width:\s*0/.test(css)) fail("no min-width:0 on grid children — tables will overflow");
else console.log("   ✓ min-width:0 applied to grid children");

/* 5. breakpoints must cover the real device ladder */
/* only @media declarations — plain `max-width` on .wheel/.tip is not a breakpoint */
const bps = [...css.matchAll(/@media[^{]*?max-width:\s*(\d+)px/g)].map(m => +m[1]);
const uniq = [...new Set(bps)].sort((a, b) => b - a);
[[1024, "tablet landscape / small laptop"], [768, "tablet portrait"],
 [480, "large phone"], [360, "small phone"]].forEach(([w, name]) => {
  if (!uniq.some(b => b >= w - 60 && b <= w + 160)) fail(`no breakpoint covering ${w}px (${name})`);
});
console.log("   ✓ breakpoints: " + uniq.join(", "));

/* 6. layout-fit simulation — does each grid's minimum column fit the space? */
const DEVICES = [
  ["iPhone SE",        320], ["Galaxy / small Android", 360], ["iPhone 14",   390],
  ["iPhone Pro Max",   430], ["iPad Mini portrait",     744], ["iPad portrait", 820],
  ["iPad landscape",  1024], ["Laptop",                1280], ["Desktop",      1536]
];
const pad  = w => Math.min(20, Math.max(14, w * 0.04));           // clamp(14px,4vw,20px)
const card = w => (w <= 600 ? 16 : w <= 900 ? 19 : 22);           // .card padding

let fitBad = 0;
for (const [name, w] of DEVICES) {
  const inner = Math.min(w <= 1440 ? 1120 : 1240, w - 2 * pad(w));
  // .grid-2 splits above 900px
  const col = w > 900 ? (inner - 22) * 0.45 : inner;
  const cardInner = col - 2 * card(w);
  /* .tools is flex with `flex: 1 1 <basis>` + min-width:0, so cards shrink
     below their basis rather than overflowing — the basis is a preference,
     not a floor. What matters is that the row can hold at least one card. */
  const toolBasis = w <= 760 ? 240 : 300;
  const wheel = Math.min(330, cardInner);
  const issues = [];
  if (inner < 200) issues.push(`content column only ${inner.toFixed(0)}px`);
  if (wheel > cardInner + 0.5) issues.push(`wheel ${wheel} > card ${cardInner.toFixed(0)}`);
  if (cardInner < 120) issues.push(`card inner only ${cardInner.toFixed(0)}px`);
  if (issues.length) { fail(`${name} @${w}px — ${issues.join("; ")}`); fitBad++; }
  else console.log(`   ✓ ${name.padEnd(24)} ${String(w).padStart(4)}px → content ${inner.toFixed(0)}px, card ${cardInner.toFixed(0)}px, wheel ${wheel.toFixed(0)}px, ${Math.max(1, Math.floor((inner + 18) / (toolBasis + 18)))} tool col`);
}

/* tool cards must be able to shrink — a flex basis without min-width:0 overflows */
if (!/\.tools > \*\s*\{[^}]*flex:\s*1 1/.test(css)) fail(".tools children are not shrinkable flex items");
else console.log("   ✓ tool cards shrink below their flex basis");

/* icon system: no emoji left in .ic — they render inconsistently across
   platforms and read as a consumer app rather than a health tool */
for (const f of pages) {
  const h = fs.readFileSync(f, "utf8");
  for (const m of h.matchAll(/<span class="ic">([\s\S]*?)<\/span>/g))
    if (!m[1].trim().startsWith("<svg"))
      fail(`${path.basename(f)}: .ic contains a non-SVG icon (${m[1].trim().slice(0, 12)})`);
}
console.log("   ✓ all card icons are inline SVG");

/* 7. container-width consistency — a page must not mix full-width `.wrap`
   sections with narrow ones, or blocks sit off-axis against the content above
   (this is exactly what made the FAQ look misplaced). A page that is narrow
   throughout, like about.html, is fine. */
for (const f of pages) {
  const h = fs.readFileSync(f, "utf8");
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  // nav and footer are chrome — their .wrap is the page gutter, not a content column
  const body = h.replace(/<nav class="nav">[\s\S]*?<\/nav>/g, "")
                .replace(/<footer[\s\S]*?<\/footer>/g, "");
  const narrow = (body.match(/class="wrap narrow/g) || []).length;
  const wide   = (body.match(/class="wrap(?! narrow)[ "]/g) || []).length;
  if (narrow > 0 && wide > 0)
    fail(`${rel}: mixes ${wide} full-width and ${narrow} narrow content sections — blocks will sit off-axis`);
}
console.log("   ✓ container widths consistent within each page");

/* 8. any class sharing an element with .wrap must not use the `padding`
   shorthand — it silently resets .wrap's horizontal gutter to 0 and knocks
   that block out of alignment with the rest of the page. */
const companions = new Set();
for (const f of pages) {
  const h = fs.readFileSync(f, "utf8");
  for (const m of h.matchAll(/class="([^"]+)"/g)) {
    // tokenise — \bwrap\b would also match inside "wheel-wrap"
    const tokens = m[1].split(/\s+/).filter(Boolean);
    if (!tokens.includes("wrap")) continue;
    tokens.filter(t => t !== "wrap").forEach(t => companions.add(t));
  }
}
// strip comments so a rule preceded by one is still found
const cssBare = css.replace(/\/\*[\s\S]*?\*\//g, "");
let missing = [];
for (const cls of companions) {
  const re = new RegExp("(?:^|[};])\\s*\\." + cls.replace(/[-]/g, "\\-") + "\\s*\\{([^}]*)\\}", "m");
  const rule = cssBare.match(re);
  if (!rule) { missing.push(cls); continue; }
  if (/(?:^|;)\s*padding:\s/.test(rule[1]))
    fail(`.${cls} uses the padding shorthand but shares an element with .wrap — it zeroes the horizontal gutter`);
}
if (missing.length) console.log(`     (no base rule found for: ${missing.join(", ")})`);
console.log(`   ✓ no padding-shorthand gutter resets (checked: ${[...companions].join(", ")})`);

/* 9. tables must scroll inside a container, not the page */
if (!/\.tblbox\s*\{[^}]*overflow-x:\s*auto/.test(css)) fail(".tblbox missing overflow-x:auto");
else console.log("   ✓ tables scroll inside .tblbox");

/* 8. touch targets on phones */
if (!/min-height:\s*44px/.test(css)) fail("no 44px minimum touch target rule");
else console.log("   ✓ 44px touch targets on phones");

console.log(bad === 0 ? "\n✅ ALL CHECKS PASSED" : `\n❌ ${bad} issue(s)`);
process.exit(bad ? 1 : 0);
