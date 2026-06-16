"""
generate_local.py — generate vibe card images to local assets/ folder.
Skips files that already exist. Run from the sample_preference_cards/ directory.

Usage:
  python3 generate_local.py [--only cold|warm|enr] [--limit N]
"""
import argparse, csv, io, os, sys, time
from pathlib import Path

PROJECT  = "glanceai-sandbox-8372"
LOCATION = "us-central1"
MODEL    = "imagen-3.0-generate-002"
OUT_DIR  = Path("assets")
LONG_EDGE = 960
MAX_KB    = 150
JPEG_Q    = 80

STYLE = (
    "Cinematic, warm, premium lifestyle photography. Soft natural light, "
    "shallow depth of field, filmic colour grade. Calm and aspirational. "
    "Composed with clean space in the lower 20-25% for a text overlay. "
    "No people's faces in focus. No text, no logos, no watermarks, no readable signage. "
    "Shot for a large premium TV screen. "
)
NEG = (
    "text, words, letters, logos, watermarks, brand names, identifiable faces, "
    "deformed hands, cluttered, low-res, oversaturated, cartoon, illustration, "
    "team logos, scoreboards, readable banners"
)

def compress(raw):
    from PIL import Image
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = img.size
    if max(w,h) > LONG_EDGE:
        s = LONG_EDGE/max(w,h); img = img.resize((int(w*s),int(h*s)), Image.LANCZOS)
    q = JPEG_Q
    while q >= 50:
        buf = io.BytesIO(); img.save(buf,"JPEG",quality=q,optimize=True)
        if len(buf.getvalue()) <= MAX_KB*1024: return buf.getvalue()
        q -= 5
    return buf.getvalue()

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--only", choices=["cold","warm","enr"])
    p.add_argument("--limit", type=int, default=0)
    args = p.parse_args()

    OUT_DIR.mkdir(exist_ok=True)
    rows = list(csv.DictReader(open("content_bank_vibe_cards.csv")))
    if args.only:
        rows = [r for r in rows if r["state"]==args.only or
                (args.only=="enr" and r["state"]=="enriched")]

    from google import genai
    from google.genai import types
    import vertexai
    vertexai.init(project=PROJECT, location=LOCATION)
    client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)

    ok = skip = fail = done = 0
    for r in rows:
        if args.limit and done >= args.limit: break
        fname = r["imageFile"]; out = OUT_DIR/fname
        if out.exists() and out.stat().st_size > 5000:
            skip += 1; continue
        print(f"  [{r['state']} q{r['question_no']} o{r['option_no']}] {fname}")
        for attempt in range(1,4):
            try:
                res = client.models.generate_images(
                    model=MODEL, prompt=STYLE+r["imagePrompt"],
                    config=types.GenerateImagesConfig(number_of_images=1,
                        aspect_ratio="16:9", output_mime_type="image/jpeg",
                        negative_prompt=NEG))
                data = compress(res.generated_images[0].image.image_bytes)
                out.write_bytes(data)
                print(f"    ✓ {fname} ({len(data)//1024} KB)")
                ok += 1; done += 1; break
            except Exception as e:
                print(f"    retry {attempt}: {e}"); time.sleep(6)
        else:
            print(f"    FAILED: {fname}"); fail += 1
        time.sleep(1)

    print(f"\nDone — generated:{ok}  skipped:{skip}  failed:{fail}")
    if fail: sys.exit(1)

if __name__=="__main__": main()
