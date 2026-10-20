"""Convert the isometric PNG atlases to WebP/AVIF for the web build.

Source PNGs live in art-src/isometric/ (not deployed). Output goes to public/assets/isometric/.
Every atlas is encoded as AVIF and listed in src/rts/avif-assets.json.
Existing WebP files are retained as source/backups, not selected as the primary format.
Only stale or missing outputs are rebuilt. Requires Pillow 11.3+ (WebP and AVIF support).

    python3 scripts/optimize-assets.py
"""
import glob
import json
import os
from concurrent.futures import ProcessPoolExecutor

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "art-src", "isometric")
OUT = os.path.join(ROOT, "public", "assets", "isometric")
MANIFEST = os.path.join(ROOT, "src", "rts", "avif-assets.json")
WEBP_QUALITY = 88  # visually lossless for these painted atlases; alpha stays lossless
AVIF_QUALITY = 80  # ~35% smaller than the WebP setting at the same visual quality


def convert(src):
    name = os.path.basename(src)[:-4]
    webp = os.path.join(OUT, name + ".webp")
    fmt = "AVIF"
    out = os.path.join(OUT, name + ".avif")
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
        return name, fmt, os.path.getsize(src), os.path.getsize(out)
    image = Image.open(src)
    if image.mode not in ("RGBA", "RGB"):
        image = image.convert("RGBA")
    if fmt == "WEBP":
        image.save(out, "WEBP", quality=WEBP_QUALITY, method=4, alpha_quality=100)
    else:
        image.save(out, "AVIF", quality=AVIF_QUALITY, speed=6, subsampling="4:4:4")
    return name, fmt, os.path.getsize(src), os.path.getsize(out)


if __name__ == "__main__":
    files = sorted(glob.glob(os.path.join(SRC, "*.png")))
    os.makedirs(OUT, exist_ok=True)
    with ProcessPoolExecutor(6) as pool:
        results = list(pool.map(convert, files))
    avif = sorted(os.path.relpath(path, OUT)[:-5] for path in glob.glob(os.path.join(OUT, "**", "*.avif"), recursive=True))
    with open(MANIFEST, "w") as f:
        json.dump(avif, f, indent=1)
        f.write("\n")
    before = sum(r[2] for r in results) / 1048576
    after = sum(r[3] for r in results) / 1048576
    print(f"{len(files)} atlases ({len(avif)} AVIF): {before:.1f} MB PNG -> {after:.1f} MB")
