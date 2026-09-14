/** Explicit release snapshot verified on 2026-09-14.
 * This is NOT inferred from images or a default rule for newly added families.
 * Keep existing IDs stable; add a release only after checking its own evidence.
 */
export type ReviewedFinish = 'normal' | 'gold' | 'cheat-master' | 'loot-hacker'
export type ReviewedRelease = readonly [finish: ReviewedFinish, releasedAt: string]

const launchRelease = (finish: ReviewedFinish): ReviewedRelease => [finish, '2026-08-20']
const patch421Release = (finish: ReviewedFinish): ReviewedRelease => [finish, '2026-09-03']
const hackerRelease = (finish: ReviewedFinish): ReviewedRelease => [finish, '2026-09-10']

const launchSet = (): readonly ReviewedRelease[] => [
  launchRelease('normal'),
  launchRelease('gold'),
  launchRelease('cheat-master'),
  hackerRelease('loot-hacker'),
]

const patch421Set = (): readonly ReviewedRelease[] => [
  patch421Release('normal'),
  patch421Release('gold'),
  patch421Release('cheat-master'),
  hackerRelease('loot-hacker'),
]

const reviewed: Readonly<Record<string, readonly ReviewedRelease[]>> = {
  jonesy: launchSet(),
  adventure: launchSet(),
  bush: launchSet(),
  sonic: launchSet(),
  tails: launchSet(),
  shadow: launchSet(),
  '8-bit': launchSet(),
  jackrabbit: launchSet(),
  crown: [
    launchRelease('normal'),
    launchRelease('gold'),
    launchRelease('cheat-master'),
    patch421Release('loot-hacker'),
  ],
  killswitch: launchSet(),
  klombo: launchSet(),
  'mega-man': [patch421Release('normal')],
  overshield: patch421Set(),
  'x-ray': patch421Set(),
  onigiri: patch421Set(),
  'storm-scout': patch421Set(),
}
export const reviewedFamilyCount = Object.keys(reviewed).length
export const reviewedReleasedEntryCount = Object.values(reviewed).reduce(
  (total, releases) => total + releases.length,
  0,
)
export function releasedEntriesFor(familyId: string): readonly ReviewedRelease[] {
  return Object.hasOwn(reviewed, familyId) ? reviewed[familyId] : []
}
export function releasedFinishesFor(familyId: string): readonly ReviewedFinish[] {
  return releasedEntriesFor(familyId).map(([finish]) => finish)
}
