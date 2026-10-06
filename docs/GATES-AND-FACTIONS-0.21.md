# Gates and four factions · 0.21.0

## Implemented
- Five opening samples across four generated gate views. Closing reverses progression. One shared gate architecture across factions.
- Gate transition takes 1.6 seconds. Navigation stays blocked until fully open; closing blocks new paths at its start. A living unit in the gate footprint pauses closure. Reversing a command retains current progress.
- Serialized gate progress and target resume after save/load. Legacy closed flags are supported. Unfinished gates cannot open.
- English, French, Saracen (existing ayyubid ID) and Mongol (existing steppe ID) have twelve new Castle Age core building sprites each. IDs stay stable for saves and bonuses.
- Longbowman, French knight, Mongol horse archer and Saracen camel lancer have separate generated signature atlases: eight heading rows, idle, three walk samples and two attack samples. Only these four definitions switch to new troop art.
- Atlas loading is on demand; existing sprites remain while loading. Alpha bounds are measured once. Gate frame bounds are shared per row to reduce scale pumping.

## Artwork scope and remaining work
Regional buildings are one authored camera view, mirrored for alternate facings; there are no true rear views. Dark, Feudal, Imperial and utility/fortification buildings retain previous shared sprites. Regional construction and rubble also retain shared art. Generated heading accuracy, animal gait, attack direction and colored alpha fringes still need art cleanup. These are limited animation samples, not final fluid animation or historical reconstruction. No claim of complete faction rosters or exact Age of Empires reproduction.

## Verification
Gate simulation assertions passed for blocked-until-open navigation, delayed closing around a unit, immediate navigation blocking on closure, reversing mid-transition, save/restore and unfinished gate rejection. Visual gameplay acceptance in the browser has not been performed in this run.

## Asset origin
Nine transparent PNG atlases were generated with the built-in image generation tool and copied into public/assets/isometric. Original generated files remain in the generation output folder. No paid pack or extracted Age of Empires artwork was used. Generation prompts are in REGIONAL-ASSET-PROMPTS.json. Gate prompt: original medieval stone gatehouse, five progressive portcullis opening columns, four isometric heading rows, transparent background, stationary masonry and upper-left lighting.
