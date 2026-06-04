# VERIFICATION.md — prove it works, prove nothing broke, prove anyone can run it

**Branch:** `feat/preference-collection` · **Target:** `cold_start.html`
**Last run:** 2026-06-04 · **Commit at run:** see `git log -1` on the branch
**Environment caveat:** this run was performed **headless** (HTTP serve + JS parse + Node simulation of the engine). Items requiring a live browser (visual auto-play, console-red check, click-through) are marked **HEADLESS-VERIFIED — needs manual in-browser confirm**.

**How to read a result:** PASS / FAIL / N-A with evidence. On any FAIL, stop and fix.

---

## Part A — Our additions work

### A1. Vibe-question card (onboarding + periodic)
- [~] Onboarding shows **exactly one** vibe card — **HEADLESS-VERIFIED**: `init()` calls `placeOnboardingVibe()` which inserts one `.card.vibe-question` after the location step; no stepper ported. Needs in-browser confirm.
- [~] 2×3 tiles load real photos — **HEADLESS-VERIFIED**: all 59 referenced keys + dynamic vibe paths resolve on disk (66 referenced images, 0 missing); served images return 200. Needs in-browser visual confirm.
- [~] **Focus vs selected distinct** — code: `.vibe-tile.foc` (outline+shimmer) and `.vibe-tile.sel` (purple+check) are separate classes/states. Needs in-browser confirm.
- [~] **Multi-select** — `vibeToggle` adds/removes from a `Set`; multiple `sel` allowed. Needs in-browser confirm.
- [~] **Timing** — `vibeToggle` starts the 12s timer only when `!vibeState.timer` on first pick; deselect-all clears it. Lifted from infeed `pickOpt`. Needs in-browser confirm.
- [~] One vibe card after feed card 10, 20… never two in a row / first / last — **HEADLESS-VERIFIED**: `splicePeriodicVibes` math against 17 feed cards inserts after card 10 only; guards for back-to-back + never-last present; `INTERSTITIAL_EVERY=10`. Needs in-browser confirm at scale.
- [~] Gap-targeted — `pickVibeCard` sorts unseen pool by lowest accumulated rich-tag weight per axis; cold-start → vq01. Needs in-browser `INTERESTS` inspect.

### A2. Interaction follow-up (L0 → L1 → question)
- [~] Only deep cards open L1 — **HEADLESS-VERIFIED**: `isDeepCard` gates on `DEEP_INTENTS`/`data-deep`; of 17 feed cards, 9 deep / 8 quick-ack. Needs in-browser confirm.
- [~] L1 over **her blurred image, not swapped** — code: `#ixScrim` uses `card.dataset.image` with `backdrop-filter:blur`; image is the same card's. Needs in-browser visual confirm.
- [~] Asks **once on exit**, never interrupts L0 — both `ixActBtn` and `ixBackBtn` route to `ixToFollowup`; L0 CTA only opens L1. Needs in-browser confirm.
- [~] Like/Save on L0 = silent — her existing shop-product/like handlers untouched; no question wired to them. Needs in-browser confirm.
- [~] Options auto-derived from card tags — `deriveFollowupOpts` reads `card.dataset.prefs`, sorts by `TAG_RARITY`, most-distinctive first. Needs in-browser confirm.
- [~] Timeout/Back/no-selection = no durable negative — `ixCommit` only bumps positive tags from selected options; `diversify` emits none. Needs in-browser `INTERESTS` inspect.

### A3. Signals actually steer the feed (the core promise)
- [x] **PASS — pick travel/hills re-ranks feed.** Node simulation on real CSV: answering "Misty Coorg homestay" (`travel,hills,calm`, w=1.5) moved the Travel/Coorg card from outside the top 6 to **#1** in upcoming order.
- [x] **PASS — rich tags accumulate.** `bumpInterestTags` writes `cat:travel`/`region:hills`/`vibe:calm` into `INTERESTS`; confirmed inert in ranking (no card carries them → score 0), captured for gap-targeting.
- [x] **PASS — zero dead prefs tokens.** 60 options, 25 distinct prefs tokens, all present in live `content_bank_merged.csv`. (Evidence: precise extraction diff, 0 dead.)
- [x] **PASS — her `#prefAck` only.** Both `vibeCommit` and `ixCommit` call `showAckMulti` (her `#prefAck`); no second ack system (4 existing `showAck*`/`showUnderstand` only).

### A4. Copy & voice
- [x] **PASS** — no "feed updates instantly"/transactional language (grep 0); honest "Demo only — nothing will be booked" present on L1.
- [~] Sublines read as phrases — vibe sublines are phrases ("Coffee estates in the fog"). Needs human read.
- [~] Discovery-prompt CTA style — follow-up uses "Would you like more of this?" + "more X" options. Needs human read.

---

## Part B — Nothing she built is broken (regression)

### B1. Her feed still runs
- [~] Loads with **no console errors** — **HEADLESS-VERIFIED**: full inline JS passes `node --check` (zero syntax errors); served 200. **Needs manual devtools-console confirm (zero red).**
- [~] Auto-play advances at her dwell — `scheduleAuto`/`autoTimer` untouched for feed cards; vibe cards set `dwell=999999` and pause her timer. Needs in-browser confirm.
- [~] **↑/↓ navigate as baseline** — dispatcher's `feed` branch is byte-identical to her original `goNext(true)`/`goPrev()`. **Needs manual confirm.**
- [~] Her card types render — none of her card builders modified. Needs in-browser confirm.
- [~] Mascot travels to CTA — `launchToCTA` untouched. Needs in-browser confirm.
- [x] **PASS** — CSV loads / `injectFeed` runs (served 200; `splicePeriodicVibes` appended at end of `injectFeed`, additive).
- [~] Reasoning lines + CTAs per card — `personalize` untouched. Needs in-browser confirm.
- [N-A] E1/E2 switcher — cold_start has no enriched switcher.

### B2. One loop, one listener
- [x] **PASS — exactly one** `keydown` listener: `grep -c "addEventListener('keydown'"` = **1** (mode-routed dispatcher).
- [x] **PASS — exactly one** auto-advance loop: `function scheduleAuto` count = **1**; our 12s timer scoped to question cards only.
- [~] No stuck state — `vibeCommit`/`ixCommit` set `autoMode=true` + `goNext` + `setPrefMode('feed')`. Needs in-browser confirm.
- [~] Open pauses / close resumes — `showCard` clears `autoTimer` for vibe; `openL1` calls `pauseAuto`. Needs in-browser confirm.

### B3. No visual regressions / no foreign tokens
- [x] **PASS** — Playfair=0, Plus Jakarta=0, `var(--violet)` unprefixed=0. All new code uses her tokens + `--serif`.
- [~] Her cards pixel-identical — no her-card CSS modified (additive rules only). Needs spot-check vs screenshots.

### B4. Her data untouched
- [x] **PASS** — `git diff origin/main -- content_bank_merged.csv` = **0 lines**. Tags added via option mapping, not the bank.
- [x] **PASS** — her `content/images/` + `assets/` untouched; vibe images live only in new `content/images/vibe-cards/`.

---

## Part C — Repo is complete & anyone can run it

### C1. Everything committed
- [x] **PASS** — every referenced image exists: 66 referenced (static + dynamic vibe paths), **0 missing**.
- [ ] **PENDING PUSH** — vibe images committed under `content/images/vibe-cards/`; **not yet pushed to GitHub** (branch is local). Confirm folder on GitHub after push.
- [x] **PASS** — no absolute paths: `grep -E "/Users/|/tmp/|file:///"` = **0**.
- [ ] **PENDING** — `SIGNAL_TAXONOMY.md` + `MERGE_INTO_FEED_ENGINE.md` to be committed for maintainers (currently in author's Downloads).

### C2. Clean-clone test
- [ ] **NOT YET RUN** — requires push + fresh clone + serve. Run before merge.
- [x] **PASS** — README documents `python3 -m http.server` + http:// requirement (her existing README §"Running it").

### C3. Branch & PR hygiene
- [x] **PASS** — on `feat/preference-collection`, branched off `main`.
- [ ] **PENDING** — push + open PR against main.
- [x] **PASS** — diff is additive; her `main` logic unchanged.
- [~] Onboarding prefs removed at runtime via `PREF_REPLACE_ONBOARDING` flag (reversible); kept in source DOM, not hard-deleted.

---

## Part D — Quick command crib

```bash
grep -c "addEventListener('keydown'" cold_start.html      # 1
grep -c "Playfair\|Plus Jakarta" cold_start.html          # 0
grep -c "var(--violet)" cold_start.html                   # 0
grep -cE "/Users/|/tmp/|file:///" cold_start.html         # 0
git diff --stat origin/main -- content_bank_merged.csv    # (no output)
git status --porcelain                                    # no app-required files unlisted
```

---

## Part E — Sign-off

Build is shippable/shareable only when Part A / B / C all PASS.

**Current state: CONDITIONAL — automated + simulated checks PASS; manual in-browser pass and push/clean-clone still required.**

### Known-state notes (read before merge)

**(1) Headless-verified only — manual in-browser pass required before merge.**
This run used HTTP serve + `node --check` + a Node simulation of the signal path. The following checklist items are NOT yet confirmed in a real browser and must be before merge:
- **B1** — her feed loads with **zero console-red**, auto-plays at dwell, and renders all her card types.
- **A1** — onboarding shows exactly one vibe card; tiles load real photos; focus≠selected visually; 12s timing behaves.
- **A2** — deep card opens L1 over her blurred image; follow-up asks once on exit.
Run: `cd /tmp/TV-Feed && python3 -m http.server 8123`, open `http://localhost:8123/cold_start.html`, watch console + click through onboarding, a deep feed card, and past card 10.

**(2) Four `TODO(team)` decisions — applied defaults (all reversible):**
| § | Decision | Applied default | Revert point |
|---|---|---|---|
| 13.1 | Onboarding: replace vs add her evening+bangalore prefs | **Replace** (removed at runtime, kept in source) | `PREF_REPLACE_ONBOARDING=false` |
| 13.2 | Interaction flow on every CTA vs deep only | **Deep only** (`DEEP_INTENTS`) | `PREF_CONFIG.DEEP_INTENTS` / `data-deep` |
| 13.5 | Periodic cadence N | **10** | `PREF_CONFIG.INTERSTITIAL_EVERY` |
| §4 alias | `sport` token | mapped to **`entertainment`** (15-card surface) though live CSV also has thin `sports`(1) | `TAG`/option mapping in VIBE_POOL |

**(3) Periodic-cadence-drift — RESOLVED (pinned).**
Original risk: `reRankUpcoming` reordered the `.reveal-after` tail and reinserted it contiguously, which would displace an interstitial vibe card sitting among the tail → cadence drift.
**Fix applied:** `reRankUpcoming` now **pins interstitials** — it records the DOM slots the reveal-after cards occupy and refills only those slots in sorted order, leaving vibe-question cards exactly in place. Verified by simulation: feed cards reorder by score within their slots while the interstitial holds its index.
**Confirmed guarantees:** the re-rank **cannot** (a) starve a vibe card (it's never removed — only reveal-after cards are sorted), (b) place two vibe cards back-to-back (their positions are fixed; only feed cards move between them), or (c) move a vibe card to first/last. The §9 rules — *never first/last/back-to-back, no session repeat until pool exhausted, fixed cadence* — hold exactly across re-ranks. Drift is **eliminated, not merely bounded.**

**Record:** date 2026-06-04 · branch `feat/preference-collection` · next action: push → manual in-browser pass → clean-clone test → PR.
