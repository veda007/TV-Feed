# L0 Feed Image Prompts (full-screen, 1 to 10)

Human-readable companion to `l0l1_cards.csv`. These are the 10 full-screen L0 feed-card images, numbered 1 to 10. **The CSV is the source of truth** — `generate_l0l1_images.py` reads `l0l1_cards.csv`, not this file. This file is for review only; if you edit a prompt here, also edit the matching `imagePrompt` cell in the CSV or they will drift.

**Applied automatically at generation (not stored per prompt):** a shared full-screen style suffix that fills the frame edge to edge, weights the subject to the right/center, and keeps the left third and bottom-left darker and clean for the overlaid agent line, headline, and CTA (matching `cold_start.html`); plus the base + category negative prompts. Output is full HD 1920x1080 JPEG, hosted in GCS under the `l0l1/` prefix.

Image file names are fixed and must not change (the CSV links each card to its image by `imageFile`). They are all-lowercase with underscores — safe for GitHub and GitHub Pages (case-sensitive Linux). Build each URL as `IMAGE_BASE_URL_L0L1 + imageFile`.

---

## 1. Wind down with a proper routine  ·  [ANY]  ·  wellness / sleep

- **Image file:** `l0_001_wellness_sleep.jpg`
- **Card id:** `l0_001`  ·  **Intent (deep-trigger):** `plan`
- **Agent line (L0):** *The city never really slows — a proper wind-down routine is the fix.*
- **CTA:** Want tips to ease into this? → Yes

**Image prompt:**
> Full-screen cinematic bedroom at golden-hour dusk, warm low side light from a large window on the right. Right and center of frame: a neatly made bed with cream linen and a rust knit throw, a glowing bedside lamp, leafy potted plants, a sunset view through the window. Left third and lower-left: a softly shadowed wall and floor in warm gentle gloom, uncluttered. Palette: warm amber, cream, rust, sage green, dusk gold. Calm restful evening atmosphere, soft realistic shadows.

---

## 2. Escape to the misty hills  ·  [IN]  ·  travel / hills

- **Image file:** `l0_002_travel_hills.jpg`
- **Card id:** `l0_002`  ·  **Intent (deep-trigger):** `travel`
- **Agent line (L0):** *A weekend in the hills is closer than you think.*
- **CTA:** Want a closer look? → Yes

**Image prompt:**
> Full-screen cinematic Western Ghats hill homestay at misty dawn, soft cool light with a warm sunrise edge. Right and center: a wooden homestay deck with two cane chairs and steaming cups, overlooking layered green tea-and-pine slopes wrapped in silver fog, blue ranges beyond. Left third and lower-left: soft fog and a darker shaded foreground, uncluttered. Palette: deep emerald, silver mist, warm amber, slate blue, soft gold. Serene aspirational travel atmosphere.

---

## 3. Chase the city's best street food  ·  [IN]  ·  food / street

- **Image file:** `l0_003_food_street.jpg`
- **Card id:** `l0_003`  ·  **Intent (deep-trigger):** `food`
- **Agent line (L0):** *Tonight's craving has a clear answer.*
- **CTA:** Want to explore? → Yes

**Image prompt:**
> Full-screen cinematic Indian street-food lane at early evening, warm bulb light, gentle steam, medium contrast. Right and center: a glowing food stall with a sizzling griddle of golden snacks, brass vessels, jewel-toned chutney bowls, soft crowd movement and warm-blurred lane lights behind. Left third and lower-left: a darker calm stretch of the lane, uncluttered. Palette: fried amber, chutney red and green, brass gold, dusk orange. Appetizing lively atmosphere, clean food handling.

---

## 4. Make a corner you love coming home to  ·  [ANY]  ·  home / cozy

- **Image file:** `l0_004_home_cozy.jpg`
- **Card id:** `l0_004`  ·  **Intent (deep-trigger):** `plan`
- **Agent line (L0):** *Your space could feel a little more like you.*
- **CTA:** Want ideas? → Yes

**Image prompt:**
> Full-screen cinematic cozy living-room reading corner at warm afternoon, soft window light, low contrast. Right and center: a cushioned armchair with a chunky knit throw, a brass floor lamp, a small table with a steaming mug and a stack of books, a trailing plant. Left third and lower-left: a softly lit warm wall and floor, uncluttered. Palette: warm cream, mustard, sage, honey wood, soft white. Inviting tactile homely atmosphere.

---

## 5. Catch the big game tonight  ·  [IN]  ·  sport / cricket

- **Image file:** `l0_005_sport_cricket.jpg`
- **Card id:** `l0_005`  ·  **Intent (deep-trigger):** `plan`
- **Agent line (L0):** *There's a match worth clearing your evening for.*
- **CTA:** Want the details? → Yes

**Image prompt:**
> Full-screen cinematic cricket stadium under floodlights at night, crisp white floodlight with warm crowd glow, high contrast. Right and center: a vivid emerald pitch glowing under towering floodlights, tiered stands shimmering with a sea of warm crowd lights. Left third and lower-left: darker night sky and shadowed stand, uncluttered. Palette: vivid emerald, floodlight white, warm amber, deep night blue. Electric live-match atmosphere.

---

## 6. Make the most of the festive days  ·  [IN]  ·  culture / festival

- **Image file:** `l0_006_culture_festival.jpg`
- **Card id:** `l0_006`  ·  **Intent (deep-trigger):** `plan`
- **Agent line (L0):** *The season's about to light up.*
- **CTA:** Want to plan? → Yes

**Image prompt:**
> Full-screen cinematic Indian festival-of-lights home exterior at night, warm flame light, medium-low contrast. Right and center: a doorway and facade lined with glowing oil lamps and warm string lights, a vivid rangoli, marigold garlands, soft golden bokeh down the street. Left third and lower-left: a darker calm stretch of wall and step, uncluttered. Palette: marigold, saffron, warm gold, rose, deep night blue. Intimate glowing celebration atmosphere, no close-up worship.

---

## 7. Find your next favorite café  ·  [US]  ·  food / cafe

- **Image file:** `l0_007_food_cafe.jpg`
- **Card id:** `l0_007`  ·  **Intent (deep-trigger):** `food`
- **Agent line (L0):** *Slow mornings deserve a good cup.*
- **CTA:** Want to explore? → Yes

**Image prompt:**
> Full-screen cinematic cozy US coffee shop at warm morning, soft window daylight, low contrast. Right and center: a warm oak table with a ceramic latte and a pastry, a soft armchair, trailing plants, a sunlit window with street greenery. Left third and lower-left: a softly shadowed wood interior, uncluttered. Palette: honey oak, cream, latte caramel, leaf green, soft white. Slow inviting café atmosphere.

---

## 8. Take the scenic drive  ·  [US]  ·  travel / roadtrip

- **Image file:** `l0_008_travel_roadtrip.jpg`
- **Card id:** `l0_008`  ·  **Intent (deep-trigger):** `travel`
- **Agent line (L0):** *The open road is calling for the weekend.*
- **CTA:** Want a closer look? → Yes

**Image prompt:**
> Full-screen cinematic US coastal highway at golden hour, warm low light, sparkling water highlights. Right and center: a winding cliffside road with a small car, a glittering blue-green ocean meeting a peach sky, wind-bent coastal grass. Left third and lower-left: a darker shaded cliff foreground, uncluttered. Palette: ocean teal, cliff sage, warm gold, soft peach. Open scenic free-drive atmosphere.

---

## 9. Refine your everyday setup  ·  [ANY]  ·  tech / gadgets

- **Image file:** `l0_009_tech_gadgets.jpg`
- **Card id:** `l0_009`  ·  **Intent (deep-trigger):** `plan`
- **Agent line (L0):** *A small upgrade can change your whole setup.*
- **CTA:** Want ideas? → Yes

**Image prompt:**
> Full-screen cinematic premium desk setup at warm side light, medium contrast. Right and center: a refined wooden desk with a matte keyboard, headphones, a compact device with brushed-metal detail, a small plant, soft warm task light. Left third and lower-left: a darker clean wall, uncluttered. Palette: warm grey, honey wood, matte black, brass, cream. Sleek practical premium atmosphere.

---

## 10. Move in a way that feels good  ·  [ANY]  ·  wellness / fitness

- **Image file:** `l0_010_wellness_fitness.jpg`
- **Card id:** `l0_010`  ·  **Intent (deep-trigger):** `plan`
- **Agent line (L0):** *A reset doesn't have to be a grind.*
- **CTA:** Want tips? → Yes

**Image prompt:**
> Full-screen cinematic outdoor trail at soft morning light, warm dappled sun, low contrast. Right and center: an open green trail winding through tall trees with sunray shafts, fresh and bright, one distant figure for scale. Left third and lower-left: a darker shaded path foreground, uncluttered. Palette: fresh green, warm gold, sage, pale blue. Active fresh-air recharge atmosphere.

---

*Total: 10 full-screen L0 prompts. Source of truth: `l0l1_cards.csv` (`imagePrompt` column). Generator: `generate_l0l1_images.py`.*