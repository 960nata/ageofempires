# Asset routing audit — 0.24.4

This pass follows the renderer's actual selection order so matching original art does not remain hidden behind a generic sprite.

## Unit art routed in gameplay

- English longbow, French knight, Mongol horse archer, Chinese repeating crossbow, Japanese samurai, Khmer war elephant, and Ayyubid camel lancer prefer their civilization signature atlases. Ayyubid light horse, Faris, and horse archer use their matching mounted atlases.
- Khmer horse movement is not represented by the mounted atlas: its current Khmer cavalry atlas depicts an elephant. The cavalry gallery therefore shows the Khmer war elephant and the signature elephant artwork; a Khmer horse specific atlas still needs to be illustrated.
- Roman and Persian signature units use their faction action atlases; shared roles use faction art only where the source weapon and equipment fit.
- Mounted intermediate atlases and the three worker action atlases load on demand. Coarse-pointer devices retain the lighter blend path.

## Orchard and work sprites

- Orchard plots now use a full apple tree and a matching harvested tree state. Worker proximity triggers a small canopy sway and a fruit fall synchronized to the worker's gathering cycle. Wild fruit resources still use the berry bush atlas.
- Hijab locomotion and action sheets retain the source colors and the standard cropper. The source atlas still contains occasional stray fragments; the color-mask attempt was discarded because it cut holes into the clothes and hands.

## Defenses and civilization tactics

- Era facades and fortifications are selected by faction and gameplay age. Legacy sheets that are replaced by packed facades are retained as source/fallback material, not drawn over the newer era art.
- Roman Testudo already exists as a Castle Age Barracks research. It reduces incoming ranged damage and movement speed; using the formation now packs selected shield infantry more tightly.
- Celtic and Visigoth are not yet playable factions in the current ten-faction roster. They still need distinct unit/building assets and their own researched tactics before they can be added without borrowing another civilization's look.

## Limits

The atlases are original project art but their source actions still have fewer authored poses than a fully hand-animated character rig. Interpolation smooths transitions; it cannot create anatomically correct missing poses.
