/* ============================================================
   Bloom — shared runtime
   ============================================================ */

/* ---------- theme ---------- */
(function () {
  const saved = localStorage.getItem("bloom-theme");
  const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
})();

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("bloom-theme", next);
  paintThemeBtn();
  document.dispatchEvent(new Event("themechange"));
}
function paintThemeBtn() {
  const b = document.getElementById("themeBtn");
  if (b) b.textContent = document.documentElement.dataset.theme === "dark" ? "☀" : "☾";
}

/* ---------- dates ---------- */
const MS_DAY = 86400000;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v + "T00:00:00");
  return isNaN(d) ? null : d;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmt(d, style) {
  if (!d) return "–";
  if (style === "long")  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (style === "short") return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
}
function today() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function daysBetween(a, b) { return Math.round((b - a) / MS_DAY); }
function toISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

/* ---------- ui helpers ---------- */
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("on"), 2400);
}

function share(kind) {
  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(document.title);
  if (kind === "copy") {
    navigator.clipboard.writeText(location.href).then(() => toast("Link copied")).catch(() => toast("Copy failed"));
    return;
  }
  const m = {
    wa: `https://wa.me/?text=${title}%20${url}`,
    tg: `https://t.me/share/url?url=${url}&text=${title}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${url}`
  };
  window.open(m[kind], "_blank", "noopener,width=620,height=560");
}

/* count-up on a hero figure */
function countUp(el, to, suffix) {
  const from = 0, dur = 750, t0 = performance.now();
  function step(t) {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * e) + (suffix || "");
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* reveal on scroll */
function initReveal() {
  const els = document.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en, i) => {
      if (en.isIntersecting) {
        setTimeout(() => en.target.classList.add("in"), i * 55);
        io.unobserve(en.target);
      }
    });
  }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(e => io.observe(e));
}

/* shared tooltip — used by the wheel and the bar chart */
const Tip = (() => {
  let el;
  function node() {
    if (!el) { el = document.createElement("div"); el.className = "tip"; document.body.appendChild(el); }
    return el;
  }
  return {
    show(html, x, y) {
      const n = node();
      n.innerHTML = html;
      n.classList.add("on");
      const r = n.getBoundingClientRect();
      let left = x - r.width / 2;
      left = Math.max(8, Math.min(left, innerWidth - r.width - 8));
      let top = y - r.height - 14;
      if (top < 8) top = y + 18;
      n.style.left = left + "px";
      n.style.top = top + "px";
    },
    hide() { if (el) el.classList.remove("on"); }
  };
})();

/* attach hover+focus tooltips to any [data-tip] element */
function bindTips(root) {
  (root || document).querySelectorAll("[data-tip]").forEach(el => {
    if (el._tipBound) return;
    el._tipBound = true;
    const show = ev => {
      const r = el.getBoundingClientRect();
      const x = ev.clientX || (r.left + r.width / 2);
      const y = ev.clientY || r.top;
      Tip.show(el.dataset.tip, x, y);
    };
    el.addEventListener("mouseenter", show);
    el.addEventListener("mousemove", show);
    el.addEventListener("mouseleave", Tip.hide);
    el.addEventListener("focus", show);
    el.addEventListener("blur", Tip.hide);
  });
}

/* table-view toggle (the accessibility relief for sub-3:1 fills) */
function bindTableToggles() {
  document.querySelectorAll(".tbl-toggle").forEach(btn => {
    const box = document.getElementById(btn.dataset.target);
    if (!box) return;
    box.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      const open = box.hidden;
      box.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = (open ? "▾ Hide" : "▸ Show") + " data table";
    });
    btn.textContent = "▸ Show data table";
  });
}

/* remember the last inputs on a tool page */
function persist(ids, key) {
  const K = "bloom-" + key;
  try {
    const saved = JSON.parse(localStorage.getItem(K) || "{}");
    ids.forEach(id => { const el = document.getElementById(id); if (el && saved[id] != null) el.value = saved[id]; });
  } catch (e) { /* corrupt entry — ignore and overwrite on next change */ }
  const save = () => {
    const o = {};
    ids.forEach(id => { const el = document.getElementById(id); if (el) o[id] = el.value; });
    try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {}
  };
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener("change", save); });
}

/* svg arc path for donut segments */
function arcPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const rad = d => (d - 90) * Math.PI / 180;
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  const x1 = cx + rOuter * Math.cos(rad(startDeg)), y1 = cy + rOuter * Math.sin(rad(startDeg));
  const x2 = cx + rOuter * Math.cos(rad(endDeg)),   y2 = cy + rOuter * Math.sin(rad(endDeg));
  const x3 = cx + rInner * Math.cos(rad(endDeg)),   y3 = cy + rInner * Math.sin(rad(endDeg));
  const x4 = cx + rInner * Math.cos(rad(startDeg)), y4 = cy + rInner * Math.sin(rad(startDeg));
  return `M${x1} ${y1} A${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

document.addEventListener("DOMContentLoaded", () => {
  paintThemeBtn();
  const b = document.getElementById("themeBtn");
  if (b) b.addEventListener("click", toggleTheme);
  const y = document.getElementById("yr");
  if (y) y.textContent = new Date().getFullYear();
  initReveal();
  bindTableToggles();
});
