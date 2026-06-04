# Preference-collection merge — summary

Branch: `feat/preference-collection` · target file: `cold_start.html`
Implements `MERGE_INTO_FEED_ENGINE.md` using `SIGNAL_TAXONOMY.md` as the option→signal contract.

## What landed (the 3 things)

1. **Onboarding wide question** — one gap-targeted vibe card inserted after the location step; her overlapping `evening` + `bangalore` prefs removed (reversible via `PREF_REPLACE_ONBOARDING`).
2. **Periodic wide question** — one vibe card spliced after every `INTERSTITIAL_EVERY` (10) feed cards, gap-targeted, never first/last/back-to-back, no session repeat until the pool is exhausted.
3. **Interaction follow-up** — deep feed cards (`DEEP_INTENTS` = plan/book/travel/food, or `data-deep="true"`) open an L1 panel over **her blurred image** (never swapped), then ask one follow-up question whose options are auto-derived from the card's own `prefs`. Non-deep cards keep her quick `onCardInterest` ack.

## How it stays "her product"

- **One** `keydown` listener (dispatcher routes by `prefMode`: feed / vibe-question / l1 / followup). Feed mode is byte-identical to her original.
- **One** auto-advance loop (`scheduleAuto`). Vibe/interaction surfaces pause it and own a single 12s-from-first-pick timer (lifted from the infeed `pickOpt`).
- Her tokens/fonts/mascot only — no Playfair, no Plus Jakarta, no unprefixed `--violet`. New tokens added to `:root` with her naming.
- Answers route through her interest model: `bumpInterestTags(prefs+rich, w)` → `reRankUpcoming()` → her `#prefAck` (`showAckMulti`).

## Signal model (taxonomy)

- **prefs tokens** drive ranking today (her `reRankUpcoming` sums `INTERESTS[token]`). All 25 emitted tokens validated against the live CSV — **0 dead**.
- **rich tags** (`vibe:`/`aesthetic:`/`aspiration:`/`region:`/`cat:`) logged in parallel; inert in ranking (score 0, no card carries them), used for gap-targeting + the future ranker.
- `diversify` follow-up option emits no durable token (session-only).

## Verified

- Baseline: serves over http://, JS parses clean, single keydown, single loop.
- End-to-end: answering "Misty Coorg homestay" (travel/hills/calm) pulls the Travel/Coorg card from outside the top 6 to **#1** in upcoming — proves the prefs path re-ranks.
- 60 vibe options, 0 dead prefs tokens, every option carries rich tags.
- Of 17 cold-start feed cards: 9 deep (L1 flow), 8 quick-ack.

## Open decisions left as `TODO(team)`

- §13.1 onboarding replace-vs-add (assumed: replace) — `PREF_REPLACE_ONBOARDING`
- §13.2 interaction on DEEP_INTENTS only (assumed) vs every CTA
- §13.5 cadence N=10 (alts 8/12) — `PREF_CONFIG.INTERSTITIAL_EVERY`
- `sport` alias → `entertainment` per taxonomy §4 (live CSV also has a thin `sports` token; kept `entertainment` for re-rank surface)
- Known limitation: a periodic vibe card interleaved in the re-rank tail can drift in cadence after a re-rank (never crashes). Future fix: re-splice interstitials after each `reRankUpcoming`.

## Not done / out of scope

- Only `cold_start.html` wired. `warm_start.html` / `enriched.html` share the engine pattern but were not touched.
- No real browser click-through performed (headless env); verified via http serve + JS parse + Node simulation of the signal path. Recommend a manual pass in-browser before merge.
