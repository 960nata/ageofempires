# Construction facing · 0.22.1

Construction frames now use the actual selected building image and source rectangle. Foundations, rising facade and scaffolding use its anchor. Sixteen progress samples replace four generic construction images repeated four times. The last sample equals the finished facade. Renovation frames contain scaffolding only, so another generic building is no longer painted over the original. Mirrored renovation overlays follow the building mirror and custom horizontal anchor.

Cache identity includes image URL, source rectangle, anchor, aspect ratio, era, progress, overlay mode, building definition and facing. Memory is bounded to 48 canvases with a maximum dimension of 384 pixels.

R rotates clockwise; Shift+R rotates counterclockwise during placement or selection. Both directions are available as selection buttons.

## Remaining scope
There are still four world-facing slots, not eight fully authored views. Roman/Persian existing facade sources provide four generated views; regional settlement/fortification sheets still use single facades and mirrored variants. This change fixes construction alignment with the chosen visible sprite; it does not create missing rear/diagonal building artwork. Scaffolding is procedural and facade growth is a clipped reveal, not a structural 3D construction simulation. No browser visual acceptance or new automated tests were run for this change.
