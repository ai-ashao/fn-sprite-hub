/** Explicit release snapshot inherited from the reviewed 2026-09-08 catalog.
 * This is NOT inferred from images or a default rule for newly added families.
 * Keep existing IDs stable; add a release only after checking its own evidence.
 */
export type ReviewedFinish = 'normal' | 'gold' | 'cheat-master' | 'loot-hacker'
const reviewed: Readonly<Record<string, readonly ReviewedFinish[]>> = {
  jonesy: ['normal', 'gold', 'cheat-master'],
  adventure: ['normal', 'gold', 'cheat-master'],
  bush: ['normal', 'gold', 'cheat-master'],
  sonic: ['normal', 'gold', 'cheat-master'],
  tails: ['normal', 'gold', 'cheat-master'],
  shadow: ['normal', 'gold', 'cheat-master'],
  '8-bit': ['normal', 'gold', 'cheat-master'],
  jackrabbit: ['normal', 'gold', 'cheat-master'],
  crown: ['normal', 'gold', 'cheat-master', 'loot-hacker'],
  killswitch: ['normal', 'gold', 'cheat-master'],
  klombo: ['normal', 'gold', 'cheat-master'],
  'mega-man': ['normal'],
  overshield: ['normal', 'gold', 'cheat-master'],
  'x-ray': ['normal', 'gold', 'cheat-master'],
  onigiri: ['normal', 'gold', 'cheat-master'],
  'storm-scout': ['normal', 'gold', 'cheat-master'],
}
export const reviewedFamilyCount = Object.keys(reviewed).length
export const reviewedReleasedEntryCount = Object.values(reviewed).reduce(
  (total, finishes) => total + finishes.length,
  0,
)
export function releasedFinishesFor(familyId: string): readonly ReviewedFinish[] {
  return Object.hasOwn(reviewed, familyId) ? reviewed[familyId] : []
}
