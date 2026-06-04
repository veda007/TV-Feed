# SIGNAL_TAXONOMY.md — the option→signal contract (resolves Blocker 2)

**Purpose:** every preference option a user can pick must emit signals that (a) **steer her feed today** via her existing `prefs` tokens, and (b) **capture our richer 4-axis model** for the ML story, logged in parallel. This file is the canonical mapping. Claude Code implements it; it is not free to invent tags.

**Decision (locked):** **Option B** — dual emit.
- **`prefs` tokens** (her vocabulary) → drive ranking now, **zero engine change** (her `reRankUpcoming` already sums `INTERESTS[token]` over each card's pipe-split `prefs`).
- **Rich tags** (`vibe:` / `aesthetic:` / `aspiration:` / `region:`) → logged into the interest model in parallel; **not** required to match her cards yet. They power gap-targeting (§ in merge doc §9) and the future richer ranker. Where her vocabulary can't express a nuance, the rich tag still records it.

---

## 1. Her ranking vocabulary (the ONLY tokens that move the feed today)

Her `content_bank_merged.csv` `prefs` column, pipe-delimited, ~50 tokens (counts from Phase 0):

`calm(43) · fashion(30) · food(25) · minimal(25) · home(21) · culture(21) · productivity(19) · tech(18) · travel(17) · wellness(16) · entertainment(15) · life-goals(14) · nightlife(12) · heritage(12) · fitness(12) · weekend(11) · social(10) · music(9) · cafes(7) · nature(7) · parks(7) · family(7) · roadtrip(6) · street(5) · sustainability(5) · hills(2) · beaches(2) · luxury(2) · …`

**Rule:** every option's `prefs` array uses **only tokens from this list.** If an option's natural token isn't in her vocabulary (e.g. `sport`, `art`), pick the closest existing token (see §4 aliases) so ranking still fires. Never emit a `prefs` token she doesn't have — it would score zero.

> ⚠️ Long-tail caution: tokens like `hills(2)`, `beaches(2)`, `luxury(2)` exist but tag very few cards. Boosting them re-ranks a thin set. That's fine (it still works), but pair each rare token with a broader one (e.g. `hills` + `travel`) so the boost has cards to act on.

---

## 2. Our rich axes (logged in parallel; gap-targeting + future ranker)

- **`vibe:`** — the felt energy. Allowed: `calm`, `lively`, `cosy`, `sleek`, `solo`, `social`, `slow`, `fast`.
- **`aesthetic:`** — the look. Allowed: `minimal`, `maximal`, `warm`, `cool`, `muted`, `vivid`.
- **`aspiration:`** — the reach. Allowed: `everyday`, `luxe`.
- **`region:`** — place texture (travel-ish only). Allowed: `hills`, `backwaters`, `beach`, `city`, `heritage`, `countryside`.
- **`cat:`** — coarse category, mirrors her `category`. Allowed: `travel`, `food`, `home`, `sport`, `culture`, `wellness`, `fashion`, `tech`, `social`.

Rich tags are **namespaced with a colon** so `bumpInterestTags` and any future ranker can tell them apart from her flat `prefs` tokens.

---

## 3. The mapping — every card, every option

Format per option: **`prefs:[…her tokens…]` + `rich:[…namespaced…]`**. Primary signal first.
Each option carries **one dominant signal** + light secondary hints (per the strategy model: one strong primary ~0.35–0.4, weak hints ~0.15–0.2).

### Card 1 — "What's your kind of escape?" (axis: region / travel-vibe)
| Option | prefs (drives feed) | rich (logged) |
|---|---|---|
| Misty Coorg homestay | `travel, hills, calm` | `cat:travel, region:hills, vibe:calm` |
| Kerala backwaters | `travel, calm, nature` | `cat:travel, region:backwaters, vibe:slow` |
| Goa beach shack | `travel, beaches, social` | `cat:travel, region:beach, vibe:social` |
| New-city street food | `travel, street, food` | `cat:travel, region:city, vibe:lively` |
| Luxury resort | `travel, luxury, calm` | `cat:travel, aspiration:luxe, vibe:calm` |
| Hampi heritage | `travel, heritage, culture` | `cat:travel, region:heritage, vibe:slow` |

### Card 2 — "How does a perfect evening wind down?" (axis: vibe energy/social)
| Option | prefs | rich |
|---|---|---|
| Rainy coffee & a book | `calm, cafes` | `vibe:calm, vibe:solo, aesthetic:warm` |
| Friends cooking | `social, food, home` | `vibe:social, vibe:cosy` |
| Buzzy restaurant | `food, nightlife, social` | `cat:food, vibe:lively, vibe:social` |
| Rooftop drinks | `nightlife, social` | `vibe:lively, aspiration:luxe` |
| Walk + early night | `calm, nature, wellness` | `vibe:calm, vibe:slow` |
| Theatre night | `culture, nightlife` | `cat:culture, vibe:social` |

### Card 3 — "Pick a morning that feels like you" (axis: vibe pace)
| Option | prefs | rich |
|---|---|---|
| Lake loop at sunrise | `fitness, nature` | `vibe:fast, vibe:solo` |
| Slow brunch | `food, calm, social` | `vibe:slow, vibe:social` |
| Balcony yoga | `wellness, calm` | `cat:wellness, vibe:calm, vibe:solo` |
| Sunday market | `culture, social, parks` | `vibe:lively, vibe:social` |
| Coffee + head start | `productivity, cafes` | `vibe:fast, aesthetic:minimal` |
| Lazy lie-in | `calm` | `vibe:slow, vibe:cosy` |

### Card 4 — "What should your screen become?" (axis: aesthetic — primary aesthetic card)
| Option | prefs | rich |
|---|---|---|
| Golden hour | `calm` | `aesthetic:warm, aesthetic:muted, vibe:calm` |
| Neon city night | `nightlife` | `aesthetic:vivid, aesthetic:cool, vibe:lively` |
| Misty mountains | `nature, hills, calm` | `aesthetic:cool, aesthetic:muted, vibe:calm` |
| Candlelit & refined | `luxury` | `aesthetic:warm, aspiration:luxe, vibe:cosy` |
| White minimal | `minimal` | `aesthetic:minimal, aesthetic:cool` |
| Lantern bazaar | `culture, heritage` | `aesthetic:maximal, aesthetic:vivid, aesthetic:warm` |

### Card 5 — "What's a treat you'd say yes to?" (axis: aspiration + category)
| Option | prefs | rich |
|---|---|---|
| Tasting menu | `food, luxury` | `cat:food, aspiration:luxe` |
| Street-food crawl | `food, street, social` | `cat:food, aspiration:everyday, vibe:lively` |
| Spa day | `wellness, calm, luxury` | `cat:wellness, aspiration:luxe, vibe:calm` |
| A new gadget | `tech` | `cat:tech, aspiration:everyday` |
| Designer piece | `fashion, luxury` | `cat:fashion, aspiration:luxe` |
| Live match | `entertainment, social` | `cat:sport→entertainment, vibe:social, vibe:lively` |

### Card 6 — "Your kind of weekend looks like…" (axis: vibe + category mix)
| Option | prefs | rich |
|---|---|---|
| Nandi Hills trek | `travel, hills, fitness` | `cat:travel, region:hills, vibe:fast` |
| Café-hop & shop | `cafes, fashion, social` | `vibe:social, aspiration:everyday` |
| Slow home day | `home, calm, entertainment` | `vibe:slow, vibe:cosy` |
| Mysore heritage trip | `travel, heritage, culture` | `cat:travel, region:heritage` |
| Spa-and-brunch reset | `wellness, food, luxury` | `cat:wellness, aspiration:luxe, vibe:calm` |
| Match with friends | `entertainment, social` | `vibe:social, vibe:lively` |

### Card 7 — "Pick a table you'd want to sit at" (axis: food — dining)
| Option | prefs | rich |
|---|---|---|
| Darshini breakfast | `food, street` | `cat:food, aspiration:everyday, region:city` |
| Fine-dining tasting | `food, luxury` | `cat:food, aspiration:luxe, vibe:cosy` |
| Street-food stall | `food, street, social` | `cat:food, aspiration:everyday, vibe:lively` |
| Sunny brunch | `food, social, calm` | `cat:food, vibe:social, vibe:slow` |
| Home-cooked dinner | `food, home, family` | `cat:food, vibe:cosy` |
| Family feast | `food, family, social` | `cat:food, vibe:social, aesthetic:maximal` |

### Card 8 — "How do you like to recharge?" (axis: wellness/vibe)
| Option | prefs | rich |
|---|---|---|
| A walk in Cubbon Park | `parks, nature, calm` | `vibe:calm, vibe:slow` |
| A spa day | `wellness, luxury, calm` | `cat:wellness, aspiration:luxe, vibe:calm` |
| Slow cooking | `food, home, calm` | `vibe:slow, vibe:cosy` |
| A weekend escape | `travel, roadtrip` | `cat:travel, region:countryside` |
| A good workout | `fitness` | `cat:wellness, vibe:fast` |
| Book + quiet evening | `calm` | `vibe:calm, vibe:solo, aesthetic:warm` |

### Card 9 — "What catches your eye first?" (axis: aesthetic — secondary aesthetic card)
| Option | prefs | rich |
|---|---|---|
| Minimal plant room | `minimal, home` | `aesthetic:minimal, aesthetic:muted` |
| Colourful interior | `home` | `aesthetic:maximal, aesthetic:vivid, aesthetic:warm` |
| Matte-black gadget | `tech, minimal` | `aesthetic:sleek→minimal, aesthetic:cool` |
| Earthy textile | `home, sustainability, heritage` | `aesthetic:warm, aesthetic:muted` |
| Neon mural | `culture` | `aesthetic:vivid, aesthetic:cool, vibe:lively` |
| Candlelit still life | `calm` | `aesthetic:warm, aesthetic:muted, vibe:cosy` |

### Card 10 — "What would you splurge a Sunday on?" (axis: aspiration + category)
| Option | prefs | rich |
|---|---|---|
| Degustation lunch | `food, luxury` | `cat:food, aspiration:luxe` |
| Vineyard day trip | `travel, luxury, roadtrip` | `cat:travel, aspiration:luxe, region:countryside` |
| Shopping spree | `fashion, luxury` | `cat:fashion, aspiration:luxe` |
| Art workshop | `culture` | `cat:culture, aspiration:everyday` |
| Sport all day | `entertainment, social` | `cat:sport→entertainment, vibe:lively` |
| Wellness retreat | `wellness, luxury, calm` | `cat:wellness, aspiration:luxe, vibe:calm` |

---

## 4. Alias map (our concept → her nearest existing token)

Some natural tokens don't exist in her `prefs` vocabulary. Map them so ranking still fires; keep the precise meaning in the rich tag.

| Our concept | Her token to emit | Rich tag keeps the nuance |
|---|---|---|
| sport | `entertainment` | `cat:sport` |
| art / crafts | `culture` | `cat:culture` |
| coffee | `cafes` | (n/a) |
| beach | `beaches` | `region:beach` |
| roadtrip / countryside | `roadtrip` | `region:countryside` |
| sleek / modern look | `minimal` | `aesthetic:sleek` |
| luxe / premium | `luxury` | `aspiration:luxe` |

> If Claude Code finds a token here that is NOT in the actual CSV `prefs` set at build time, it must report it (don't emit a dead token) and fall back to the coarse `cat:` category's matching token.

---

## 5. The infeed follow-up options use the SAME mapping

The interaction follow-up (`infeed-interaction-prototype.html`) currently labels options with `" · "` strings (`"travel · hills"`). Convert those to the same dual format on port:

- `travel · hills` → `prefs:[travel, hills]`, `rich:[cat:travel, region:hills]`
- `food · coffee` → `prefs:[food, cafes]`, `rich:[cat:food]`
- `food · local` → `prefs:[food, street]`, `rich:[cat:food, aspiration:everyday]`
- `sport · cricket` → `prefs:[entertainment]`, `rich:[cat:sport]`
- `sport · social` → `prefs:[entertainment, social]`, `rich:[cat:sport, vibe:social]`
- `diversify` (the "something different / calmer" option) → emit **no positive token**; instead set a session-only "show me something else" flag. Never a durable negative.

The follow-up's auto-derived options (most-distinctive-first) should be generated from the **source card's own tags** in this same vocabulary, so a Coorg card's follow-up offers `hills`, `calm`, `travel`, etc.

---

## 6. `bumpInterestTags` contract (the net-new adapter, §6.2 of merge doc)

```js
// Mirrors her bumpInterest (line ~847) but takes raw tags instead of a card.
// Both prefs tokens AND rich tags go into the same INTERESTS store.
// Only prefs tokens will match her cards in reRankUpcoming today;
// rich tags accumulate for gap-targeting + future ranking.
function bumpInterestTags(tags, w){
  tags.forEach(t => { if(t) INTERESTS[t] = (INTERESTS[t]||0) + w; });
  saveInterests();
}
```

- On any answer: collect the selected options' `prefs` **and** `rich` tags into one array, call `bumpInterestTags(allTags, weight)`, then `reRankUpcoming()`.
- Weights (merge doc §10): onboarding `1.5`, periodic `1.0`, interaction `1.0`.
- `reRankUpcoming` is unchanged — it naturally ignores `vibe:`/`aesthetic:` tags because no card carries them (they score 0), and acts on the `prefs` tokens. **No engine edit required.**

---

## 7. Gap-targeting (which vibe card to show next, merge doc §9)

Each card has a **primary axis** (noted per card in §3):
- Card 1 → region/travel · Card 2 → vibe(energy) · Card 3 → vibe(pace) · Card 4 → aesthetic · Card 5 → aspiration · Card 6 → vibe(mix) · Card 7 → food · Card 8 → wellness/vibe · Card 9 → aesthetic · Card 10 → aspiration

To pick the next card: compute, per axis, the **total accumulated rich-tag weight** in `INTERESTS`; choose a not-yet-shown card whose primary axis has the **lowest** total (the biggest gap). This is exactly why we log rich tags even though they don't rank yet — they're what gap-targeting reads.

Cold start (no signal): show **Card 1** (escape/region) first — broadest, most evocative opener.

---

## 8. What's deliberately compressed (note for later, not a bug)

Mapping our 4-axis model onto her flat 50-token `prefs` vocabulary loses some nuance **in ranking** today (e.g. `aesthetic:warm` has no matching card token, so it doesn't re-rank — only logs). This is intentional for the prototype: ranking works now via `prefs`; the richer signal is captured for when her CSV gains `vibe`/`aesthetic`/`aspiration` columns and a ranker that reads them. Do **not** "fix" this by inventing card tokens — it's the documented two-stage plan.

---

## 9. Acceptance (taxonomy-specific, add to merge doc §12)

- [ ] Every vibe option emits **only** `prefs` tokens that exist in the live CSV (build-time check; report any dead tokens).
- [ ] Every option also emits its `rich:` tags.
- [ ] Picking an option calls `bumpInterestTags(prefs+rich, w)` then `reRankUpcoming()`.
- [ ] Answering a travel/`hills` option visibly pulls hills/travel cards up the upcoming feed (proves `prefs` path works end-to-end).
- [ ] Rich tags accumulate in `INTERESTS` (inspect store) even though they don't re-rank — proves the signal is captured.
- [ ] `diversify` options leave no durable positive or negative.
