# Bloom — fertility & pregnancy calculators

Four interactive tools, static HTML/CSS/JS. No build step, no dependencies, no CDN.

```
fertility-site/
├── index.html                      Home — animated hero, tool grid
├── about.html                      Formulas, limits, privacy, contact
├── sitemap.xml  robots.txt
├── assets/
│   ├── app.css                     Design system, light + dark
│   └── app.js                      Theme, dates, tooltips, reveals, persistence
├── tools/
│   ├── ovulation-calculator.html   ← flagship: animated cycle wheel
│   ├── due-date-calculator.html    animated trimester timeline
│   ├── pregnancy-tracker.html      week 4–40, growth bar chart
│   └── period-tracker.html         multi-date log, variation chart
└── _check.js                       Validator (don't upload)
```

## Run it

```powershell
cd fertility-site
python -m http.server 8080
```

## About React

You mentioned React libraries. I built this in vanilla JS deliberately — but the *visual* language is the modern-React one: animated aurora mesh background, glassmorphic sticky nav, spring easing on every transition, scroll-reveal via IntersectionObserver, gradient text with an animated sweep, count-up transitions, and hand-built SVG charts.

The reason: React needs a bundler, which means a build step and a `dist/` folder to deploy. You've just spent two rounds untangling where files go. This deploys by dragging a folder — same as everything else you have. For four calculators, React would add tooling without adding capability.

## What's interactive

**Ovulation calculator** — an SVG cycle wheel that redraws live as you drag the sliders. Four phase arcs with a 2px gap between fills, direct labels inside wide wedges, a pointer marker for ovulation day, a ring marker for today, hover/focus tooltips on every element, and a legend plus expandable data table.

**Due date calculator** — five input methods (LMP, conception, day-3 IVF, day-5 IVF, known EDD). Animated trimester progress bar, the active trimester card lifts and highlights, and a milestone table that ticks off dates as you pass them.

**Week-by-week** — 37 weeks of size/weight/development data. Tappable bar chart doubles as the week selector. Enter a due date and it jumps to your current week. India-familiar size comparisons (rajma, jackfruit segment, musk melon) rather than only Western produce.

**Period tracker** — log any number of periods, get true average cycle, min–max range, a regularity verdict, and 12 predicted dates. If your cycles vary by more than 7 days it says so and warns the predictions are weak, rather than presenting a false precision.

All four remember your inputs in `localStorage`. Nothing is sent anywhere.

## Verified before handover

`node _check.js` — all pass:

- **Structure** — 6 pages, every internal link resolves, all JSON-LD parses, unique title (20–70 chars) / description / canonical / hreflang, exactly one `<h1>` each, every page in the sitemap
- **Medical safety** — every calculator page is checked for a disclaimer; every chart is checked for non-colour encoding
- **Maths** — 14 assertions against known values:
  - Naegele 1 Jan LMP → 8 Oct EDD; 32-day cycle shifts to 12 Oct
  - IVF day-5 → +261 days; day-3 → +263 days
  - Ovulation day 14 on a 28/14 cycle, day 21 on a 35/14 cycle
  - Fertile window ov−5 → ov+1; gestational age 158 days = 22w4d
  - **Cycle phases tile cleanly across all 1,280 slider combinations**
- **Geometry** — wheel arcs sum to exactly 360° in all 1,280 combinations, narrowest sweep 9.85° (the 2px gap never inverts), no NaN or out-of-viewBox coordinates

Two real bugs were caught and fixed by this: a long period on a short cycle produced an inverted phase span (rewritten as per-day labelling then run-length encoding), and three titles ran over 70 characters.

## Responsive behaviour

Breakpoints: **1440 / 1100 / 900 / 760 / 600 / 560 / 420**, plus phone-landscape, coarse-pointer and print.

| Width | What changes |
|---|---|
| ≥1440 | Container widens to 1240px, taller hero |
| 900–1440 | Two-column tool layout (inputs beside results) |
| ≤900 | Columns stack, padding tightens |
| ≤760 | Nav links become a **scrollable strip** rather than disappearing; tiles go 2-up; tool cards drop to 240px min |
| ≤600 | Full-width stacked CTAs, trimester cards become single-column rows, 44px touch targets, growth chart thins to 1.5px gaps |
| ≤420 | Brand text hides (mark only) to free nav space, tiles lock to 2×2, wheel labels scale up to stay legible in the smaller SVG |
| Landscape phone | Nav un-sticks, aurora disabled, vertical padding cut |

### Alignment fixes

**The `padding` shorthand was wiping the page gutter.** `.wrap` sets `padding: 0 clamp(14px,4vw,20px)`, but `.hero`, `.section` and `.thead` used the *shorthand* `padding: 40px 0 22px` — which resets left/right to `0`. Those rules come later in the file with equal specificity, so they won. The result: headings sat flush against the container edge while cards in plain `.wrap` sections were inset ~20px. All eleven such declarations now use `padding-block`.

**Cards didn't line up across the two columns.** Each side of `.grid-2` is a wrapper div holding its own cards, so the second card on the left had no relationship to the second card on the right. Both wrappers now use `grid-template-rows: subgrid` (behind `@supports`, with graceful fallback), so rows align across columns.

**The four stat tiles were ragged** because values wrap to different line counts ("29 Aug" vs "27 Aug – 29 Aug"). Tiles are now three bands — label top, value middle, meta pinned to the bottom with `margin-top: auto` — so all four labels and all four meta lines share a baseline no matter how the value wraps.

**FAQ block sat off-axis** — it was `max-width: 760px` centred under 1120px content. Now full-width, two columns above 860px.

Three real overflow bugs were found and fixed while doing this:

1. **Grid children had `min-width: auto`** — the default — which let the wide data tables push the entire page sideways on mobile. This is the most common cause of unwanted horizontal scroll and it was present on every tool page.
2. **The cycle wheel was sized in `vw`** (`min(280px, 84vw)`), which doesn't know about its card's padding. At 320px it computed to 268.8px inside a 260px card. Now container-relative: `width:100%; max-width:330px`.
3. **The period-tracker variation chart had an inline `height:110px`**, which overrode the mobile media query. Moved to a class.

`_check.js` simulates layout arithmetic across nine real device widths (320 → 1536) and asserts every grid's minimum column actually fits its container, rather than assuming it does.

## Colour accessibility

The chart palette is not decorative — it was computed. I ran the validator across all 70 four-hue subsets of a reference ramp in both light and dark mode; **only two passed all-pairs in both**. The chosen set is blue / yellow / magenta / green:

| | Light | Dark |
|---|---|---|
| Worst CVD pair ΔE | 13.0 | 6.9 |
| Worst normal-vision pair ΔE | 19.6 | 19.3 |

Dark-mode 6.9 sits in the 6–8 warn band, which is only legal with secondary encoding — so every chart ships direct labels, a legend **and** a data table. Ovulation is drawn as a pointer marker rather than a fifth colour, because five hues could not pass in both modes.

## Before you go live

1. **Buy a domain and replace `YOUR-DOMAIN.in`** — it appears in canonicals, hreflang, OG tags, JSON-LD, `sitemap.xml`, `robots.txt` and the contact email. One find-and-replace across the folder.
2. Upload the contents of `fertility-site/` to your web root (skip `_check.js` and this README).
3. Submit `sitemap.xml` in Google Search Console; Request Indexing on the four tool URLs.
4. Test one tool in Google's Rich Results Test — FAQ schema should be detected on all four.
5. Make a 1200×630 `og-cover.png` if you want social previews to carry an image.

## Honest caveats

- **I could not visually render these.** This environment has no browser or screenshot tool, so I verified structure, maths and SVG geometry programmatically — but I have not seen the pages. Open all four in a browser, in both light and dark mode, and at phone width before you publish. Expect small spacing tweaks.
- **Fetal size and weight are population averages** from standard growth references. They are labelled as averages throughout and every page says only your own scan means anything. Have a doctor or midwife review the week-by-week copy before you promote it — that is the page most likely to worry someone.
- **This is still YMYL.** Tools rank far better than health advice, but Google will assess trust signals. Add a named author with real credentials, a medical reviewer if you can get one, and keep `about.html` honest — it is doing real work for your E-E-A-T.
- **The safe-period disclaimer is load-bearing.** Every page states these tools are not contraception. Don't remove it to make the copy shorter, and don't add a "safe days to avoid pregnancy" mode — that is the one feature here that could cause real harm.
- **No Chinese gender predictor.** It was on my earlier list and I left it out: it would be the only tool on the site with no basis in anything, sitting next to five that are medically grounded. It would undermine the credibility of the rest for a bit of novelty traffic. Add it later if you want, but keep it clearly labelled as folklore.

## The fertility awareness (safe days) tool

I initially advised against building this. That was an over-correction — calendar-based fertility awareness is a recognised contraceptive approach, and omitting it doesn't protect anyone, it just sends them to a page that presents it worse. It is built, with these constraints:

- **Two real methods**, not an invention: calendar rhythm (Ogino–Knaus) and the Standard Days Method.
- **The failure rate is on the page, above the calculator** — 12–24 per 100 women per year, typical use, in a comparison table alongside condoms, the pill, the IUD and the implant.
- **It refuses to answer** when the method doesn't apply: cycle spread over 8 days, or a cycle outside 26–32 for Standard Days. It shows a blocking notice instead of a window.
- **No green band on the wheel.** Deliberate — nothing here is safe. Menstrual is magenta, higher-fertility is amber, lower-fertility is blue. The three-colour subset was re-validated all-pairs in both modes before use.
- **The `<h1>` never says "safe."** The `<title>` carries the searched phrase because that is what people type; the page itself is "Fertility Awareness Calendar."

### A safety bug the tests caught

The assertion `Rhythm window always covers the conceive window` failed on the first build, 7 cases out of 7. Textbook Ogino–Knaus uses `shortest − 18`, which starts **one day later** than the ovulation calculator's `ovulation − 5` fertile window — so the same site would have called a day fertile in one tool and lower-risk in the other, in the unsafe direction.

The calculator now uses `shortest − 19`. That deviation from the textbook formula is stated in the FAQ, in the FAQ schema, in `about.html`, and in a code comment — because an undocumented deviation is worse than the bug.

A related gap is disclosed rather than patched: on a 26–27 day cycle the Standard Days range (day 8) also starts a day later than rhythm. I did **not** widen it, because its published 5% perfect-use figure was measured on days 8–19 exactly and changing the range would make that number no longer apply. Instead the tool tells the user that rhythm is the more conservative choice for them.
