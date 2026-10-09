"""Re-slice the generated unit action atlases into clean, padded frame grids.

The generated v2 sheets do not respect their nominal 12-column grid: poses drift across cell lines,
weapons reach into neighbouring cells and the background carries a faint alpha haze. Cropping a
fixed cell (or a bounding box of everything opaque) therefore drags in parts of other frames.

For each atlas listed in src/rts/faction-animation-frames.json this script
  1. finds row/column cut lines in the emptiest gaps near the nominal grid lines,
  2. gives every opaque blob to the frame that owns most of it (blobs fused across a cut are split),
  3. drops the background haze and copies each frame alone into a padded cell of a new atlas,
  4. records the frame rect, ground line (lowest opaque row) and foot centre for anchoring.

Raw sheets live in art-src/isometric/raw/; clean sheets are written to art-src/isometric/ as
*-actions-v3.png. Run scripts/optimize-assets.py afterwards.

    python3 scripts/slice-unit-atlases.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "art-src", "isometric")
RAW = os.path.join(ART, "raw")
FRAMES = os.path.join(ROOT, "src", "rts", "faction-animation-frames.json")
SOLID = 100  # alpha that counts as the figure itself
EDGE = 2  # px of soft antialiased edge kept around each frame's solid pixels
PAD = 6  # transparent gutter around every packed frame
DROPPED = -2  # owner of a drawn pose that has no action slot
# Screen heading (right, down-right, ... up-right) -> atlas row. Seven-row sheets lack "up";
# they reuse the up-left row, as the earlier 7-row atlases did.
HEADINGS = {8: [0, 1, 2, 3, 4, 5, 6, 7], 7: [0, 1, 2, 3, 4, 5, 5, 6]}
# Sheets whose generator drew a different number of poses than the 12 action slots
# (idle, walk x3, run x3, windup, release, hit, fall, dead): drawn pose -> slot, None = unused.
COLUMNS = {
    "roman-infantry": [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11],  # no hit pose
    "ayyubid-infantry": [0, 1, 2, 3, 4, 5, 6, None, 7, 8, 9, 10, 11],  # extra guard pose
    "steppe-cavalry": [0, 1, 2, 3, 4, 5, 6, 7, 8, None, 9, 10, 11],  # extra follow-through
    "ayyubid-cavalry": [0, 1, 2, 3, 4, 5, 6, 7, 8, None, 9, 10, 11],  # extra follow-through
    "japanese-archer": [0, 1, 2, 3, 4, 5, 6, 7, 8, None, 9, 10, 11],  # extra follow-through
    "japanese-cavalry": [0, 1, 2, 3, 4, 5, 6, 7, 8, None, 9, 10, 11],  # extra follow-through
}


def cut(profile, guess, span):
    lo, hi = max(1, int(guess - span)), min(len(profile) - 1, int(guess + span))
    window = profile[lo:hi]
    best = window.min()
    # Middle of the emptiest run, so the cut sits in the gap rather than against one figure.
    idx = np.flatnonzero(window == best)
    runs = np.split(idx, np.flatnonzero(np.diff(idx) > 1) + 1)
    run = max(runs, key=len)
    return lo + int(run[len(run) // 2])


def bodies(solid, cw, ch):
    """Large blobs, with blobs that fuse several figures split in their thinnest gaps."""
    labels, _ = nd.label(solid, structure=np.ones((3, 3)))
    areas = np.bincount(labels.ravel())[1:]
    floor = 0.2 * np.percentile(areas, 99) if len(areas) else 0
    parts = []
    for i, sl in enumerate(nd.find_objects(labels), 1):
        if areas[i - 1] < floor:
            continue
        stack = [(sl[0].start, sl[1].start, labels[sl] == i)]
        while stack:
            y0, x0, mask = stack.pop()
            hh, ww = mask.shape
            cols_profile = mask.sum(0)
            n = max(2, round(ww / cw))
            at = cut(cols_profile, ww / n, ww / n * 0.4) if ww > 1.25 * cw else 0
            # Two touching figures meet at a thin neck; a wide single pose (a fallen horse) does not.
            if at and cols_profile[at] <= 0.3 * np.median(cols_profile[cols_profile > 0]):
                stack += [(y0, x0, mask[:, :at]), (y0, x0 + at, mask[:, at:])]
            elif hh > 1.6 * ch:
                n = round(hh / ch)
                at = cut(mask.sum(1), hh / n, hh / n * 0.4)
                stack += [(y0, x0, mask[:at]), (y0 + at, x0, mask[at:])]
            elif mask.sum() >= floor * 0.5:
                parts.append((y0, x0, mask))
    return parts


def split_rows(values, cell):
    """Rows are uneven in these sheets (and some have 7 headings, not 8): split the sorted ground
    lines wherever they jump by a good part of a cell."""
    order = np.argsort(values)
    gaps = np.diff(values[order])
    cuts = np.flatnonzero(gaps > cell * 0.45)
    row_of = np.zeros(len(values), int)
    for r, at in enumerate(cuts, 1):
        row_of[order[at + 1:]] = r
    return row_of


def slice_atlas(path, rows, cols, columns=None):
    rgba = np.array(Image.open(path).convert("RGBA"))
    alpha = rgba[:, :, 3]
    h, w = alpha.shape
    cw, ch = w / cols, h / rows
    solid = alpha > SOLID
    parts = bodies(solid, cw, ch)
    ground = np.array([y0 + np.nonzero(m.any(1))[0].max() for y0, _, m in parts], float)
    centre = np.array([x0 + np.nonzero(m.any(0))[0].mean() for _, x0, m in parts], float)
    row_of = split_rows(ground, ch)
    rows = int(row_of.max()) + 1

    owner = np.full((h, w), -1, np.int32)
    counts = []
    for r in range(rows):
        idx = [i for i in np.flatnonzero(row_of == r)]
        # Too few figures in the row: the widest one is two poses touching, split it.
        expected = len(columns) if columns else cols
        while len(idx) < expected:
            widths = [parts[i][2].shape[1] for i in idx]
            j = int(np.argmax(widths))
            if widths[j] < 1.5 * np.median(widths):
                break
            y0, x0, m = parts[idx[j]]
            at = cut(m.sum(0), m.shape[1] / 2, m.shape[1] * 0.3)
            for sub, sx in ((m[:, :at], x0), (m[:, at:], x0 + at)):
                parts.append((y0, sx, sub))
                centre = np.append(centre, sx + np.nonzero(sub.any(0))[0].mean())
            idx[j:j + 1] = [len(parts) - 2, len(parts) - 1]
        idx.sort(key=lambda i: centre[i])
        # Extra pieces (a dropped shield, a split rider) join their nearest neighbour in the row.
        groups = [[i] for i in idx]
        counts.append(len(groups))
        while len(groups) > (len(columns) if columns else cols):
            gx = [np.mean([centre[i] for i in g]) for g in groups]
            j = int(np.argmin(np.diff(gx)))
            groups[j:j + 2] = [groups[j] + groups[j + 1]]
        if columns and len(groups) == len(columns):
            slots = columns
        elif len(groups) == cols:
            slots = range(cols)
        else:
            slots = [min(cols - 1, max(0, int(np.mean([centre[i] for i in g]) // cw))) for g in groups]
        for slot, g in zip(slots, groups):
            for i in g:
                y0, x0, m = parts[i]
                view = owner[y0:y0 + m.shape[0], x0:x0 + m.shape[1]]
                view[m] = DROPPED if slot is None else r * cols + slot

    # Remaining opaque specks (spear tips, arrows, loose cloth) go to the nearest figure if close.
    body = owner != -1
    dist, (iy, ix) = nd.distance_transform_edt(~body, return_indices=True)
    loose = solid & ~body
    labels, _ = nd.label(loose, structure=np.ones((3, 3)))
    for i, sl in enumerate(nd.find_objects(labels), 1):
        m = labels[sl] == i
        d = dist[sl][m]
        if d.min() > 30:
            continue
        k = d.argmin()
        target = owner[iy[sl][m][k], ix[sl][m][k]]
        owner[sl][m] = target

    frames = []
    boxes = nd.find_objects(owner + 1, max_label=rows * cols)
    for f, box in enumerate(boxes):
        if box is None:
            frames.append(None)
            continue
        y0, x0 = max(0, box[0].start - EDGE), max(0, box[1].start - EDGE)
        y1, x1 = min(h, box[0].stop + EDGE), min(w, box[1].stop + EDGE)
        own = owner[y0:y1, x0:x1]
        core = own == f
        soft = nd.binary_dilation(core, iterations=EDGE) & (alpha[y0:y1, x0:x1] > 0) & ((own == -1) | core)
        piece = rgba[y0:y1, x0:x1].copy()
        piece[~soft] = 0
        cy, cx = np.nonzero(core)
        ground = cy.max()
        feet = cx[cy >= ground - max(4, (ground - cy.min()) * 0.12)]
        frames.append({"piece": piece, "ground": int(ground), "cx": float(feet.mean())})
    return frames, rows, counts


def pack(frames, rows, cols):
    live = [f for f in frames if f]
    cw = max(f["piece"].shape[1] for f in live) + PAD * 2
    ch = max(f["piece"].shape[0] for f in live) + PAD * 2
    sheet = np.zeros((ch * rows, cw * cols, 4), np.uint8)
    rects = []
    for i, f in enumerate(frames):
        r, c = divmod(i, cols)
        if not f:
            rects.append(None)
            continue
        ph, pw = f["piece"].shape[:2]
        x, y = int(c * cw + PAD), int(r * ch + PAD)
        sheet[y:y + ph, x:x + pw] = f["piece"]
        rects.append({"x": x, "y": y, "w": pw, "h": ph, "cx": round(x + f["cx"], 1), "ground": y + f["ground"]})
    return Image.fromarray(sheet), rects, ch


if __name__ == "__main__":
    data = json.load(open(FRAMES))
    only = set(sys.argv[1:])  # optional atlas keys, e.g. khmer-cavalry
    for key, atlas in data.items():
        if only and key not in only:
            continue
        raw_name = atlas.get("raw", atlas["file"])
        raw = os.path.join(RAW, raw_name)
        if not os.path.exists(raw):
            os.makedirs(RAW, exist_ok=True)
            os.rename(os.path.join(ART, raw_name), raw)
        declared, cols = len(atlas["frames"]), len(atlas["frames"][0])
        frames, rows, counts = slice_atlas(raw, declared, cols, COLUMNS.get(key))
        if rows not in HEADINGS:
            raise SystemExit(f"{key}: found {rows} rows of figures, expected 7 or 8")
        image, rects, ch = pack(frames, rows, cols)
        # A frame with no figure falls back to the nearest detected pose in the same heading.
        grid = []
        for r in range(rows):
            row = rects[r * cols:(r + 1) * cols]
            have = [c for c in range(cols) if row[c]]
            grid.append([row[c] or row[min(have, key=lambda k: abs(k - c))] for c in range(cols)])
        out = raw_name.rsplit("-actions-v", 1)[0] + "-actions-v3.png"
        image.save(os.path.join(ART, out), optimize=True)
        atlas.update(raw=raw_name, file=out, frames=grid, directions=HEADINGS[rows])
        # Scale reference: mean height of the standing pose across headings.
        atlas["nominal"] = round(sum(row[0]["h"] for row in grid) / rows, 3)
        missing = sum(1 for f in frames if not f)
        print(f"{key}: {rows} headings, {image.width}x{image.height}, missing {missing}, figures/row {counts}")
    with open(FRAMES, "w") as f:
        json.dump(data, f, separators=(",", ":"))
