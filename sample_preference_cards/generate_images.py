"""
generate_images.py — Vertex AI Imagen generation + GCS upload for vibe card tiles.

INPUT:  content_bank_vibe_cards.csv  (imageFile + imagePrompt columns)
OUTPUT: every row has a matching public object at IMAGE_BASE_URL + imageFile

CONTRACT:
  - Skip-if-exists: re-runs are cheap; regenerating 3 images never re-runs 200.
  - Naming enforced: {state}_q{NN}_o{N}.jpg
  - Images live in GCS, not committed to the repo.

USAGE:
  python3 generate_images.py [options]

OPTIONS:
  --csv PATH         CSV file (default: content_bank_vibe_cards.csv)
  --project ID       GCP project (overrides GOOGLE_CLOUD_PROJECT env var)
  --bucket NAME      GCS bucket (overrides GCS_BUCKET env var)
  --prefix PREFIX    GCS key prefix, e.g. glance/ (overrides GCS_PREFIX env var)
  --location REGION  Vertex AI region (default: us-central1 or GOOGLE_CLOUD_LOCATION)
  --model MODEL      Imagen model ID (default: imagen-3.0-generate-002)
  --only STATE       Only generate images for this state: cold | warm | enr
  --limit N          Stop after generating N images (smoke-test mode)
  --dry-run          Print what would run without generating anything

SETUP:
  pip install google-genai google-cloud-storage pillow
  gcloud auth application-default login

WORKFLOW:
  1. Set env vars or pass flags for project + bucket.
  2. Smoke test:   python3 generate_images.py --limit 4
  3. Generate all: python3 generate_images.py
     -- or by state:
        python3 generate_images.py --only cold
        python3 generate_images.py --only warm
        python3 generate_images.py --only enr
  4. At the end, the script prints:
       IMAGE_BASE_URL for the prototype = https://storage.googleapis.com/<bucket>/<prefix>
     Copy that URL into vibe_cards_prototype.html as IMAGE_BASE_URL.
"""

import argparse
import csv
import io
import os
import sys
import time

# ── DEFAULTS (override with env vars or flags) ────────────────────────────────
DEFAULT_PROJECT  = os.environ.get("GOOGLE_CLOUD_PROJECT", "glanceai-sandbox-8372")
DEFAULT_BUCKET   = os.environ.get("GCS_BUCKET",           "glance-vibe-cards")
DEFAULT_PREFIX   = os.environ.get("GCS_PREFIX",           "glance/")
DEFAULT_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION","us-central1")
DEFAULT_MODEL    = "imagen-3.0-generate-002"
DEFAULT_CSV      = "content_bank_vibe_cards.csv"
TARGET_LONG_EDGE = 960       # downscale to 960×540
TARGET_MAX_KB    = 150       # per-image size cap
JPEG_QUALITY     = 80

STYLE_PREFIX = (
    "Cinematic, warm, premium lifestyle photography. Soft natural light, "
    "shallow depth of field, filmic colour grade. Calm and aspirational. "
    "Composed with clean space in the lower 20-25% for a text overlay. "
    "No people's faces in focus (figures may appear distant or out of focus). "
    "No text, no logos, no watermarks, no readable signage. "
    "Shot for a large premium TV screen. "
)
NEGATIVE_PROMPT = (
    "text, words, letters, logos, watermarks, brand names, identifiable faces, "
    "deformed hands, cluttered, low-res, oversaturated, cartoon, illustration, "
    "team logos, scoreboards, readable banners, religious symbols, offensive content"
)
# ─────────────────────────────────────────────────────────────────────────────


def parse_args():
    p = argparse.ArgumentParser(description="Generate vibe card images via Vertex Imagen + store in GCS")
    p.add_argument("--csv",      default=DEFAULT_CSV,      help="Input CSV path")
    p.add_argument("--project",  default=DEFAULT_PROJECT,  help="GCP project ID")
    p.add_argument("--bucket",   default=DEFAULT_BUCKET,   help="GCS bucket name (no gs://)")
    p.add_argument("--prefix",   default=DEFAULT_PREFIX,   help="GCS key prefix (e.g. glance/)")
    p.add_argument("--location", default=DEFAULT_LOCATION, help="Vertex AI region")
    p.add_argument("--model",    default=DEFAULT_MODEL,    help="Imagen model ID")
    p.add_argument("--only",     choices=["cold","warm","enr"], help="Only generate for this state")
    p.add_argument("--limit",    type=int, default=0,      help="Stop after N images (0 = all)")
    p.add_argument("--dry-run",  action="store_true",      help="Print plan, don't generate")
    return p.parse_args()


def load_rows(csv_path, only_state=None):
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if only_state:
        rows = [r for r in rows if r["state"] == only_state]
    return rows


def gcs_key(prefix, image_file):
    return f"{prefix}{image_file}" if prefix else image_file


def gcs_exists(bucket, key):
    return bucket.blob(key).exists()


def compress(raw_bytes):
    from PIL import Image
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    w, h = img.size
    if max(w, h) > TARGET_LONG_EDGE:
        s = TARGET_LONG_EDGE / max(w, h)
        img = img.resize((int(w * s), int(h * s)), Image.LANCZOS)
    q = JPEG_QUALITY
    while q >= 50:
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=q, optimize=True)
        if len(buf.getvalue()) <= TARGET_MAX_KB * 1024:
            return buf.getvalue()
        q -= 5
    return buf.getvalue()


def generate_image(gen_client, model, prompt):
    from google.genai import types
    result = gen_client.models.generate_images(
        model=model,
        prompt=STYLE_PREFIX + prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="16:9",
            output_mime_type="image/jpeg",
            negative_prompt=NEGATIVE_PROMPT,
        ),
    )
    return result.generated_images[0].image.image_bytes


def store_image(bucket, key, image_bytes):
    blob = bucket.blob(key)
    blob.upload_from_string(image_bytes, content_type="image/jpeg")


def image_base_url(bucket_name, prefix):
    return f"https://storage.googleapis.com/{bucket_name}/{prefix}"


def main():
    args = parse_args()

    # Normalise prefix: ensure trailing slash if non-empty
    prefix = args.prefix
    if prefix and not prefix.endswith("/"):
        prefix += "/"

    rows = load_rows(args.csv, args.only)
    base_url = image_base_url(args.bucket, prefix)

    print(f"CSV rows to process : {len(rows)}")
    print(f"GCS destination     : gs://{args.bucket}/{prefix}")
    print(f"Model               : {args.model}")
    if args.limit:
        print(f"Limit               : {args.limit} images")
    if args.dry_run:
        print("\n[DRY RUN — no images will be generated]\n")
        for r in rows[:args.limit or len(rows)]:
            print(f"  WOULD generate: {r['imageFile']}  prompt: {r['imagePrompt'][:60]}…")
        print(f"\nIMAGE_BASE_URL for the prototype = {base_url}")
        return

    # Lazy imports so --dry-run works without packages
    import vertexai
    from google import genai
    from google.cloud import storage

    vertexai.init(project=args.project, location=args.location)
    gen_client  = genai.Client(vertexai=True, project=args.project, location=args.location)
    gcs_client  = storage.Client()
    bucket      = gcs_client.bucket(args.bucket)

    ok = skip = fail = 0
    generated = 0

    for r in rows:
        if args.limit and generated >= args.limit:
            break

        target   = r["imageFile"]
        prompt   = r.get("imagePrompt", "")
        key      = gcs_key(prefix, target)

        if not target or not prompt:
            print(f"  SKIP (missing imageFile or imagePrompt): {r}")
            skip += 1
            continue

        if gcs_exists(bucket, key):
            skip += 1
            print(f"  SKIP (exists in GCS): {target}")
            continue

        print(f"  Generating: {target}  [{r['state']} q{r['question_no']} o{r['option_no']}]")
        for attempt in range(1, 4):
            try:
                raw   = generate_image(gen_client, args.model, prompt)
                data  = compress(raw)
                store_image(bucket, key, data)
                print(f"    ✓ uploaded {target} ({len(data)//1024} KB)")
                ok += 1
                generated += 1
                break
            except Exception as e:
                print(f"    attempt {attempt}/3 failed: {e}")
                time.sleep(5)
        else:
            print(f"    FAILED after 3 attempts: {target}")
            fail += 1

        time.sleep(1)  # be kind to the API

    print(f"\n{'='*60}")
    print(f"Generated: {ok}  |  Skipped: {skip}  |  Failed: {fail}")
    print(f"\nIMAGE_BASE_URL for the prototype = {base_url}")

    if fail:
        print(f"\n{fail} image(s) failed. Re-run the same command — only failures will retry.")
        sys.exit(1)


if __name__ == "__main__":
    main()
