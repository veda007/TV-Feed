"""
generate_images.py — Vertex AI Imagen generation + GCS upload for vibe card tiles.

INPUT:  content_bank_vibe_cards.csv  (imageFile + imagePrompt columns)
OUTPUT: every row has a matching public object at IMAGE_BASE_URL + imageFile

CONTRACT:
  - Skip-if-exists: re-runs are cheap; regenerating 3 images never re-runs 300.
  - Naming enforced: {state}_q{NN}_o{N}[_v{N}].{ext} (validated by validate_assets.py).
  - No image is committed to GitHub — all images live in GCS.

USAGE:
  python3 generate_images.py [--csv content_bank_vibe_cards.csv] [--bucket BUCKET_NAME]

SETUP:
  pip install google-cloud-aiplatform google-cloud-storage
  gcloud auth application-default login
  # Make the bucket public: gsutil iam ch allUsers:objectViewer gs://BUCKET_NAME
"""

import argparse
import csv
import io
import sys
import time

# ── CONFIG ── swap before first run ──────────────────────────────────────────
DEFAULT_BUCKET   = "glance-vibe-cards"         # GCS bucket name
GCP_PROJECT      = "glanceai-sandbox-8372"     # your GCP project
GCP_LOCATION     = "us-central1"               # Vertex AI region
IMAGEN_MODEL     = "imagen-3.0-generate-002"
IMAGE_ASPECT     = "16:9"
IMAGE_MIME       = "image/jpeg"
STYLE_PREFIX     = (
    "Cinematic, warm, premium lifestyle photography. Soft natural light, "
    "shallow depth of field, filmic colour grade. Calm and aspirational. "
    "Composed with empty/darker space in the lower third for text overlay. "
    "No people's faces in focus. No text, no logos, no watermarks. "
    "Shot for a large premium TV screen. "
)
NEGATIVE_PROMPT  = (
    "text, words, letters, logos, watermark, brand names, identifiable faces, "
    "deformed hands, cluttered, low-res, oversaturated, cartoon, illustration"
)
# ─────────────────────────────────────────────────────────────────────────────


def parse_args():
    p = argparse.ArgumentParser(description="Generate vibe card images via Vertex Imagen + store in GCS")
    p.add_argument("--csv",    default="content_bank_vibe_cards.csv", help="Input CSV path")
    p.add_argument("--bucket", default=DEFAULT_BUCKET,                help="GCS bucket name")
    p.add_argument("--dry-run", action="store_true",                  help="Print what would run, don't generate")
    return p.parse_args()


def load_rows(csv_path):
    with open(csv_path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def gcs_exists(bucket, image_file):
    blob = bucket.blob(image_file)
    return blob.exists()


def store_image(bucket, image_bytes, image_file):
    """Upload image_bytes to GCS as image_file. Public if bucket ACL allows."""
    blob = bucket.blob(image_file)
    blob.upload_from_string(image_bytes, content_type="image/jpeg")
    print(f"  ✓ uploaded → gs://{bucket.name}/{image_file}")


def generate_image(client, prompt):
    """Call Vertex Imagen; return raw image bytes."""
    from google.genai import types
    result = client.models.generate_images(
        model=IMAGEN_MODEL,
        prompt=STYLE_PREFIX + prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio=IMAGE_ASPECT,
            output_mime_type=IMAGE_MIME,
            negative_prompt=NEGATIVE_PROMPT,
        ),
    )
    return result.generated_images[0].image.image_bytes


def main():
    args = parse_args()
    rows = load_rows(args.csv)
    print(f"CSV rows: {len(rows)}, bucket: {args.bucket}")

    if args.dry_run:
        for r in rows:
            print(f"  WOULD generate: {r['imageFile']}  prompt: {r['imagePrompt'][:60]}…")
        return

    # Lazy imports so --dry-run works without the packages installed
    import vertexai
    from google import genai
    from google.cloud import storage

    vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)
    gen_client = genai.Client(vertexai=True, project=GCP_PROJECT, location=GCP_LOCATION)
    gcs_client = storage.Client()
    bucket     = gcs_client.bucket(args.bucket)

    ok = skip = fail = 0
    for r in rows:
        target = r["imageFile"]
        prompt = r.get("imagePrompt", "")
        if not target or not prompt:
            print(f"  SKIP (missing imageFile or imagePrompt): {r}")
            skip += 1
            continue

        if gcs_exists(bucket, target):
            print(f"  SKIP (already in GCS): {target}")
            skip += 1
            continue

        print(f"  Generating: {target}")
        for attempt in range(1, 4):
            try:
                image_bytes = generate_image(gen_client, prompt)
                store_image(bucket, image_bytes, target)
                ok += 1
                break
            except Exception as e:
                print(f"    attempt {attempt}/3 failed: {e}")
                time.sleep(5)
        else:
            print(f"    FAILED after 3 attempts: {target}")
            fail += 1
        time.sleep(1)  # be kind to the API

    print(f"\nDone — generated: {ok}, skipped: {skip}, failed: {fail}")
    if fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
