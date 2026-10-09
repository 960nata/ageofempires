# Sprite isolation — 0.24.3

## Scope and cause
Fixed-grid atlas slicing and bounding boxes around every opaque pixel were including fragments of neighbouring objects. Several unit metadata rectangles also cut through bodies, heads and weapons. Individual era PNGs sometimes already contained partial neighbours before runtime loading.

The installed pack contains **406 sheets / 6,708 frame entries**. Primary faction animation, regional buildings, walls/gates, walking, combat, villagers, production workers and legacy fallback renderers now use the same exact rectangles as the packed images. Frame masks follow the new coordinates. Each frame has four transparent pixels inside its rectangle and two additional pixels between the rectangle and cell edge. Character source dimensions are retained for scale calculation.

Component extraction runs offline, not during each rendered frame. Existing source files are preserved. This release repacks existing art; it does not add newly drawn poses or guarantee anatomically correct generated animation.

## Visually inspected examples
- Khmer Castle wall: removed neighbouring roof fragments and recovered the full tower top from the adaptive source region.
- Roman Feudal building 07: removed the slice of a neighbouring house on the left.
- Camel spear attack, east-facing pose 5: recovered the head/weapon extending beyond the old frame and excluded the previous pose's weapon fragment.
- Hijab worker mining: full worker extraction replaces fixed-grid clipping and neighbouring remnants.
- Regional fortification, female work, horse archer and individual era contact sheets were reviewed during processing.
- Live browser: Chinese Castle Age settlement, ordinary buildings, villagers, faction troops and wheat rendered. Captured console contained no errors or warnings during this short inspection. The review session was paused and closed without saving.

## Incomplete source art
`roman-feudal-10`, `roman-feudal-11`, and `persian-dark-west-10` are excluded from direct scene rendering after visual review. The scene chooses an intact alternative view of the same building and era. Most core buildings already use the existing 800-cell facade/lifecycle pack. Missing views are not reconstructed by this crop operation.

`suspectSourceCrop` is a heuristic review hint for tightly cropped individual era sources, not an automatic rejection. Long outer walls can trigger it. Only the three confirmed sources above set `complete: false`.

Composite trees, quarry/mineral clusters, orchard grasses, rubble, disasters and tree-fall retain original handling because disconnected fragments may be intentional. The previous packed facade/lifecycle atlas remains unchanged.

## Build status and limits
- TypeScript compilation: passed.
- Production build: passed. Vite reports a main-bundle size warning (940.43 kB minified / 237.10 kB gzip); broader loading/performance work remains separate.
- No gameplay simulation suite or all-device benchmark was run for this asset cleanup.
- Thousands of entries were processed; not every pose has been individually visually certified. Source anatomy, pose consistency and true rear/eight-direction building art remain subject to art review.

## Reproduction
Run `python3 scripts/isolate-sprite-atlases.py --root . --out /tmp/iron-crown-isolated` with Pillow, NumPy and SciPy available. Install the matching manifest and AVIF/WebP pairs together; never replace image files while retaining the old rectangles. Optional `--only` accepts comma-separated stem substrings for a staged rebuild. `ATLAS-ISOLATION-0.24.3.json` records original source paths and per-sheet processing details.
