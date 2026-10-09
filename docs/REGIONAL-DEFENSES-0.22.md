# Regional defenses · 0.22.0

## Playing
Completed gates default to **Automatic gate**. Own and allied units with orders trigger the gate within 9 world units; allied units directly in the passage keep it open. A two-second grace period after traffic prevents immediate closure. Opening takes 1.6 seconds. Enemy or neutral units do not trigger opening, but any living unit in the doorway prevents crushing during closure. An open gate is physically passable, including by enemies following allies. Choose **Lock gate** or **Open permanently** to override automatic behavior.

Allied routes may plan through closed automatic gates, but collision remains closed until the actual animation finishes. Locked and enemy gates remain route obstacles. Modes and animation progress persist in saves.

Palisades and settlement gates are available in Dark Age, masonry walls in Feudal. The gate reinforcement action requires the next age and villagers using Repair; old gates also receive age facades after the existing renovation task completes. Gates show the greater of their renovated age and reinforcement stage, capped at Imperial. A wooden-looking gate still uses the shared gate gameplay base stats; stage-specific balancing is pending.

## Added artwork
Ten fortification atlases: English, French, Saracen, Mongol, Chinese, Japanese, Khmer, Roman, Persian and Castilian. Each has four era rows and four columns: wall, closed gate, half-open gate, open gate. New atlases contain 160 images total. Views use a single authored facade and mirrored orientation, not four authentic architectural rotations.

Chinese, Japanese and Khmer factions each have twelve core buildings plus a signature troop atlas. Chinese repeating crossbow and Japanese samurai can be recruited at Castle Age; Khmer war elephants unlock in Imperial. Regional buildings retain their region at all ages; the current single core set is reused outside Castle Age. New troops have idle, three walking samples and two attack samples in eight source heading rows. Several generated attack headings are approximate; some alpha edges still need cleanup. These are not final animation-quality claims.

Original generated PNGs are in public/assets/isometric. Built-in image generation was used, with no purchased or extracted commercial game assets. Exact prompts: FORTIFICATION-PROMPTS-0.22.json. Original generation files were preserved.

## Checks
TypeScript and production build passed. Direct simulation passed: delayed opening, friendly passage, delayed automatic closure, lock override, enemy rejection as an opening trigger, allied opening, occupied doorway closure prevention and saved mode/state.

Browser visual acceptance was not performed in this run. Complete per-era civilian/military building sets, every troop family and upgraded armor sprites remain outstanding. Khmer is one Southeast Asian civilization, not a representation of every culture in the region.
