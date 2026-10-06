# Villager work verification — 0.20.1

Run `npm run check:villager-work` after installing project dependencies. This executes the real World simulation bundled by the existing esbuild dependency. It does not use a mocked pathfinder or browser renderer.

## Reproduced defect

Four villagers ordered to the center tree of a dense 3×3 grove produced **0 wood after 120 simulation seconds** before this patch. They kept retrying an obstructed approach without selecting another standing position or a nearby accessible tree.

## Final simulation results

| Scenario | Simulated duration | Result |
| --- | --- | --- |
| Wood: exhaust selected source and continue nearby | 120 s | 32 wood deposited; second source harvested |
| Gold: exhaust selected source and continue nearby | 120 s | 32 gold deposited |
| Stone: exhaust selected source and continue nearby | 120 s | 32 stone deposited |
| Wild food: exhaust selected source and continue nearby | 120 s | 44 food deposited |
| Farm, starting at zero growth | 150 s | Matured and deposited 48 food |
| Orchard, starting at zero growth | 150 s | Matured and deposited 36 food |
| Four villagers ordered to enclosed grove center | 120 s | 138 wood deposited, six trees felled; workers still active |
| Save/restore the working grove | additional 60 s | 42 additional wood deposited |
| Two builders construct then repair house | 70 s + 50 s | Construction 100%; repaired to 320/320 HP |

The regression script asserts depletion, continued deposits, task commodity preservation, productive group behavior, save/restore continuation, and completed construction/repair. TypeScript compilation passes.

## Behavior changes

- Orders remember commodity and original gathering area.
- Villagers reserve clear, reachable standing positions, including across neighboring work targets.
- Blocked sources are temporarily skipped; search continues through nearby visible sources.
- No-progress monitoring survives route replans and triggers repositioning/resource fallback.
- Workers can yield laterally when passing each other; their drawn facing follows steering/work direction instead of collision separation nudges.
- Drop-off selection checks an actual work position around the depot.

No new animation source poses were added. Browser visual acceptance, all-map traffic guarantees, and MacBook frame-rate measurements are not established by these simulation checks.
