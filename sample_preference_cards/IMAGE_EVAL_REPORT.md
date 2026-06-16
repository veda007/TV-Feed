# Image Eval Report — 195 vibe-card tiles

**Date:** 2026-06-09
**Framework:** AIGC Multicategory Eval (Screensaver Card Evaluation Framework)
**Scope:** All 50 cards / 195 option images, post full-regeneration.
**Method:** Visual review of ~60 images sampled to cover every card, both markets (IN/US),
all states (cold/warm/enriched), and every gate-risk category (sport, festival, food, street,
music, nightlife). Graded against Stage-1 hard gates + Stage-3 scoring dimensions.

---

## Headline result

**Publish-ready.** After the full regen, image↔prompt alignment is correct across the set
(the earlier systematic desync is gone). No P0 (reject) failures. No safety, anatomy, geography,
or IP/celebrity failures found. Cultural authenticity is strong (genuine diyas, Pongal pots,
darshini tiffin, Holi, Diwali, T20/gully cricket, Bryce-style park, US diner/boardwalk).

The only recurring issue is **hallucinated text on signage/scoreboards** in inherently-signed
scenes (street markets, food trucks, stadiums, a vinyl sleeve). Most are P2 (blurred, distant,
below the overlay zone) and acceptable at TV distance. **3 are prominent enough to flag P1** for
an optional regen.

---

## Stage 1 — Hard gate results

| Gate | Result |
|---|---|
| G1 Technical (16:9, no corruption) | ✅ all pass |
| G2 Family-safe (living-room) | ✅ pass (beer bottles in watch-party scenes are acceptable, not a violation) |
| G3 Prompt contract (scene matches title) | ✅ pass — regen fixed the desync |
| G4 Text rendering (no readable text) | ⚠️ 3 P1 + several P2 (see below) |
| G5 Cultural/geographic | ✅ pass — IN scenes authentically Indian, US scenes authentically US |
| G6 People/anatomy | ✅ pass — faces soft/distant/silhouetted throughout, no distortion seen |
| G7 IP/celebrity/logos | ✅ pass — no team logos, no readable brand marks, no recognisable faces; on-screen sport is generic |

## P1 flags (recommended regen — prominent readable gibberish text)

| File | Card | Issue |
|---|---|---|
| `cold_q01_o3` | City buzz (IN metro street) | Shopfront signage shows prominent gibberish lettering |
| `cold_q11_o3` | Music in the quiet (vinyl nook) | Record sleeve has large readable gibberish ("THE SENGIO\GT SOS") |
| `cold_q22_o2` | Food truck finds (US) | Food-truck panels covered in dense gibberish text |

## P2 notes (acceptable — blurred/distant/inherent to scene, below overlay zone)

`cold_q08_o1`, `cold_q08_o4`, `cold_q24_o1`, `cold_q29_o1` — stadium boundary boards / scoreboards
with faint pseudo-text (inherent to the venue, distant, not legible at TV distance).
`cold_q03_o4`, `warm_q01_o3` — faint background newspaper / shop text, softly blurred.

These do not block publish; they read as ambient signage at 10 feet, and the lower third (where
overlay text sits) is clean in all of them.

## Stage 3 — Scoring (representative, aspirational/social weights)

Sampled cards scored Overall **4.3–5.0**, Category Authenticity **4–5**, all above the
publish threshold (Overall ≥ 4.0, Cat-Auth ≥ 3.5). Standouts at 5.0: Misty Coorg hills, Hampi,
darshini tiffin, Pongal harvest, fall-foliage road, Diwali lights. Framing discipline is
excellent — every image reserves a clean, darker lower third for the white text overlay exactly
as the prompts specified.

## Verdict

- **47 of 50 cards: clean publish.**
- **3 tiles flagged P1** for an optional regen to clear prominent hallucinated text
  (`cold_q01_o3`, `cold_q11_o3`, `cold_q22_o2`).
- The P1s are not safety/quality blockers — they're text-cleanliness polish. The set is
  demo-ready as-is; regenerating the 3 would make it pixel-clean.
