/** Wall technology is separate from the town age and local tower upgrades. */
export const WALL_TECHS = ['stone-walls', 'fortified-walls', 'imperial-walls'] as const;
export const isWallLine = (def: string) => ['palisade', 'wall', 'gate'].includes(def);
export function wallLevel(tech: readonly string[]) {
  for (let i = WALL_TECHS.length - 1; i >= 0; i--) if (tech.includes(WALL_TECHS[i])) return i + 1;
  return 0;
}
export const wallResearchLevel = (id: string) => WALL_TECHS.indexOf(id as typeof WALL_TECHS[number]) + 1;
export const wallHealthFactor = (level: number) => [1, 1, 1.35, 1.75][Math.max(0, Math.min(3, level))];
