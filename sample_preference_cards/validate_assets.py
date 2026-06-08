"""
validate_assets.py — validate content_bank_vibe_cards.csv against the naming convention
and optionally check that every referenced image actually resolves (locally or in GCS).

NAMING CONVENTION:  {state}_q{NN}_o{N}[_v{N}].{ext}
  state: cold | warm | enr
  q{NN}: zero-padded question number (q01…q50)
  o{N}:  option number (o1…o6)
  _v{N}: optional version suffix (_v2)
  ext:   jpg | jpeg | png | webp

USAGE:
  # 1. Convention check only (fast — no network)
  python3 validate_assets.py content_bank_vibe_cards.csv

  # 2. Convention check + verify local image copies exist
  python3 validate_assets.py content_bank_vibe_cards.csv --images ./local_copy

  # 3. Convention check + verify images are reachable in GCS
  python3 validate_assets.py content_bank_vibe_cards.csv --gcs glance-vibe-cards

  Writes expected_images.txt (one filename per line, sorted).
"""

import argparse
import csv
import re
import sys
import os
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError

CONVENTION = re.compile(
    r'^(cold|warm|enr)_q(\d{2})_o(\d)(_v\d+)?\.(jpg|jpeg|png|webp)$'
)
VALID_STATES = {"cold", "warm", "enr"}
GCS_PUBLIC   = "https://storage.googleapis.com/{bucket}/{file}"


def parse_args():
    p = argparse.ArgumentParser(description="Validate vibe card CSV and image assets")
    p.add_argument("csv",             help="CSV file path")
    p.add_argument("--images",        help="Local directory to check image files")
    p.add_argument("--gcs",           help="GCS bucket name to check reachability")
    p.add_argument("--out", default="expected_images.txt", help="Output filename list")
    return p.parse_args()


def load_rows(csv_path):
    with open(csv_path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def check_convention(image_file, row_state):
    """Return list of error strings, empty = OK."""
    errs = []
    m = CONVENTION.match(image_file)
    if not m:
        errs.append(f"  BAD PATTERN: '{image_file}' — expected {CONVENTION.pattern}")
        return errs
    state, q, o, _, ext = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
    if state not in VALID_STATES:
        errs.append(f"  BAD STATE: '{state}' not in {VALID_STATES}")
    # 'enriched' is abbreviated to 'enr' in filenames (per spec)
    csv_state_abbrev = row_state.lower().replace("enriched", "enr") if row_state else None
    if csv_state_abbrev and state != csv_state_abbrev:
        errs.append(f"  STATE MISMATCH: filename '{state}' vs CSV state '{row_state}' (expected '{csv_state_abbrev}')")
    return errs


def check_local(image_file, images_dir):
    path = Path(images_dir) / image_file
    if not path.exists():
        return f"  LOCAL MISSING: {path}"
    return None


def check_gcs(image_file, bucket):
    url = GCS_PUBLIC.format(bucket=bucket, file=image_file)
    try:
        with urlopen(url, timeout=8) as r:
            if r.status != 200:
                return f"  GCS NOT 200: {url} ({r.status})"
    except URLError as e:
        return f"  GCS UNREACHABLE: {url} ({e})"
    return None


def main():
    args = parse_args()
    rows = load_rows(args.csv)

    errors = []
    expected = set()
    seen_files = {}

    required_cols = {"imageFile", "state"}
    actual_cols = set(rows[0].keys()) if rows else set()
    missing_cols = required_cols - actual_cols
    if missing_cols:
        print(f"ERROR: CSV missing required columns: {missing_cols}")
        sys.exit(1)

    for i, row in enumerate(rows, 1):
        image_file = row.get("imageFile", "").strip()
        state      = row.get("state", "").strip()

        if not image_file:
            errors.append(f"Row {i}: empty imageFile")
            continue

        # convention
        conv_errs = check_convention(image_file, state)
        for e in conv_errs:
            errors.append(f"Row {i} ({image_file}): {e}")

        # duplicate detection
        if image_file in seen_files:
            errors.append(f"Row {i}: DUPLICATE imageFile '{image_file}' (first seen row {seen_files[image_file]})")
        else:
            seen_files[image_file] = i

        expected.add(image_file)

        # local check
        if args.images:
            err = check_local(image_file, args.images)
            if err:
                errors.append(f"Row {i}: {err}")

        # GCS check
        if args.gcs:
            err = check_gcs(image_file, args.gcs)
            if err:
                errors.append(f"Row {i}: {err}")

    # write expected_images.txt
    sorted_expected = sorted(expected)
    with open(args.out, "w") as f:
        f.write("\n".join(sorted_expected) + "\n")
    print(f"expected_images.txt written ({len(sorted_expected)} files)")

    # summary
    if errors:
        print(f"\n{'='*60}\nVALIDATION FAILED — {len(errors)} error(s):\n")
        for e in errors:
            print(e)
        sys.exit(1)
    else:
        print(f"VALIDATION PASSED — {len(rows)} rows, {len(expected)} unique images, 0 errors ✓")


if __name__ == "__main__":
    main()
