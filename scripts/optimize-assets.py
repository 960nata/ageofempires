"""Convert the isometric PNG atlases to WebP for the web build.

Source PNGs live in art-src/isometric/ (not deployed). Output goes to public/assets/isometric/.
Only stale or missing WebP files are rebuilt. Requires Pillow with WebP support.

    python3 scripts/optimize-assets.py
"""
import glob
import os
from concurrent.futures import ProcessPoolExecutor

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "art-src", "isometric")
OUT = os.path.join(ROOT, "public", "assets", "isometric")
QUALITY = 88  # visually lossless for these painted atlases; alpha stays lossless


def convert(src):
    out = os.path.join(OUT, os.path.basename(src)[:-4] + ".webp")
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
        return os.path.getsize(src), os.path.getsize(out)
    image = Image.open(src)
    if image.mode not in ("RGBA", "RGB"):
        image = image.convert("RGBA")
    image.save(out, "WEBP", quality=QUALITY, method=4, alpha_quality=100)
    return os.path.getsize(src), os.path.getsize(out)


if __name__ == "__main__":
    files = sorted(glob.glob(os.path.join(SRC, "*.png")))
    os.makedirs(OUT, exist_ok=True)
    with ProcessPoolExecutor(6) as pool:
        sizes = list(pool.map(convert, files))
    before = sum(a for a, _ in sizes) / 1048576
    after = sum(b for _, b in sizes) / 1048576
    print(f"{len(files)} atlases: {before:.1f} MB PNG -> {after:.1f} MB WebP")
