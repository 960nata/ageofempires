# Character animation review — 0.24.4

## What changed
The renderer previously rounded movement to authored pose indices. Core faction troops used a large alpha blend that left duplicate cavalry legs. Villager movement and work snapped outright, combat often returned abruptly to idle, and horse movement could flip between walk/run near one threshold.

Shared pose sampling now preserves fractional step phases until rendering, aligns samples on the same foot point, times attack anticipation/release/recovery to the existing 0.5-second simulation strike, and gives horses separate thresholds for entering and leaving a run. Work, villager, generic walking/combat, faction, regional and production/training renderers use the same frame clock. Blended images take part in selection alpha masks.

Mounted travel has 6,384 source-aligned in-between samples across 22 AVIF/WebP atlas pairs. They are generated from existing art with bidirectional optical flow. They replace the translucent two-horse overlay during mounted movement when loaded. Original image sources remain untouched. Metadata is a separate async chunk; atlas images load for requested units. Images are at 75% source resolution with scale restored at draw time. Decoded image retention is limited to roughly 96 MiB; coarse-pointer devices use the simpler blend.

## Visual inspection
- In-browser gallery: male, female and hijab villagers; Roman and Mongol infantry, archers and cavalry; walking, mounted running, attacking, mining. The gallery uses the runtime sprite classes and lets viewers change realm, direction, activity and speed.
- Roman horse reference pair: ordinary alpha blend visibly doubled legs; optical intermediate generated a single aligned body and stepping legs.
- Current gallery views showed worker feet on the marked ground line, Mongol mounted motion, and separate Mongol infantry/archer silhouettes. Browser log contained no warnings or errors in these inspected states.
- Source limitations remain: faction movement still has only three authored key poses per gait, female work has four per facing and some regional actions have fewer headings. Interpolated poses can distort fast weapon or limb motion. Full production-quality natural gait requires new consistent authored animation, not more interpolation.

## Status
TypeScript and production build should be checked after this document update. No gameplay simulation suite or broad device benchmark was run as part of the art review. The gallery is at `/animation-review.html`; main game is at `/`.
