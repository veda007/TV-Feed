#!/usr/bin/env python3
"""Generate Glance TV card images with Nano Banana (Gemini 2.5 Flash Image) on Vertex AI.

PRD §19 pipeline: project glanceai-prod-5aea, model gemini-2.5-flash-image,
responseModalities:["IMAGE"], aspectRatio 16:9, upscaled to 1920x1080, saved to content/images/.

Reads prompts from scripts/gen_manifest.json (a list of {"id","imagePrompt"} objects),
writes content/images/<id>.jpg for each. Requires a working gcloud access token:
    gcloud auth login   # if the token is stale

Usage:
    python3 scripts/gen_images.py                # generate every id in the manifest
    python3 scripts/gen_images.py t301 t305      # only these ids
"""
import base64, json, os, subprocess, sys, urllib.request, urllib.error

PROJECT = "glanceai-prod-5aea"
LOCATION = "global"
MODEL = "gemini-2.5-flash-image"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG_DIR = os.path.join(ROOT, "content", "images")
MANIFEST = os.path.join(HERE, "gen_manifest.json")


def token():
    # 1) explicit env var, 2) token file written by an interactive `gcloud` call,
    # 3) fall back to calling gcloud (works only if reauth isn't required).
    env = os.environ.get("GTV_TOKEN")
    if env and env.strip():
        return env.strip()
    tok_file = os.path.join(HERE, ".gtv_token")
    if os.path.exists(tok_file):
        with open(tok_file) as fh:
            t = fh.read().strip()
        if t and "ERROR" not in t and len(t) > 50:
            return t
    out = subprocess.run(["gcloud", "auth", "print-access-token"],
                         capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit("ERROR: no access token.\nRun this in your interactive prompt, then re-run me:\n"
                 "  gcloud auth print-access-token > scripts/.gtv_token\n\n" + out.stderr)
    return out.stdout.strip()


def generate(tok, prompt):
    """Call Vertex generateContent, return raw image bytes of the first IMAGE part."""
    url = (f"https://aiplatform.googleapis.com/v1/projects/{PROJECT}"
           f"/locations/{LOCATION}/publishers/google/models/{MODEL}:generateContent")
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "16:9"},
        },
    }
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.load(r)
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
    raise RuntimeError("no image part in response: " + json.dumps(data)[:400])


def upscale(path):
    """Upscale to 1920x1080 in place via macOS sips (best-effort)."""
    subprocess.run(["sips", "-z", "1080", "1920", path],
                   capture_output=True, text=True)


def main():
    with open(MANIFEST) as f:
        items = json.load(f)
    wanted = set(sys.argv[1:])
    if wanted:
        items = [i for i in items if i["id"] in wanted]
    if not items:
        sys.exit("nothing to generate (check ids / manifest)")
    os.makedirs(IMG_DIR, exist_ok=True)
    tok = token()
    ok, fail = [], []
    for it in items:
        cid, prompt = it["id"], it["imagePrompt"]
        out = os.path.join(IMG_DIR, f"{cid}.jpg")
        try:
            print(f"… {cid}", flush=True)
            img = generate(tok, prompt)
            with open(out, "wb") as fh:
                fh.write(img)
            upscale(out)
            ok.append(cid)
            print(f"  ✓ {out}", flush=True)
        except urllib.error.HTTPError as e:
            fail.append(cid)
            print(f"  ✗ {cid}: HTTP {e.code} {e.read()[:300]}", flush=True)
        except Exception as e:
            fail.append(cid)
            print(f"  ✗ {cid}: {e}", flush=True)
    print(f"\nDone. {len(ok)} ok, {len(fail)} failed.")
    if fail:
        print("failed:", " ".join(fail))
        sys.exit(1)


if __name__ == "__main__":
    main()
