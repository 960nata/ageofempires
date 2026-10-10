"""Isolate generated maritime key poses into fixed, transparent WebP atlases.

Run from the repository root after editing the source PNGs in art-src/isometric.
The connected-component mask separates long oars and nets that cross the
nominal 2x4 source grid, so no neighbour's pixels enter a sprite frame.
"""

from pathlib import Path
import json

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art-src/isometric"
OUTPUT = ROOT / "public/assets/isometric"

FISHING = [
    "fishing-boat-directions-v1",
    "fishing-boat-row-forward-v1",
    "fishing-boat-row-pull-v1",
    "fishing-boat-cast-v1",
    "fishing-boat-set-v1",
    "fishing-boat-haul-v1",
]
WHALING = [
    "whaling-boat-directions-v1",
    "whaling-boat-row-forward-v1",
    "whaling-boat-row-pull-v1",
    "whaling-boat-harpoon-v1",
    "whaling-boat-throw-v1",
    "whaling-boat-haul-v1",
]


def isolate(name: str) -> list[Image.Image]:
    original = Image.open(SOURCE / f"{name}.png").convert("RGBA")
    rgba = np.asarray(original)
    alpha = rgba[:, :, 3]
    pieces: list[Image.Image] = []
    for row in range(2):
        top = row * original.height // 2
        bottom = (row + 1) * original.height // 2
        mask = (alpha[top:bottom] > 90).astype(np.uint8)
        count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
        components = sorted(
            ((label, stats[label]) for label in range(1, count) if stats[label, cv2.CC_STAT_AREA] > 1500),
            key=lambda item: item[1][cv2.CC_STAT_AREA], reverse=True,
        )[:4]
        if len(components) != 4:
            raise ValueError(f"{name} row {row}: expected four separate boat silhouettes, found {len(components)}")
        for label, _ in sorted(components, key=lambda item: item[1][cv2.CC_STAT_LEFT]):
            # Keep antialiasing around this boat while excluding adjacent boats.
            own = cv2.dilate((labels == label).astype(np.uint8), np.ones((5, 5), np.uint8))
            ys, xs = np.where(own > 0)
            x0, x1 = max(0, int(xs.min()) - 3), min(original.width, int(xs.max()) + 4)
            y0, y1 = max(0, int(ys.min()) - 3), min(bottom - top, int(ys.max()) + 4)
            crop = rgba[top + y0:top + y1, x0:x1].copy()
            crop[:, :, 3] = np.where(own[y0:y1, x0:x1] > 0, crop[:, :, 3], 0)
            pieces.append(Image.fromarray(crop))
    return pieces


def pack(names: list[str], cell: tuple[int, int], output: str) -> None:
    poses = [isolate(name) for name in names]
    max_width = max(frame.width for row in poses for frame in row)
    max_height = max(frame.height for row in poses for frame in row)
    width, height = cell
    scale = min((width - 12) / max_width, (height - 10) / max_height)
    atlas = Image.new("RGBA", (width * 4, height * len(names) * 2))
    for phase, row in enumerate(poses):
        for direction, frame in enumerate(row):
            size = (max(1, round(frame.width * scale)), max(1, round(frame.height * scale)))
            sprite = frame.resize(size, Image.Resampling.LANCZOS)
            x = direction % 4 * width + (width - size[0]) // 2
            y = (phase * 2 + direction // 4) * height + height - size[1] - 3
            atlas.alpha_composite(sprite, (x, y))
    atlas.save(OUTPUT / output, "WEBP", quality=82, method=6)
    print(output, atlas.size, (OUTPUT / output).stat().st_size)


def harbor() -> None:
    image = Image.open(SOURCE / "harbor-directions-v1.png").convert("RGBA")
    rgba = np.asarray(image)
    count, labels, stats, _ = cv2.connectedComponentsWithStats((rgba[:, :, 3] > 90).astype(np.uint8), 8)
    components = sorted(((label, stats[label]) for label in range(1, count) if stats[label, cv2.CC_STAT_AREA] > 1500), key=lambda item: item[1][cv2.CC_STAT_AREA], reverse=True)[:4]
    if len(components) != 4:
        raise ValueError(f"Expected four isolated harbor silhouettes, found {len(components)}")
    rows = sorted(components, key=lambda item: item[1][cv2.CC_STAT_TOP] + item[1][cv2.CC_STAT_HEIGHT] / 2)
    ordered = sorted(rows[:2], key=lambda item: item[1][cv2.CC_STAT_LEFT]) + sorted(rows[2:], key=lambda item: item[1][cv2.CC_STAT_LEFT])
    pieces = []
    for label, _ in ordered:
        own = cv2.dilate((labels == label).astype(np.uint8), np.ones((5, 5), np.uint8))
        ys, xs = np.where(own > 0)
        x0, x1 = max(0, int(xs.min()) - 3), min(image.width, int(xs.max()) + 4)
        y0, y1 = max(0, int(ys.min()) - 3), min(image.height, int(ys.max()) + 4)
        crop = rgba[y0:y1, x0:x1].copy()
        crop[:, :, 3] = np.where(own[y0:y1, x0:x1] > 0, crop[:, :, 3], 0)
        pieces.append(Image.fromarray(crop))
    cell_width, cell_height = 384, 288
    scale = min((cell_width - 12) / max(p.width for p in pieces), (cell_height - 10) / max(p.height for p in pieces))
    atlas = Image.new("RGBA", (cell_width * 2, cell_height * 2))
    for index, piece in enumerate(pieces):
        sprite = piece.resize((round(piece.width * scale), round(piece.height * scale)), Image.Resampling.LANCZOS)
        x = index % 2 * cell_width + (cell_width - sprite.width) // 2
        y = index // 2 * cell_height + cell_height - sprite.height - 3
        atlas.alpha_composite(sprite, (x, y))
    atlas.save(OUTPUT / "harbor-directions-v1.webp", "WEBP", quality=83, method=6)
    print("harbor-directions-v1.webp", atlas.size, (OUTPUT / "harbor-directions-v1.webp").stat().st_size)


def prey() -> None:
    nature = ROOT / "public/assets/nature"
    manifest = json.loads((nature / "manifest.json").read_text())
    atlas = Image.new("RGBA", (4 * 128, 3 * 96))
    for row, (name, source_row) in enumerate((("anchovy-shrimp-motion-v1", 0), ("aquatic-wildlife-v1", 0), ("aquatic-wildlife-v1", 2))):
        image = Image.open(nature / manifest[name]["file"]).convert("RGBA")
        for frame, (x, y, width, height) in enumerate(manifest[name]["frames"][source_row]):
            sprite = image.crop((x, y, x + width, y + height))
            sprite.thumbnail((120, 88), Image.Resampling.LANCZOS)
            atlas.alpha_composite(sprite, (frame * 128 + (128 - sprite.width) // 2, row * 96 + 96 - sprite.height - 4))
    atlas.save(OUTPUT / "marine-prey-v1.webp", "WEBP", quality=80, method=6)
    print("marine-prey-v1.webp", atlas.size, (OUTPUT / "marine-prey-v1.webp").stat().st_size)


if __name__ == "__main__":
    pack(FISHING, (192, 192), "fishing-boat-frames-v1.webp")
    pack(WHALING, (256, 192), "whaling-boat-frames-v1.webp")
    harbor()
    prey()
