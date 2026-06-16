#!/usr/bin/env python3
"""
generate_images.py — generate every vibe-card option image on Vertex AI (Imagen)
and store it in a GCS bucket, driven entirely by content_bank_vibe_cards.csv.

WHAT IT DOES, per CSV row:
  1. target name = row.imageFile           (e.g. cold_q03_o1.jpg)
  2. skip-if-exists: if gs://<bucket>/<prefix><target> already exists, skip
  3. call Imagen with row.imagePrompt       (16:9, TV-friendly)
  4. upload the result to GCS at that name
Re-runs are cheap: only missing images are generated.

L0/L1 FULL-SCREEN generator (1920x1080 hero feed cards). Reads l0l1_cards.csv.
Full HD, NO tile downscale, NO tile bottom-safe rule.

PREREQUISITES (run on YOUR machine / Cloud Shell, where your GCP auth lives):
  pip install google-genai google-cloud-storage pillow
  gcloud auth application-default login        # or a service-account key
  # a GCS bucket whose objects are publicly readable (or fronted by Cloud CDN)

ENV / CONFIG you must set below or via environment variables:
  GOOGLE_CLOUD_PROJECT   your GCP project id
  GOOGLE_CLOUD_LOCATION  e.g. us-central1
  GCS_BUCKET             target bucket name (no gs:// prefix)

USAGE:
  python3 generate_images.py                       # generate all missing
  python3 generate_images.py --dry-run             # list what WOULD be made, no API calls
  python3 generate_images.py --only cold           # only cold_* rows
  python3 generate_images.py --limit 5             # first 5 (smoke test)
  python3 generate_images.py --model imagen-4.0-generate-001   # override model
  python3 generate_images.py --prefix glance/      # key prefix inside the bucket
"""

import argparse
import csv
import os
import sys
import time

CSV_PATH_DEFAULT = "content_bank_vibe_cards.csv"

# Latest Imagen generate model as of 2026. Override with --model if your project
# has a newer one allowlisted (check: gcloud ai models list, or the Vertex console).
DEFAULT_MODEL = "imagen-4.0-generate-001"

# Applied to EVERY prompt at generation time (kept here, not in the CSV, to avoid 195x bloat).
STYLE_SUFFIX = (
    "Premium cinematic full-screen lifestyle photography, 1920x1080 16:9 composition that fills "
    "the entire frame edge to edge, rich realistic color grading, strong depth and atmosphere, "
    "the main subject weighted to the right and center of the frame, the left third and the "
    "lower-left kept darker, calmer and uncluttered with a soft natural vignette so white UI text "
    "and a CTA can sit over the bottom-left, TV-legible from a distance, no text, no logos, no "
    "readable signage, no brand marks, no identifiable faces, no exaggerated stock-photo posing."
)

BASE_NEGATIVE = (
    "text overlays, signage, logos, brand names, readable labels, close-up identifiable faces, "
    "distorted hands, uncanny people, over-saturated colors, cartoon style, flat stock-photo look, "
    "cluttered composition, messy background, low-resolution, harsh flash, AI artifacts, watermark"
)

# Category negatives keyed off the rich `cat:` tag (passed from the CSV per row).
CATEGORY_NEGATIVE = {
    "food": "dirty food handling, unappetizing food, food waste, brand packaging, alcohol focus",
    "sport": "team logos, jersey logos, readable scoreboards, recognizable screen content, visible match footage, real player likenesses, aggressive crowd behavior, identifiable athlete close-ups",
    "culture": "worship close-ups, religious identity focus, political symbols, caricatured stereotypes, stereotyped costumes, readable banners, readable religious text, sensitive identity focus",
    "entertainment": "recognizable actors, copyrighted characters, movie posters, readable screens, recognizable screen content, visible film footage",
}


def log(msg):
    print(msg, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="l0l1_cards.csv")
    ap.add_argument("--project", default=os.environ.get("GOOGLE_CLOUD_PROJECT"))
    ap.add_argument("--location", default=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"))
    ap.add_argument("--bucket", default=os.environ.get("GCS_BUCKET"))
    ap.add_argument("--prefix", default=os.environ.get("GCS_PREFIX", "l0l1/"),
                    help="key prefix inside the bucket, e.g. 'glance/'. IMAGE_BASE_URL must match.")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--aspect", default="16:9", help="TV tiles are 16:9-ish; keep unless you change tile shape")
    ap.add_argument("--width", type=int, default=1920, help="full-HD width (px)")
    ap.add_argument("--height", type=int, default=1080, help="full-HD height (px)")
    ap.add_argument("--quality", type=int, default=92, help="JPEG quality (full-screen heroes: 90-92)")
    ap.add_argument("--only", default=None, help="filter by state prefix: cold | warm | enr")
    ap.add_argument("--limit", type=int, default=0, help="cap number generated (smoke test)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    # ---- read CSV, dedupe by imageFile (one image per option, prompt is identical per row) ----
    with open(args.csv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    seen = {}
    jobs = []  # (imageFile, prompt, rich)
    for r in rows:
        fn = r["imageFile"].strip()
        if fn in seen:
            continue
        seen[fn] = True
        if args.only and not fn.startswith(args.only):
            continue
        jobs.append((fn, r["imagePrompt"].strip(), r.get("rich", "")))

    log(f"{len(jobs)} candidate images "
        f"(filter={args.only or 'none'}). Model={args.model}, aspect={args.aspect}.")

    # ---- dry run: no credentials needed ----
    if args.dry_run:
        for fn, prompt, rich in jobs[: (args.limit or len(jobs))]:
            log(f"  WOULD GENERATE  {args.prefix}{fn}")
        log("Dry run complete — no API calls made.")
        return

    # ---- validate config before importing heavy SDKs ----
    missing = [k for k, v in {"--project/GOOGLE_CLOUD_PROJECT": args.project,
                              "--bucket/GCS_BUCKET": args.bucket}.items() if not v]
    if missing:
        log(f"FATAL: missing required config: {', '.join(missing)}")
        sys.exit(1)

    # ---- lazy imports so --dry-run works without the SDKs installed ----
    try:
        from google import genai
        from google.genai import types
        from google.cloud import storage
        from google.genai import errors as genai_errors
        from PIL import Image
        import io
    except ImportError as e:
        log(f"FATAL: missing dependency ({e}). Run: pip install google-genai google-cloud-storage pillow")
        sys.exit(1)

    # Gen AI SDK in Vertex mode (the vertexai.vision_models path is deprecated/removed).
    client = genai.Client(vertexai=True, project=args.project, location=args.location)
    bucket = storage.Client(project=args.project).bucket(args.bucket)

    def gcs_exists(name):
        return bucket.blob(args.prefix + name).exists()

    def to_tile_jpeg(raw_bytes):
        """Full-screen hero: keep the 16:9 image at full HD. Cover-fit to 1920x1080 only if the
        native output differs; do NOT shrink to a tile. Encode at high JPEG quality."""
        im = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        tw, th = args.width, args.height
        sw, sh = im.size
        if (sw, sh) != (tw, th):
            scale = max(tw / sw, th / sh)
            nw, nh = round(sw * scale), round(sh * scale)
            im = im.resize((nw, nh), Image.LANCZOS)
            left, top = (nw - tw) // 2, (nh - th) // 2
            im = im.crop((left, top, left + tw, top + th))
        out = io.BytesIO()
        im.save(out, format="JPEG", quality=args.quality, optimize=True, progressive=True)
        return out.getvalue()

    def gcs_upload(name, img_bytes):
        blob = bucket.blob(args.prefix + name)
        blob.upload_from_string(img_bytes, content_type="image/jpeg")

    def category_from_rich(rich):
        for tag in (rich or "").split("|"):
            if tag.startswith("cat:"):
                return tag.split(":", 1)[1]
        return None

    def generate_with_retry(prompt, rich):
        """Generate one 16:9 jpeg; full prompt = scene + shared style suffix.
        Negative prompt = base negatives + any category-specific negatives."""
        full_prompt = f"{prompt} {STYLE_SUFFIX}"
        neg = BASE_NEGATIVE
        cat = category_from_rich(rich)
        if cat in CATEGORY_NEGATIVE:
            neg = f"{neg}, {CATEGORY_NEGATIVE[cat]}"
        delay, deadline = 1.0, time.monotonic() + 300.0
        while True:
            try:
                resp = client.models.generate_images(
                    model=args.model,
                    prompt=full_prompt,
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        aspect_ratio=args.aspect,
                        output_mime_type="image/jpeg",
                        negative_prompt=neg,
                    ),
                )
                gen = resp.generated_images
                if not gen:
                    return None  # safety-filtered or empty
                return gen[0].image.image_bytes
            except genai_errors.APIError as exc:
                is_rate = getattr(exc, "code", None) == 429
                if not is_rate or time.monotonic() + delay > deadline:
                    raise
                time.sleep(delay)
                delay = min(delay * 2.0, 60.0)

    made = skipped = failed = 0
    for fn, prompt, rich in jobs:
        if args.limit and made >= args.limit:
            log(f"Hit --limit {args.limit}; stopping.")
            break
        if gcs_exists(fn):
            skipped += 1
            log(f"  skip (exists)   {args.prefix}{fn}")
            continue
        try:
            img = generate_with_retry(prompt, rich)
            if img is None:
                failed += 1
                log(f"  FAILED (no image / filtered)  {fn}")
                continue
            img = to_tile_jpeg(img)          # downscale + recompress for the tile
            gcs_upload(fn, img)
            made += 1
            log(f"  made  {args.prefix}{fn}  ({len(img)//1024} KB)")
        except Exception as e:  # noqa: BLE001 - keep going on per-image errors
            failed += 1
            log(f"  ERROR  {fn}: {e}")

    log("")
    log(f"Done. made={made}  skipped={skipped}  failed={failed}")
    base = f"https://storage.googleapis.com/{args.bucket}/{args.prefix}"
    log(f"IMAGE_BASE_URL for the prototype = {base}")
    if failed:
        log("Some images failed — re-run the script; skip-if-exists means only the failures retry.")


if __name__ == "__main__":
    main()
