# Merge plan — fold the preference prototypes into the feed engine

**Audience:** Claude Code, working inside a copy of the colleague's feed repo.
**Goal:** make three things from *our* prototypes appear inside *her* auto-playing feed, as one coherent product — not three bolted-on parts.

---

## PHASE 0 — Pre-flight checks (do BEFORE writing any code)

Do not start building until every check below passes. If any fails, stop and report what's missing — don't guess or improvise around it.

### 0a. Materials present in the workspace
- [ ] Her feed repo is present and is the **copy/branch** we're allowed to edit (not the original).
- [ ] `vibe-cards-prototype.html` is present (source for the vibe-question cards + signal-tag mapping).
- [ ] `infeed-interaction-prototype.html` is present (source for the L0→L1→follow-up flow).
- [ ] Our 59 vibe images (`q*.jpg`) are present to copy in.
- [ ] Her content bank (`content_bank_merged.csv`) and her image dir (`content/images/`, `assets/`) are present.
- [ ] This file (`MERGE_INTO_FEED_ENGINE.md`) is present.

> If a source prototype is missing, the port instructions in §1/§4/§7 cannot be followed — the *code patterns* live in those files, not in this doc. Stop and ask for them.

### 0b. Baseline works before we touch it
- [ ] Serve her repo over `http://` (e.g. `python3 -m http.server`) and confirm her feed **loads, auto-plays, and ↑/↓ navigates** with no console errors. Record this as the known-good baseline.
- [ ] Confirm her engine's key entry points exist and note their line numbers: `injectFeed`, `showCard`, `goNext`, `scheduleAuto`, `pauseAuto`, `resetCard`, `onCardInterest`, `bumpInterest`, `reRankUpcoming`, the global `keydown` listener, `#prefAck`, `#mascotTemplate`, and her `:root` tokens.

### 0c. Locate the patterns to port (read, don't copy-paste blindly)
- [ ] In `vibe-cards-prototype.html`: find the card data array (titles/sublines/image keys), the multi-select + shimmer-focus logic, the **12s-after-first-pick** advance logic, and the **option→signal-tag mapping** (the taxonomy each card emits). Note them.
- [ ] In `infeed-interaction-prototype.html`: find the L1 deep-page layout, the bottom-anchored follow-up panel, the 2×2 multi-select, and the tag-derived option generation.
- [ ] Confirm the **tag taxonomy** is understood (e.g. `vibe:calm`, `cat:travel`, `region:hills`). This is the contract between our questions and her interest model (§6). If it's ambiguous, surface it before wiring.

### 0d. Confirm the open decisions (or accept documented defaults)
- [ ] Read §13. For each of the 5 open decisions, either the team has given a call, or proceed with the **stated default** and leave a `// TODO(team):` at the touch-point. Do not silently choose differently from the default.

**Only when 0a–0d pass: proceed to Phase 1 (§2 onward).**

---

## Precedence rule (resolves most conflicts — read first)

When two approaches clash, decide by *domain of authority*:

- **Her prototype owns the FEED SURFACE.** L0 feed cards, how they look, the photography/imagery treatment, card layout, the mascot, the ambient auto-play feel — all hers. Do **not** redesign them. Our additions never change how her feed cards look; our interaction flow renders *on top of* her existing card image, never replaces the look.
- **Our prototypes own PREFERENCE COLLECTION & SIGNAL.** The vibe questions, the L0→L1→follow-up interaction mechanics, option logic, multi-select behavior, which attribute tags are collected and how they steer the feed. Where her existing behavior and our preference mechanics disagree (e.g. her quick "Got it" ack vs. our L1→question flow on a deep interaction), **ours wins for the preference/signal path.**
- **Visuals & copy are ONE SHARED LANGUAGE.** Colors, type, spacing, mascot, and voice are unified across both so a preference moment never looks like a foreign object in her feed. Since the feed surface is hers, **converge on her visual tokens/fonts/mascot** (§3) — but the *preference mechanics and signal logic underneath* stay ours. Consistency of look is the goal; it does not mean rebuilding our question logic.

In one line: **her = feed surface & imagery · ours = preference mechanics & signal · shared = her visual + copy language applied consistently to both.**

---

## How the vibe cards actually work (important — they are a POOL, not a deck)

The 10 vibe cards are a **library the engine draws from one at a time** — *not* a sequence the user walks through. At any single preference moment (onboarding, or an every-10-cards interstitial), the engine **selects exactly ONE** vibe card from the pool and shows it. The user never sees all 10 in a row.

- **Selection is by gap-targeting:** show the card whose axis we currently know the least about (lowest aggregate signal for its tags). Each answer fills a gap, so the *next* moment naturally surfaces a *different* card.
- Over a session / across sessions, different cards surface at different moments — never the whole deck at once.
- **`vibe-cards-prototype.html` is a REVIEW showcase**, not the product flow. Its "1/10 · prev/next" stepper exists so the team can see all 10 — it is **not** how the feature behaves in the feed. Do **not** port the stepper or the walk-through-all-10 behavior into the merged engine. Port the *cards* (content, tiles, multi-select, signal mapping); drop the deck-walk.

This makes §9's selection logic the **core mechanic**, not a detail: it's the thing that decides which single card appears each time.

---

## 0. The three things we're adding (and where)

1. **Onboarding wide question** — our full-screen "vibe" question appears during her setup sequence (before the feed builds).
2. **Periodic wide question** — one wide question after every ~10 feed cards (so after card 10, card 20, …).
3. **Interaction follow-up** — when the user interacts with a feed card (accepts its CTA / goes deeper), our L0 → L1 → single follow-up question fires for that card, and the answer steers the feed.

Everything must feel like *her* product: her tokens, her mascot, her voice, her one auto-play loop.

---

## 1. Source material (what we're bringing in)

From our prototype folder (`glance-tv-combined-prototype/`):

| File | What to harvest from it | Becomes |
|---|---|---|
| `vibe-cards-prototype.html` | The 10 vibe questions as a **pool of single cards** (titles, sublines, 2×3 image tiles, multi-select + 12s-after-first-pick logic, shimmer focus, signal-tag mapping, image scheme `q{NN}_o{N}_{slug}`). **Harvest the cards, NOT the stepper / walk-through-all-10 behavior** — that's review-only. | A **`vibe-question` card type** + a **pool the engine picks one from** |
| `infeed-interaction-prototype.html` | The L0 → L1 → follow-up flow: L1 deep-page layout, tag-derived options, the bottom-anchored question, multi-select + shimmer, payoff line | A new **interaction-follow-up layer** her feed calls on CTA |
| `content/images/vibe-cards/q*.jpg` (our 59 images) | The vibe-card photography | Copied into her image dir (see §2) |

**Do not** copy our prototypes' CSS wholesale — they use a *different* token system. Re-skin onto hers (see §3).

---

## 2. File / folder moves (do first)

1. Work in a **copy** of her repo (branch: `feat/preference-collection`).
2. Create `content/images/vibe-cards/` inside her repo and copy our 59 `q*.jpg` images there. (Keeps them namespaced; doesn't touch her `c*.jpg` bank.)
3. The 3 interaction-flow images are already base64-embedded in our in-feed prototype — but for consistency in her repo, instead reference them by path from `content/images/vibe-cards/` (`q01_o1_coorg-homestay.jpg`, `q07_o1_darshini-breakfast.jpg`, `q05_o6_live-match.jpg`). Don't carry the base64 over.
4. No new libraries. Everything is vanilla, matching hers.

---

## 3. Design reconciliation (so it looks like one product)

Per the precedence rule, the feed surface is hers, so **converge on her visual language** — our preference cards adopt her tokens, fonts, and mascot. (This is purely visual; the preference *logic* underneath stays ours per §4–9.) Map our tokens → hers and apply throughout the new code:

| Ours | Hers (use this) |
|---|---|
| `--violet` `#7C5CFF` | `--violet-500` `#7E68F2` |
| `--violet-2/3` | `--violet-400` / `--violet-300` |
| `--ink-1/2/3` | `--ink-1/2/3` (same names exist — keep hers) |
| Playfair Display (headlines) | `"New York", Georgia, serif` (her serif) |
| Plus Jakarta Sans (UI) | her system stack (`-apple-system…`) |
| our orb (`.orb`) | her `.agent-mascot` + `#mascotTemplate` (use hers — animated, on-brand) |

Rule: **no Playfair, no Plus Jakarta, no `--violet` (unprefixed) in the merged file.** If something needs a token she doesn't have, add it to her `:root` with her naming convention.

---

## 4. Card-type approach (the architecture decision)

Our cards become **new card types her `showCard()` loop knows how to render**, living in her `#stage` as `.card` elements — *not* separate apps. This means:

- They participate in her one auto-play loop (`autoMode`, `scheduleAuto`, `goNext`, `pauseAuto`).
- They use her single `keydown` listener (extended, not duplicated).
- They reset via her `resetCard()`.

> **Why:** two competing loops + two `keydown` listeners = double-advance and "stuck" bugs. There must be exactly one of each.

### 4a. New card type: `vibe-question`
A full-stage card (like her `preference` card) but with our **2×3 image-tile grid** and **multi-select**.

- Markup pattern: clone her `.card.preference` structure, swap the tile grid for a `repeat(3, 1fr)` × 2-row grid of image tiles (our `q*` images).
- Multi-select: tiles toggle a `selected` (purple) state; **focus** (D-pad position) is a separate `foc` state = outline + shimmer (reuse our shimmer keyframe, restyled to her tokens).
- **Timing:** start a single advance timer (12s) on the **first** selection; do **not** restart on later toggles; if everything deselects, cancel it. (Lift this exact logic from `infeed-interaction-prototype.html` → `pickOpt`.)
- On advance: write answers to her interest model (see §6), then `goNext()`.

### 4b. New layer: interaction follow-up (L0 → L1 → question)
This is **not** a feed card — it's an overlay her feed cards open. See §7.

---

## 5. Single keyboard dispatcher (critical — do this early)

She has one `keydown` (↑/↓ = feed nav). We must **not** add a second. Refactor to one dispatcher that routes by mode:

```
mode = "feed"            // her default: ↑/↓ navigates, auto-play runs
     | "vibe-question"   // a vibe card is active: arrows move tile focus, Enter toggles
     | "l1"              // an interaction L1 page is open
     | "followup"        // the follow-up question is open: arrows move option focus, Enter toggles
```

- In `feed` mode → her existing ↑/↓ behavior.
- In the other modes → our grid/option navigation; **swallow** ↑/↓ feed-nav so the feed doesn't advance underneath.
- Set `mode` when a vibe card becomes active / an L1 opens / a follow-up opens; reset to `feed` on close.

---

## 6. Make answers actually steer the feed (don't skip this)

The whole point: answering a question changes what comes next. Her engine already has the machinery — use it.

- She has `INTERESTS` (localStorage) + `bumpInterest(card, w)` + `reRankUpcoming()`.
- Our questions produce **attribute tags** (e.g. `vibe:calm`, `cat:travel`, `region:hills`). On answer:
  1. Map each selected option → its tag(s). (Our prototypes already carry these in the option arrays — port that mapping.)
  2. Call a small adapter `bumpInterestTags(tags, w)` that does what `bumpInterest` does but takes raw tags instead of a card.
  3. Call `reRankUpcoming()` so the tail of the feed re-sorts.
- Use her `#prefAck` overlay for the acknowledgement ("Got it — more calm evenings coming up"), **not** a second ack system. One voice.

> Open decision: weight. Suggest wide-onboarding answer = `w: 1.5` (strong, early), periodic wide = `w: 1.0`, interaction follow-up = `w: 1.0`. Tunable.

---

## 7. Interaction follow-up flow (L0 → L1 → question)

When the user accepts a feed card's CTA, **replace her current `onCardInterest`** (which just shows "Got it" and auto-advances) with our richer flow — but keep it optional per card so simple likes can stay lightweight.

Flow:
1. **L0** = her feed card exactly as-is — her image, her layout, her look. We change nothing about how it appears (precedence rule: feed surface is hers).
2. **CTA accepted** → open **L1**: a deep panel over **the same card image** (blurred back, never swapped for a different image) — headline, blurb, 2–3 detail facts, an action button with the honest "Demo only — nothing booked" line. The *panel mechanics and what it asks* are ours; the *image and visual language* are hers.
3. **L1 exit** (Back, or after the action's demo-confirm) → **one** follow-up question, bottom-anchored: title/kicker for context above, the question, a 2×2 option grid (multi-select, shimmer focus), payoff line.
4. **Answer** → `bumpInterestTags()` + `reRankUpcoming()` + her `#prefAck`, then `pauseAuto` releases and her loop resumes (auto-advance after the same 12s-from-first-pick rule).

Rules to preserve from our model:
- **Ask once, on L1 exit** — never interrupt L0, never double-ask.
- Like/Save on L0 = silent positive (no question).
- The follow-up options are **auto-derived from the card's tags** (most-distinctive first), not hand-authored per card.
- Timeout / Back / no-selection = **no durable negative**.

> Open decision (#9 in the conflicts table): does this fire for **every** CTA, or only "deeper" CTAs (e.g. travel/food/plan intents) while simple ones keep her quick "Got it"? Default in this doc: **deeper CTAs get the full flow; everything else keeps her quick ack.** Flag a `data-deep="true"` on cards that should get it.

---

## 8. Onboarding placement

Her setup sequence today: hero → hero → location pref → evening pref → bangalore pref → build-feed → feed.

**Default plan (cleanest):** insert **one** vibe question (a single card drawn from the pool — the best cold-start opener, since there's no signal yet to gap-target) after her location step, and **replace her `evening` + `bangalore` pref cards** with it (they overlap with what the vibe question already captures — asking both is redundant and slow).

- If the team would rather keep hers: insert our vibe question *after* `bangalore` instead, and don't delete hers. (Slower onboarding; flag for review.)
- Keep her hero intros and `build-feed` card untouched — they're the narrative bookends.

> Open decision (#8): replace vs. add. This doc assumes **replace** her two overlapping prefs with our vibe question. Mark the removed cards with a comment, don't hard-delete, so it's reversible.

---

## 9. Periodic insertion (every ~10 cards)

Extend her `injectFeed()` (the function that builds feed order after the diversity pass):

- After the ordered feed array is built, **splice ONE `vibe-question` card (drawn from the pool) after every Nth feed card** (N = 10 default).
- Use a config constant `INTERSTITIAL_EVERY = 10` at the top so it's one-line tunable.
- **Which card from the pool:** gap-target — pick the question whose axis we have the least signal on (lowest aggregate `INTERSTITIALS`/`INTERESTS` for its tags), and **don't repeat a card already shown this session** until the pool is exhausted. If signal can't be computed yet, rotate through the pool in order.
- Never place one as the very first or very last card; never two questions back-to-back.
- These share the **same cooldown** as interaction follow-ups — never show a periodic question and an interaction follow-up in the same beat.

---

## 10. Config block (put at top of her script, one place to tune)

```js
const PREF_CONFIG = {
  INTERSTITIAL_EVERY: 10,     // periodic wide question cadence
  FIRST_PICK_ADVANCE_MS: 12000, // auto-advance after first selection
  WEIGHTS: { onboarding: 1.5, periodic: 1.0, interaction: 1.0 },
  DEEP_INTENTS: ['plan','book','travel','food'], // CTAs that get the full L1→question flow
};
```

---

## 11. Build order (do in this sequence — verify after each step)

> After **every** step: re-serve over `http://`, confirm no console errors, and confirm her feed still auto-plays + ↑/↓ works. If a step breaks the baseline, fix before moving on — don't stack changes on a broken state.

1. Branch + copy images (§2). **Verify:** images resolve at `content/images/vibe-cards/q*.jpg`.
2. Add `PREF_CONFIG` + token additions to `:root` (§3, §10). **Verify:** baseline still loads.
3. Refactor to the single keyboard dispatcher (§5). **Verify:** her feed navigates exactly as the Phase-0 baseline — *this is the highest-risk step; confirm before continuing.*
4. Add the `vibe-question` card type (§4a) as a **pool the engine picks one from** + the `bumpInterestTags` adapter (§6). **Verify:** manually insert one card; it renders in her style, multi-select + shimmer work, 12s-after-first-pick advances, deselect-all cancels.
5. Wire onboarding placement (§8). **Verify:** onboarding shows exactly one vibe card; her overlapping prefs are gone/kept per decision; flow reaches the feed.
6. Wire periodic insertion in `injectFeed` (§9). **Verify:** one vibe card appears after card 10, 20…; never two in a row; no session repeat until pool exhausted.
7. Add the interaction L0→L1→follow-up layer (§7); gate behind `data-deep`. **Verify:** a deep card opens L1 over *her* image (blurred, not swapped); exit asks one question; L0 never interrupted; non-deep cards keep her quick ack.
8. Route everything through her `#prefAck` + `reRankUpcoming` (§6). **Verify:** answering visibly re-ranks the upcoming feed and shows her ack in her voice.
9. Full pass against §12. **Verify:** one loop, one keydown, no double-advance, no stuck states, no foreign fonts/tokens.

---

## 12. Acceptance checklist

- [ ] Her feed still auto-plays and ↑/↓ works exactly as before when no question is open.
- [ ] Exactly **one** `keydown` listener and **one** auto-advance loop in the merged file.
- [ ] Onboarding shows **one** vibe question (drawn from the pool); her overlapping prefs are gone (or intentionally kept per decision).
- [ ] **One** `vibe-question` appears after card 10, 20, … (configurable) — never the whole deck; each is a single card drawn from the pool, gap-targeted, no session repeat until pool exhausted.
- [ ] Multi-select works: several tiles purple at once; focus = outline+shimmer (separate from selected); 12s-after-first-pick auto-advance; deselect-all cancels.
- [ ] Interacting with a `data-deep` feed card opens L1, then asks **one** follow-up on exit; never interrupts L0; never double-asks.
- [ ] Answering any question calls `bumpInterestTags` + `reRankUpcoming` and shows her `#prefAck`; the upcoming feed visibly changes.
- [ ] No Playfair / Plus Jakarta / unprefixed `--violet`; her mascot used throughout.
- [ ] Copy follows her voice (discovery prompts, payoff-forward, no "feed updates instantly", no transactional language except the honest demo-only line on L1).
- [ ] Works served over `http://` with the images present; degrades gracefully (gradient) if an image is missing.

---

## 13. Open decisions to confirm with the team (surfaced, not silently chosen)

> **Resolved by the precedence rule:** visual language converges on hers; L0 imagery is always hers (our L1 blurs her existing image, never swaps it); where preference *mechanics* clash with her existing behavior, ours wins for the signal path. The items below are the ones the precedence rule does **not** settle.

1. **§8 replace vs. add** — replace her evening/bangalore prefs with our vibe question (assumed), or keep both? *(This is a flow/onboarding-length call, not a surface-vs-signal call, so precedence doesn't auto-decide it.)*
2. **§7 interaction trigger** — full L1→question flow on *every* CTA, or only `DEEP_INTENTS` (assumed)?
3. **§9 which question to insert** — gap-targeted (assumed) vs. fixed rotation order?
4. **§6 weights** — are the suggested 1.5 / 1.0 / 1.0 right, or should onboarding count for more/less?
5. **Cadence N** — 10 confirmed, or 8 / 12?

Leave these as `// TODO(team):` comments where they bite, so they're easy to flip.
