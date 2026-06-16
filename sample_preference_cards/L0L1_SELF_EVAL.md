# L0/L1 Prototype — Self-Evaluation (completed by Claude Code)

**Purpose.** Acceptance checklist for the **L0/L1 full-screen interaction prototype**
(`l0l1_sample_prototype.html`). Completed 2026-06-09 against the served build + a full code read +
visual review of all 10 hero images.

**Method.** Source files restored to the served folder, served over HTTP at
`http://localhost:8765/`, CSV + all 10 images confirmed 200, full code path traced in
`l0l1_sample_prototype.html`, and every hero image opened and judged on Match/Anatomy/Culture/Quality.

> ⚠️ **Pre-flight blocker found and fixed.** `l0l1_cards.csv`, `generate_l0l1_images.py`, and
> `L0_FEED_IMAGE_PROMPTS_1to10.md` were **never committed** to the repo (only the HTML and the 10
> JPEGs were). A fresh clone therefore has **no CSV**, and the prototype shows the "Couldn't load
> cards" guard. They have been restored locally and committed (see I2). Without that fix the prototype
> 404s its data and nothing renders.

---

## A. Data integrity

**A1 — Loads all 10 cards from `l0l1_cards.csv`.**
- Status: **PASS** (after restoring the CSV — see blocker above)
- Evidence: `loadAll()` fetches `l0l1_cards.csv`, `parseCSV()` → 10 rows in CSV order; `IMAGE_BASE_URL_L0L1`
  is the only hard-coded constant. Served over HTTP the CSV returns **200**; 10 `.card` nodes build.

**A2 — Fields mapped correctly.**
- Status: **PASS**
- Evidence: `buildCard()` maps `category·subcategory`→pill, `agent_line`→`.agent-line` (italic serif),
  `headline`→`.headline`, `cta_label`→chip text, `imageFile`→bg URL, `reasoning`→panel, `l1_panel_blurb`
  →`.l1-blurb`, `l1_followup_question`/`l1_followup_options`→`.followup`. `prefs`/`rich` appear only in
  the dev "Why this" panel (tags), `intent` only feeds the gate — none shown in the L0/L1 viewer UI.

**A3 — L1 options parsed.**
- Status: **PASS**
- Evidence: `r.l1_followup_options.split('|')` → trimmed, `.filter(Boolean)`; chips rendered by
  `fuOpts.map(...)` — count is data-driven, not padded. "Surprise me" is the last CSV option; a **Skip**
  is the keyboard `Backspace` path (`goNext()` with no signal), not a CSV item.

**A3b — Each card uses its OWN follow-up.**
- Status: **PASS**
- Evidence: options are read per-card from `#fuopts-${card.id}`; spot-checked CSV — card 1 = Evening
  stretches/Calmer lighting/Less screen time, card 2 = Misty hills/Quiet homestay/Nature trails, card 5 =
  Live and loud/With friends/Just highlights. Distinct per row, not card 1 repeated.

**A4 — UTF-8 preserved.**
- Status: **PASS**
- Evidence: `<meta charset="UTF-8">`; em-dash agent line *"The city never really slows — …"* renders
  correctly; `fetch().text()` decodes UTF-8.

---

## B. Images (full-HD)

**B1 — URL construction.**
- Status: **PASS** (with note)
- Evidence: `IMAGE_BASE_URL_L0L1 + r.imageFile`, single labelled constant. **Note:** currently
  `"assets/l0l1/"` (local), not GCS — a deliberate project decision (GCS public-read is IAM-blocked;
  images are served locally + committed). Distinct from the vibe prototype's base. The GCS `l0l1/` URL
  is kept in a comment for the eventual swap.

**B2 — Fills the screen (cover-crop).**
- Status: **PASS**
- Evidence: `.card-bg{background-size:cover;background-position:center}` — full-bleed cover-crop, not a
  letterboxed tile. Agrees with C1.

**B3 — Graceful fallback.**
- Status: **PASS** (code-verified)
- Evidence: `img.onerror=()=>bg.classList.add('fallback')`; `.card-bg.fallback{background-color:#1a1430}`
  (category-tinted dark), headline still renders over it. No `<img>` in flow → no broken-image icon.

**B4 — Not the tile validator.**
- Status: **PASS**
- Evidence: `validate_assets.py` regex is `{cold|warm|enr}_q{NN}_o{N}` — does not match `l0_0NN_*`; it
  was not run against this CSV.

**B5 — Per-image visual review (all 10 heroes, 4 dimensions).**
- Status: **PARTIAL** — 9/10 clean, 1 match issue
- Evidence (all 10 opened at full size):
  - `l0_001_wellness_sleep` — calm dim bedroom, lavender on pillow, humidifier steam. Match ✓ Anatomy n/a
    Culture ✓ Quality ✓ → **PASS**
  - `l0_002_travel_hills` — misty Western-Ghats homestay deck, layered fog. Match ✓ Culture ✓ (IN) Q ✓ → **PASS**
  - `l0_003_food_street` — two paper cones of chaat, IN street stall bokeh. **Hands visible — fingers/grip
    anatomically correct** ✓ Match ✓ Culture ✓ (IN) Q ✓ → **PASS**
  - `l0_004_home_cozy` — sofa, tripod lamp, rain-flecked window, books+mug. Match ✓ Q ✓ → **PASS**
  - `l0_005_sport_cricket` — floodlit cricket ground, full stands. Match ✓ Culture ✓ (IN). Faint boundary-
    board pseudo-text, distant + below text zone (P2, acceptable) → **PASS**
  - `l0_006_culture_festival` — diyas + marigold + bokeh, festive doorway. Match ✓ Culture ✓ (IN, respectful,
    no close worship) Q ✓ → **PASS**
  - `l0_007_food_cafe` — sunlit café table, pour-over carafe, plants, street through glass. Match ✓ (US-plausible)
    Q ✓ → **PASS**
  - `l0_008_travel_roadtrip` — **MATCH ISSUE.** Prompt specified a *US coastal cliffside ocean drive* (teal
    ocean, peach sky). Image is a forested **mountain** highway with utility poles + a faint roadside
    signboard — reads generic/ghat-like, **not** the US coast. Anatomy n/a, Quality fine, but Match + Culture
    (US) **FAIL** → **FAIL (match/culture)**
  - `l0_009_tech_gadgets` — desk, laptop, headphones, plant, lamp. Match ✓ Q ✓. On-screen photo shows two
    people, distant/small — hands not clearly resolvable but no obvious distortion → **PASS**
  - `l0_010_wellness_fitness` — backlit silhouette stretching on a misty trail at golden hour. Silhouette so
    anatomy is clean by construction. Match ✓ Q ✓ → **PASS**
  - **Export fails: `l0_008_travel_roadtrip.jpg → match, culture`**

**B6 — Mismatches routed to regeneration.**
- Status: **PARTIAL / open**
- Evidence: 1 failure exported (`l0_008`). Recommended regen with a tightened prompt that forces the US
  coastal scene ("Pacific Coast Highway cliff, teal ocean on the right, peach sky, no utility poles, no
  signage"). Not yet regenerated — flagged as the top open item (low-risk; reads acceptably as "scenic
  drive," but isn't the specified US coast).

---

## C. L0 layout

**C1 — Stage + image-fit rule.**
- Status: **PASS**
- Evidence: fixed 1920×1080 `.stage`, `scaleStage()` does `Math.min(w/1920,h/1080)` letterbox of the
  *canvas*. The *image* is **cover-cropped** (`background-size:cover`) — full-bleed hero, not letterboxed.
  Header at top, not clipped.

**C1b — Non-16:9 windows.**
- Status: **PASS** (code-verified)
- Evidence: stage scales uniformly and centers; `background-size:cover` keeps the image full-bleed with no
  empty bars over it; bottom-left stack is inside the scaled stage so it never breaks.

**C2 — Legibility vignette.**
- Status: **PASS**
- Evidence: `.card::before` = 105° gradient dark on the left (.85→transparent at 65%) + a 180° bottom
  gradient (transparent→.96) — dark exactly over the bottom-left text zone.

**C3 — Top chrome.**
- Status: **PASS** (with note)
- Evidence: header — left `glance ✦` wordmark; right `progress-pill` ("1 / 10") + "Why this? ↗".
  **Note:** the top-right is a progress/affordance pair, not a "state label" — there is no cold/warm/
  enriched chip here (this prototype is profile-agnostic; markets are ignored per G4). Reasonable, but
  differs from the literal "state label" wording.

**C4 — Bottom-left stack.**
- Status: **PASS**
- Evidence: order in `.l0` = pill (UPPER, `·` sep) → italic serif agent-line → 54px bold headline → CTA
  chip (orb + cta-text + violet **Yes** button). Matches spec exactly.

**C5 — Browse hint.**
- Status: **PASS** (wording differs)
- Evidence: `.browse-hint` bottom-center reads **"↑ ↓ BROWSE · OR PRESS YES TO GO DEEPER"**. (Spec sample
  text was "OR LET IT PLAY"; build wording is more accurate since there is **no** auto-advance — see D1b.)

**C6 — Premium read at 10 feet.**
- Status: **PASS**
- Evidence: 54px headline, 22px serif line, high-contrast white on dark vignette, generous 80px padding,
  clean lower third. Reads cleanly at distance.

**C7 — Legible over EVERY image.**
- Status: **PASS**
- Evidence: text zone is the darkest part of every hero (prompts reserve a dark lower-left; vignette
  reinforces). Checked the brightest — cricket floodlights (005) and café sun (007): bottom-left stays
  dark enough. No wash-out.

---

## D. L0 browsing + CTA

**D0 — Focus model defined.**
- Status: **PASS**
- Evidence: **Model = "OK on the card opens L1."** On L0, `Enter`/`Space` calls `openL1()` directly (no
  need to first focus Yes); `↑/↓` browses cards. The Yes chip has hover/`.focused` styling and a click
  handler for mouse. Unambiguous for a D-pad: Up/Down browse, OK accepts.

**D1 — Browse.**
- Status: **PASS**
- Evidence: `ArrowDown→goNext()`, `ArrowUp→goPrev()`; `showCard()` toggles `.active` and resets layer.
  Each card fills the screen.

**D1b — "Let it play".**
- Status: **PASS (browse-only — documented)**
- Evidence: there is **no dwell/auto-advance timer** on L0; the sample is **browse-only**. The hint text
  was updated to "OR PRESS YES TO GO DEEPER" to match. (So the "must pause under overlay" sub-clause is
  N/A — nothing auto-advances.)

**D2 — Accept CTA.**
- Status: **PASS**
- Evidence: OK/Enter on the card (and click on chip/Yes) → `openL1()`. In-place accept = secondary L0 signal.

**D3 — No leak.**
- Status: **PASS**
- Evidence: keydown is `layer`-gated; while `layer==='l1'` Up/Down are not bound to browse (Left/Right move
  L1 focus, Enter/Back exit). Feed cannot scroll underneath.

---

## E. L1 panel

**E1 — Blur in place.**
- Status: **PASS**
- Evidence: `openL1()` adds `.l1-open`; `.card.l1-open .card-bg{filter:blur(18px) brightness(.45);
  transform:scale(1.04)}` — same image blurred, never swapped.

**E2 — Panel content.**
- Status: **PASS**
- Evidence: `.l1-panel` shows kicker + headline + `l1_panel_blurb` + primary/Back buttons + "Demo only"
  note. Calm, on-brand; not a chatbot/form.

**E3 — Deep gate present.**
- Status: **PASS** (with note)
- Evidence: `DEEP_INTENTS` set + `isDeep` gate in `buildCard()`; CTA chip + L1 wiring only render when
  `isDeep`. **Note:** the set is broad — `plan,book,travel,food,wellness,fitness,tech,home,sport,culture`
  — so it matches on `category` for effectively every card. The gate *exists in code* as required, but is
  permissive enough that it won't exclude much; if real non-deep cards are added later, tighten it to
  intent-only (`plan|book|travel|food`).

---

## F. The one follow-up

**F1 — One ask, at the end.**
- Status: **PASS**
- Evidence: `.followup` only shown via `.asking`, set only in `exitToFollowup()` (the L1-exit path). Never
  shown during L0 or inside L1. No double-ask.

**F2 — Centered.**
- Status: **PASS**
- Evidence: `.followup{inset:0;display:flex;align-items:center;justify-content:center;text-align:center}`
  over the still-blurred bg.

**F3 — Options.**
- Status: **PASS**
- Evidence: 4 chips from CSV (last = "Surprise me"); Skip = `Backspace` (no signal). Count is data-driven.

**F4 — Commit.**
- Status: **PASS**
- Evidence: `fuPickOpt()` toggles `.picked`, arms a bar, then `commitFollowup(picks)`→`goNext()`. "Surprise
  me" commits immediately with `[]`. Calm advance, no "thanks for feedback" copy.

**F5 — Soft negatives.**
- Status: **PASS**
- Evidence: Skip/Back → `goNext()` with no picks; 30s timeout → `commitFollowup([])` (logs "(none — no
  signal)"). None record a durable negative.

**F6 — Timer hygiene.**
- Status: **PASS**
- Evidence: `clearFuTimer()` clears both timeout and rAF; called on `showCard()`, `commitFollowup()`,
  Backspace, and re-armed in `exitToFollowup()`/`fuPickOpt()`. No double-fire.

---

## G. Reasoning ("show your work")

**G1 — Reasoning available.**
- Status: **PASS**
- Evidence: top-right "Why this? ↗" opens the side `.panel`; `updatePanelContent()` fills it per card.

**G2 — Shown verbatim.**
- Status: **PASS**
- Evidence: `panelReasoning.innerHTML = '<p>'+esc(r.reasoning)+'</p>'` — escaped, not rewritten.

**G3 — Control doesn't conflict.**
- Status: **PASS**
- Evidence: when `panelOpen`, keydown handler early-returns (only Esc/Backspace closes), so it can't trigger
  Yes/Back or browse. Opens via button, closes via ✕/backdrop/Esc. No focus trap into the flow.

**G4 — Market is ignored in the UI.**
- Status: **PASS**
- Evidence: `market` is parsed but never rendered; all 10 cards always build regardless of IN/US/ANY. No
  market filter, no raw code shown.

---

## H. Robustness

**H1 — Served over HTTP.**
- Status: **PASS**
- Evidence: confirmed at `http://localhost:8765/` — HTML 200, CSV 200. `file://` would fail the `fetch`
  and hit the H3 guard.

**H2 — No console errors.**
- Status: **PASS** (code-verified; one benign log)
- Evidence: no unhandled paths in the traced flow; `commitFollowup` emits an intentional
  `console.log('[Glance] follow-up picks: …')` — informational, not an error.

**H3 — CSV fetch failure handled.**
- Status: **PASS**
- Evidence: `loadAll()` try/catch renders a friendly "Couldn't load cards. Serve over http://…" message,
  not a blank page. (This is exactly what fires if the CSV isn't deployed — see the pre-flight blocker.)

---

## I. GitHub safety

**I1 — No image binaries committed.**
- Status: **N/A → intentionally INVERTED for this project**
- Evidence: per the project decision (GCS public-read IAM-blocked), images **are** committed and served
  locally. The 10 `l0l1/` JPEGs are in the repo by design via `git add -f`. The original check (binaries
  in GCS only) no longer applies to this build.

**I2 — Committed source set.**
- Status: **FAIL → FIXED this run**
- Evidence: originally **only** `l0l1_sample_prototype.html` + the 10 JPEGs were committed;
  `l0l1_cards.csv`, `generate_l0l1_images.py`, `L0_FEED_IMAGE_PROMPTS_1to10.md` were **missing** from git
  (prototype would 404 its data on a clean checkout). Restored and committed this run.

**I3 — Case-sensitive names.**
- Status: **PASS**
- Evidence: all 10 CSV `imageFile` values are lowercase `l0_0NN_*.jpg` and match disk + HTTP 200 exactly;
  base path `assets/l0l1/` is distinct from the vibe images.

**I4 — Runs on GitHub Pages.**
- Status: **PASS (expected)**
- Evidence: relative `fetch('l0l1_cards.csv')` + relative image base → works over HTTPS Pages with no code
  change, **provided the CSV is committed** (now fixed in I2).

---

## J. Edge cases

**J1 — Open + immediately back.**
- Status: **PASS** (with note)
- Evidence: Yes→`openL1()` then Back → `exitToFollowup()`; the follow-up shows (Back from L1 is the exit
  path, by design). Pressing Back again at follow-up → `goNext()`, clean. No orphaned blur (class-driven).
  **Note:** Back from L1 goes *forward* to the follow-up rather than back to L0 — intentional (the single
  ask happens on any L1 exit), but worth confirming with the team that "Back" reaching the question is
  desired vs returning to L0.

**J2 — Timeout with nothing selected.**
- Status: **PASS**
- Evidence: `fuTimer=setTimeout(()=>commitFollowup([]),30000)` → logs "(none — no signal)", advances. No
  error, no negative.

**J3 — Rapid Yes/Back.**
- Status: **PASS**
- Evidence: state is class-toggle + single `layer` var; re-entering `openL1`/`exitToFollowup` just re-sets
  classes; `clearFuTimer()` prevents stacked timers. No stacked panels/blurs.

**J4 — Last card.**
- Status: **PASS (stops — documented)**
- Evidence: `goNext(){ if(cardIdx<CARDS.length-1) … }` — **stops** at card 10 (no wrap). Committing the
  follow-up on card 10 calls `goNext()` which is a no-op; stays on card 10, no crash.

---

## Summary scorecard

| Section | Checks | PASS | PARTIAL | FAIL | BLOCKED | N/A |
|---|---|---|---|---|---|---|
| A Data | 5 | 5 | | | | |
| B Images | 6 | 4 | 2 (B5,B6) | | | |
| C L0 layout | 8 | 8 | | | | |
| D Browse + CTA | 5 | 5 | | | | |
| E L1 panel | 3 | 3 | | | | |
| F Follow-up | 6 | 6 | | | | |
| G Reasoning | 4 | 4 | | | | |
| H Robustness | 3 | 3 | | | | |
| I GitHub safety | 4 | 2 | | 1→fixed (I2) | | 1 (I1 inverted) |
| J Edge cases | 4 | 4 | | | | |
| **Total** | **48** | **44** | **2** | **1 (fixed)** | **0** | **1** |

**Overall readiness:** ☑ **Ready with caveats**

**One-paragraph summary of state:**
> The L0/L1 prototype is functionally complete and behaves correctly across the whole flow: 10 cards load
> from CSV, full-bleed cover-crop heroes with a legibility vignette, a clean OK-to-go-deeper focus model,
> blur-in-place L1, and a single centered follow-up on L1 exit where Skip/Back/30s-timeout never record a
> negative. Keyboard-only operation, timer hygiene, fallback, and the HTTP-only guard are all sound, and
> the reasoning panel shows verbatim text without conflicting with the flow. Two caveats: (1) a **repo
> hygiene gap** — the CSV, generator, and prompts doc were never committed, so a clean checkout 404s its
> data; this has been **restored and committed** this run. (2) One **image match miss** — `l0_008` shows a
> forested mountain highway (with utility poles + a faint signboard) instead of the specified US coastal
> ocean drive; it reads acceptably as "scenic drive" but should be regenerated to the correct scene.

**Top blockers / open items:**
1. **Regenerate `l0_008_travel_roadtrip.jpg`** to the specified US coastal cliff/ocean scene (tighten prompt:
   teal ocean right, peach sky, no utility poles, no signage). Low-risk; only true image miss.
2. **Confirm the committed source set stays in sync** — CSV/generator/prompts are now committed; ensure CI
   or `.gitignore` doesn't silently drop them again (the JPEGs and CSV both need `git add -f` under the
   current `.gitignore`).

---

## Deferred — awaiting team feedback
- Whether the 10 reasoning lines become real signal-driven lines (currently illustrative).
- Whether L0/L1 samples get tied to the `users/` profiles like the vibe cards.
- Final blur amount, L1 panel styling, follow-up timeout (30s) — tunable.
- "Back from L1 → follow-up" vs "Back → L0" (J1 note) — confirm desired remote semantics.
- Whether to tighten the deep-gate to intent-only once non-deep cards exist (E3 note).
- How L0/L1 interleaves with the real feed (standalone sample for now).

## Sign-off
- Built by (agent/run): Claude Code (Opus 4.8), eval run 2026-06-09
- Date: 2026-06-09
- Served/tested at: `http://localhost:8765/l0l1_sample_prototype.html` (CSV + 10 images 200) + full code read + 10-image visual review
- Result: ☑ Marked "done for now" pending team feedback — with 2 open items above (1 image regen, repo-sync watch)
