# Glance TV — Vibe Question Matrix & Authoring System (v2)

**Scope:** the question set for the preference-collection cards, structured across Cold / Warm / Enriched, built to demo to leadership and then go to production.

---

## 0. Operating context (why this is shaped the way it is)

**User reality today:** ~85% Cold start (no signal given), ~10–12% Warm (partial profile), ~3% Enriched. The core problem is **signal scarcity** — the feed is passive, users don't interact with CTAs, so no behavioural signal arrives, so the feed can't improve. The vibe cards break that loop by *asking* instead of *waiting*.

**Why build all three states anyway:** the first deliverable is a leadership review. The prototype must *show the thinking* for every user type — which is what the **"Show Your Work" side panel** does (it explains why a given question appears for a given user). So even though Cold dominates real traffic, Warm and Enriched are built to demonstrate the model end-to-end.

**Operating stage = CAPTURE-FIRST.** Because the failure mode is *no signal at all*, every tap is a win.
- Collect **all** signals flat (`prefs` + `rich`), at face value. Do **not** split primary/secondary confidence or filter weak-vs-strong yet — you can't filter signals you don't have. That sorting comes later, once volume exists.
- Guardrails that are **ON now** (they affect whether we capture at all): visible feed payoff after every answer (the loop only closes if the user *sees* Glance change); no internal-taxonomy words in user-facing copy; image must **match** its option (a mismatched image records a mislabeled signal); two-layer copy (title + plain subline) for couch comprehension; de-clichéd market packs.
- Guardrails **deferred** to production: confidence scoring, household disambiguation, candidate-score gates, image *parity* policing, prompt-fatigue suppression, retirement pipeline. (Per the hardening doc's own prototype-vs-production split.)

---

## 1. The model

One spine of axes. State changes **selection, framing, and volume** — not the bank.

| | Cold | Warm | Enriched |
|---|---|---|---|
| Goal | Broad coverage, fast | Fill the specific blanks | Deepen + catch context |
| Selection | Widest, most orthogonal | Axes still missing | Sub-axes of known + contextual |
| Framing | Open discovery | Acknowledging ("you love X — but…") | Concierge ("more like X — which kind?") |
| Volume | Most (30) | Fewer (12) | Fewest (8) |

**Cross-market rule (decided):** at most **3 "parallel" axes** — same/near-same question *text*, but **market-specific options and images**, listed as **separate cards** (separate IDs, separate CSV rows, separate images) so matching stays clean. Everything else is **market-specific** (different question *and* options) — culturally native, no parallel needed. Non-parallel split is even: **5 India + 5 US**.

---

## 2. The axis spine

### The 3 PARALLEL axes (similar text · market-specific options · separate cards)

**P1 — Escape** · *environment* · "What's your kind of escape?"
| | Options (title — subline) |
|---|---|
| 🇮🇳 | Misty hills — *Coorg, coffee, cool air* · Beach shack — *Goa, sunsets, easy* · City buzz — *metro lights, energy* · Heritage trail — *Hampi, forts, old stories* |
| 🇺🇸 | Mountain town — *crisp air, slow pace* · Beach town — *coast, sun, easy days* · Big city — *lights, energy, nonstop* · Open road — *highway, freedom, drive* |

**P2 — Perfect weekend** · *lifestyle/pace* · "What does a perfect weekend look like?"
| | Options |
|---|---|
| 🇮🇳 | Home-cooked lunch — *family, slow, full table* · Festive gathering — *people, colour, music* · Hill-station getaway — *cool escape, two days* · Easy errands & chai — *local, unhurried* |
| 🇺🇸 | Backyard cookout — *grill, friends, outside* · Game day — *the match, snacks, crew* · Road trip — *pack up, hit the road* · Lazy lounge — *home, slow, nothing planned* |

**P3 — The table** · *food* · "Pick a table you'd pull up to"
| | Options |
|---|---|
| 🇮🇳 | Street-food crawl — *stalls, spice, buzz* · Home thali — *comfort, familiar, full* · A new restaurant — *try something, treat* · Chai & snacks — *easy, evening, local* |
| 🇺🇸 | Classic diner — *booths, comfort food* · Backyard grill — *smoke, simple, outside* · A nice dinner out — *dressed up, a treat* · Coffee-shop culture — *café, slow, casual* |

### 5 INDIA-specific axes (native · single market)

| id | axis | question | options (title) |
|---|---|---|---|
| I1 | Festival mood | "Which celebration feels most like you?" | Lights & home · Colour & crowd · Quiet & traditional · Big family gathering |
| I2 | Cricket | "How do you follow the game?" | At the ground · Packed with friends · Family on the sofa · Every stat & replay |
| I3 | Big screen | "What pulls you to the big screen?" | Blockbusters · Regional gems · Comedy & light · Edge-of-seat drama |
| I4 | Slow Sunday | "An unhurried Sunday is…" | A walk & quiet · Long family lunch · Market & errands · Nap & nothing |
| I5 | Find calm | "How do you find calm?" | A morning walk · Yoga & stretch · Music & quiet · Time with people |

### 5 US-specific axes (native · single market)

| id | axis | question | options (title) |
|---|---|---|---|
| U1 | Open road | "Where's the road taking you?" | Road trip · National parks · Coastal drive · Mountain town |
| U2 | Home project | "What corner are you itching to fix up?" | Kitchen · Outdoor space · Cozy nook · Full refresh |
| U3 | Cozy season | "When the weather turns, you're into…" | Crisp outdoor walks · Baking & warmth · Movie marathons · Holiday everything |
| U4 | The upgrade | "A treat-yourself moment" | A great meal out · A weekend away · Gear you've wanted · Tickets to something live |
| U5 | Night out | "Your kind of night out is…" | Live music · Sports bar · Dinner with friends · Low-key & local |

> Full `prefs` / `rich` token sets per option carry over from v1's spine (one `prefs` set + one `rich` set per option), emitted **flat** per the capture-first stance. Fashion/style is never an axis — it survives only as an option inside U4 "gear you've wanted."

---

## 3. COLD cards (30) — broad coverage, both markets

**Tier 1 — base spine (16):** every axis once; parallels forked.

| # | id | axis | market |
|---|---|---|---|
| 1 | cold_q01 | P1 Escape | IN |
| 2 | cold_q02 | P1 Escape | US |
| 3 | cold_q03 | P2 Weekend | IN |
| 4 | cold_q04 | P2 Weekend | US |
| 5 | cold_q05 | P3 Table | IN |
| 6 | cold_q06 | P3 Table | US |
| 7 | cold_q07 | I1 Festival mood | IN |
| 8 | cold_q08 | I2 Cricket | IN |
| 9 | cold_q09 | I3 Big screen | IN |
| 10 | cold_q10 | I4 Slow Sunday | IN |
| 11 | cold_q11 | I5 Find calm | IN |
| 12 | cold_q12 | U1 Open road | US |
| 13 | cold_q13 | U2 Home project | US |
| 14 | cold_q14 | U3 Cozy season | US |
| 15 | cold_q15 | U4 The upgrade | US |
| 16 | cold_q16 | U5 Night out | US |

**Tier 2 — fresh option-packs (14):** *not* repeats — a second, differently-shot option set on the strongest axes. Serves population variety (different cold users see different cards), freshness (a non-converting user sees new-looking cards over time), and de-clichéing (rotate away from the obvious first pack). Each `_v2` uses a different option angle.

| # | id | axis (v2 angle) | market |
|---|---|---|---|
| 17 | cold_q17 | P1 Escape — *offbeat regions* (Nilgiris / Andaman / Rishikesh / Kutch) | IN |
| 18 | cold_q18 | P1 Escape — *different US reads* (desert / lake cabin / wine country / ski town) | US |
| 19 | cold_q19 | P2 Weekend — *active angle* (trek / sport / volunteer / explore) | IN |
| 20 | cold_q20 | P2 Weekend — *active angle* (hike / farmers market / DIY / day trip) | US |
| 21 | cold_q21 | P3 Table — *occasion angle* (festive feast / tiffin / dessert run / late-night) | IN |
| 22 | cold_q22 | P3 Table — *occasion angle* (brunch / food truck / steakhouse / late-night) | US |
| 23 | cold_q23 | I1 Festival — *regional festivals* angle | IN |
| 24 | cold_q24 | I2 Cricket — *formats* (T20 / Test / gully / fantasy) | IN |
| 25 | cold_q25 | I4 Slow Sunday — *seasonal* angle | IN |
| 26 | cold_q26 | I5 Find calm — *evening* angle | IN |
| 27 | cold_q27 | U1 Open road — *seasons* angle | US |
| 28 | cold_q28 | U3 Cozy season — *summer flip* (lake / patio / festivals / travel) | US |
| 29 | cold_q29 | U4 The upgrade — *experiences* angle | US |
| 30 | cold_q30 | U5 Night out — *low-key* angle | US |

---

## 4. WARM cards (12) — gap-targeted, reframed

Partial profile known. Each reframes a spine axis to **bridge a known signal to an unknown one**; the engine surfaces whichever is the biggest blank for that profile and **skips** any already filled. Options localize by the user's market.

| # | id | axis | bridges to | question (warm framing) |
|---|---|---|---|---|
| 1 | warm_q01 | P1 Escape | travel | "You know the city well — where do you slip away to?" |
| 2 | warm_q02 | I5/Find calm | wellness | "You're always on — how do you actually recharge?" |
| 3 | warm_q03 | P2 Weekend | downtime | "When the week eases off, a perfect weekend is…" |
| 4 | warm_q04 | P3 Table | dining setting | "You've got taste — where do you most like to eat?" |
| 5 | warm_q05 | U1/Open road | travel style | "Beyond the usual trips — does the open road call?" |
| 6 | warm_q06 | U2 Home project | home | "Any corner of home you've meant to fix up?" |
| 7 | warm_q07 | I1 Festival | cultural | "Which kind of celebration feels most like you?" |
| 8 | warm_q08 | U3 Cozy season | seasonal | "As the season shifts, what are you in the mood for?" |
| 9 | warm_q09 | I3/U-watch | viewing | "When you do watch — what pulls you in?" |
| 10 | warm_q10 | U4 The upgrade | aspiration | "If you treated yourself this month, it'd be…" |
| 11 | warm_q11 | I2/U5 sport-social | sport/social | "Into the game — and how do you follow it?" |
| 12 | warm_q12 | I4 Slow Sunday | pace | "A truly unhurried Sunday looks like…" |

---

## 5. ENRICHED cards (8) — deepen + context

Rich profile. ~5 deepening (sub-axis of a known interest) + 3 contextual (real-time / seasonal). Contextual cards are the demo showpieces — they prove the system reacts to live signals.

| # | id | type | based on | question (enriched framing) |
|---|---|---|---|---|
| 1 | enr_q01 | deepen | travel + hills | "More hill escapes — solo, with friends, or family?" |
| 2 | enr_q02 | deepen | wellness + active | "Your active reset — push hard, or move easy?" |
| 3 | enr_q03 | deepen | food + dining | "When you eat out — adventurous, comfort, or occasion?" |
| 4 | enr_q04 | deepen | entertainment | "Tonight's watch — short & light, or deep & involved?" |
| 5 | enr_q05 | deepen | aspiration + gear | "The upgrade you'd make — everyday better, or a splurge?" |
| 6 | enr_q06 | context | season window | "It's that time of year — what are you most into now?" |
| 7 | enr_q07 | context | festival nearby | "Festive season's here — how are you marking it?" |
| 8 | enr_q08 | context | live sport in season | "Big games on right now — how are you watching?" |

**Total: 30 + 12 + 8 = 50.**

---

## 6. Generalized authoring structure (for the long run)

Questions are **data, not code**. One schema per question:

```
QUESTION = {
  axis_id,                 # P1, I1, U1… stable across markets/states
  axis_name, probes,
  market: IN | US,         # parallels exist once per market as separate cards
  state_framings: { cold, warm?, enriched? },   # omit a state to exclude it there
  options: [ { title, subline, imageKey, prefs[], rich[] } ],  # 3–4, flat tags
  cooldown_class,
  context_trigger?         # season/event for contextual cards
}
```

Rules: one axis per question; options orthogonal and at the same abstraction level; **two-layer copy** (≤4-word title + plain subline, no category jargon); image must depict the option; localize options, not axes; fashion stays an option. Dual-emit tags, recorded flat (capture-first).

---

## 7. Freshness system (so users don't get bored)

1. **Gap-targeting + no-repeat** — never re-ask a filled axis; no repeat until the pool cycles. (In engine.)
2. **State progression as freshness** — the same axis evolves cold → warm → enriched, so a returning user feels the questions get smarter, not stale.
3. **Cooldowns** — prompts share a cooldown; `cooldown_class` lets heavier asks surface less often.
4. **Seasonal / contextual injection** — time-boxed cards surface only in-window (cozy season, festival, playoffs/IPL) and expire automatically.
5. **Variant option-packs** — the Tier-2 `_v2` packs: same axis, fresh imagery/options → perceived-new at low cost; rotate to avoid clichés.
6. **Pool growth & retirement** — quarterly: add ~4 axes + 1 seasonal pack, retire the 2 weakest by response rate. Keep ~16–20 live.

**Note:** retirement-by-response-rate is a *production* mechanism; in the capture-first stage, keep everything and just measure.

---

## 8. Maps to

- `content_bank_vibe_cards.csv` — one row per option (add a `market` column: IN/US). Card ids above = the `{state}_q{NN}` keys; images follow `{state}_q{NN}_o{N}.jpg`.
- The "Show Your Work" panel — per card, the *why* line is drawn from this matrix (axis goal + which blank it fills).

---

*End of QUESTION_MATRIX.md (v2)*
