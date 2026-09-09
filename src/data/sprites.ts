import artworkData from './sprite-artworks.json'

export type SpriteRarity = 'Rare' | 'Epic' | 'Legendary' | 'Mythic'
export type SpriteFinishKind = 'normal' | 'gold' | 'cheat-master' | 'loot-hacker'
export type SpriteImageMode = 'entry' | 'family-fallback'

export const currentDataVerifiedAt = '2026-09-08'

export type SpriteFamily = {
  id: string
  slug: string
  name: string
  rarity: SpriteRarity
  ability: string
  familyImage: string
  introducedSeasonId: string
  patchAdded: string
  locationHint: string
  acquisitionHint: string
  verifiedAt: string
  sourceRefs: string[]
  seoReady: boolean
}

export type SpriteEntry = {
  id: string
  familyId: string
  seasonId: string
  finish: SpriteFinishKind
  displayName: string
  image: string
  imageMode: SpriteImageMode
  released: boolean
  releasedAt?: string
  patchAdded?: string
  verifiedAt: string
  sourceRefs: string[]
}

export type SpriteSeason = {
  id: string
  chapter: number
  season: number
  name: string
  year: number
  current: boolean
  startedAt: string
  patch: string
  lastVerifiedAt: string
}

export const currentSeason: SpriteSeason = {
  id: 'c7s4',
  chapter: 7,
  season: 4,
  name: 'Override',
  year: 2026,
  current: true,
  startedAt: '2026-08-20',
  patch: 'v42.10',
  lastVerifiedAt: currentDataVerifiedAt,
}

const commonSources = [
  'https://www.fortnite.com/news/fortnite-override-break-the-rules-change-the-game',
  'https://fortnite.gg/sprites',
]

const spriteFamilyData: readonly Omit<SpriteFamily, 'seoReady'>[] = [
  {
    id: 'jonesy',
    slug: 'jonesy',
    name: 'Jonesy',
    rarity: 'Rare',
    ability:
      'Recovers health or shields shortly after taking damage, with stronger recovery as it levels.',
    familyImage: '/images/sprites/jonesy.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint: 'Can be selected as a starter Sprite and is also reported around higher terrain.',
    acquisitionHint:
      'Use current-season loot and Cheat Code sources; availability can change with live patches.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'adventure',
    slug: 'adventure',
    name: 'Adventure',
    rarity: 'Rare',
    ability: 'Upgrades a random item in your inventory as the Sprite levels up.',
    familyImage: '/images/sprites/adventure.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint:
      'Can be selected as a starter Sprite and is commonly reported around elevated terrain.',
    acquisitionHint:
      'Use current-season loot and Cheat Code sources; starter availability makes it easier to begin tracking.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'bush',
    slug: 'bush',
    name: 'Bush',
    rarity: 'Rare',
    ability:
      'Grants a bush after a duration; higher levels shorten the wait and improve the effect.',
    familyImage: '/images/sprites/bush.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint: 'Can be selected as a starter Sprite.',
    acquisitionHint:
      'Starter selection and current-season loot are the simplest verified ways to begin with Bush.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'sonic',
    slug: 'sonic',
    name: 'Sonic',
    rarity: 'Epic',
    ability: 'Increases sprint speed with each level up.',
    familyImage: '/images/sprites/sonic.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint: 'Reported more often around high and mountainous regions.',
    acquisitionHint:
      'Current-season loot and Cheat Code sources can provide Sonic; exact availability is patch-dependent.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'tails',
    slug: 'tails',
    name: 'Tails',
    rarity: 'Epic',
    ability: 'Lets you hover after a double jump, with improved movement as the Sprite levels.',
    familyImage: '/images/sprites/tails.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint: 'Reported more often around high and mountainous regions.',
    acquisitionHint:
      'Look through current-season loot and Cheat Code sources rather than relying on a single fixed spawn.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'shadow',
    slug: 'shadow',
    name: 'Shadow',
    rarity: 'Epic',
    ability: 'Automatically reloads unequipped weapons, with the effect improving as it levels.',
    familyImage: '/images/sprites/shadow.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint: 'Reported around higher terrain during the current season.',
    acquisitionHint:
      'Use current-season loot and Cheat Code sources; there is no permanent fixed spawn promised by this tracker.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: '8-bit',
    slug: '8-bit',
    name: '8-Bit',
    rarity: 'Rare',
    ability: 'Places an 8-Bit Shotgun in your first chest and gives it a score multiplier.',
    familyImage: '/images/sprites/8-bit.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint: 'Reported around high and mountainous regions.',
    acquisitionHint:
      'Use current-season loot and Cheat Code sources and verify patch notes when its acquisition changes.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'jackrabbit',
    slug: 'jackrabbit',
    name: 'Jackrabbit',
    rarity: 'Legendary',
    ability: 'Adds a double jump, with a shorter cooldown as the Sprite levels.',
    familyImage: '/images/sprites/jackrabbit.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint: 'Reported more often around high and mountainous regions.',
    acquisitionHint:
      'Legendary rarity makes it less common; use live current-season sources instead of assuming a fixed location.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'crown',
    slug: 'crown',
    name: 'Crown',
    rarity: 'Mythic',
    ability:
      'Progresses through wins and Crown Wins and has a current-season Loot Hacker collectible entry.',
    familyImage: '/images/sprites/crown.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint:
      'Reported around high terrain; the Loot Hacker finish is tracked separately from the base Sprite.',
    acquisitionHint:
      'Track Base, Gold, Cheat Master and the released Loot Hacker Crown as separate collection entries.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'killswitch',
    slug: 'killswitch',
    name: 'Killswitch',
    rarity: 'Epic',
    ability: 'Enters Hangtime while aiming in mid-air and improves accuracy as it levels.',
    familyImage: '/images/sprites/killswitch.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint: 'Reported around the island at night.',
    acquisitionHint:
      'Night-time reports are useful guidance, but live loot and Cheat Code sources still determine availability.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'klombo',
    slug: 'klombo',
    name: 'Klombo',
    rarity: 'Mythic',
    ability: 'Grants random items as it levels up.',
    familyImage: '/images/sprites/klombo.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.00',
    locationHint: 'Reported more often around high and mountainous regions.',
    acquisitionHint:
      'Use live loot and Cheat Code sources; Mythic rarity means results can vary between matches.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'mega-man',
    slug: 'mega-man',
    name: 'Mega Man',
    rarity: 'Rare',
    ability: 'Improves sliding by increasing travel and reducing friction.',
    familyImage: '/images/sprites/mega-man.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.10',
    locationHint: 'Added in patch v42.10; no single permanent fixed location is asserted here.',
    acquisitionHint:
      'Mega Man currently counts as a single released collectible entry in the Season 4 completion denominator.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'overshield',
    slug: 'overshield',
    name: 'Overshield',
    rarity: 'Rare',
    ability: 'Grants Overshield that scales as the Sprite levels.',
    familyImage: '/images/sprites/overshield.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.10',
    locationHint: 'Reported around high and mountainous regions after its v42.10 release.',
    acquisitionHint: 'Use current-season loot and Cheat Code sources; it was added during v42.10.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'x-ray',
    slug: 'x-ray',
    name: 'X-Ray',
    rarity: 'Legendary',
    ability: 'Periodically marks nearby enemies, with stronger detection as it levels.',
    familyImage: '/images/sprites/x-ray.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.10',
    locationHint: 'Added in v42.10; this tracker does not claim a permanent fixed spawn.',
    acquisitionHint: 'Track Base, Gold and Cheat Master as separate released entries.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'onigiri',
    slug: 'onigiri',
    name: 'Onigiri',
    rarity: 'Rare',
    ability: 'Grants Overdrive after using a consumable item, lasting longer as the Sprite levels.',
    familyImage: '/images/sprites/onigiri.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.10',
    locationHint:
      'Added in v42.10; current acquisition should be checked against live loot and Cheat Code sources.',
    acquisitionHint: 'Track Base, Gold and Cheat Master as separate released entries.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
  {
    id: 'storm-scout',
    slug: 'storm-scout',
    name: 'Storm Scout',
    rarity: 'Rare',
    ability:
      'Grants Overdrive after taking enough Storm damage and can reveal future Storm circles at high level.',
    familyImage: '/images/sprites/storm-scout.webp',
    introducedSeasonId: 'c7s4',
    patchAdded: 'v42.10',
    locationHint: 'Reported around higher terrain after the v42.10 update.',
    acquisitionHint: 'Track Base, Gold and Cheat Master as separate released entries.',
    verifiedAt: currentDataVerifiedAt,
    sourceRefs: commonSources,
  },
] as const

// Detail pages stay noindex until a human has reviewed their standalone search value.
// Add family ids here only after that editorial review; technical completeness is not enough.
const seoReadyFamilyIds = new Set<string>([])

export const spriteFamilies: readonly SpriteFamily[] = spriteFamilyData.map((family) => ({
  ...family,
  seoReady: seoReadyFamilyIds.has(family.id),
}))

const finishLabels: Record<SpriteFinishKind, string> = {
  normal: 'Base',
  gold: 'Gold',
  'cheat-master': 'Cheat Master',
  'loot-hacker': 'Loot Hacker',
}

const artworkByEntryId = new Map(artworkData.map((record) => [record.entryId, record] as const))

function makeEntry(
  family: SpriteFamily,
  finish: SpriteFinishKind,
  releasedAt = family.patchAdded === 'v42.10' ? '2026-09-03' : '2026-08-20',
): SpriteEntry {
  const entryId = `${family.id}:${finish}`
  const artwork = artworkByEntryId.get(entryId)

  if (!artwork) {
    throw new Error(`Missing canonical artwork record for ${entryId}`)
  }

  return {
    id: entryId,
    familyId: family.id,
    seasonId: currentSeason.id,
    finish,
    displayName: finish === 'normal' ? family.name : `${finishLabels[finish]} ${family.name}`,
    image: artwork.localPath,
    imageMode: artwork.imageMode as SpriteImageMode,
    released: true,
    releasedAt,
    patchAdded: family.patchAdded,
    verifiedAt: currentSeason.lastVerifiedAt,
    sourceRefs: [...artwork.sourceUrls],
  }
}

const entries: SpriteEntry[] = []

for (const family of spriteFamilies) {
  entries.push(makeEntry(family, 'normal'))

  // Current verification snapshot (2026-09-08):
  // every Season 4 family except Mega Man has Gold + Cheat Master;
  // Crown additionally has the first released Loot Hacker entry.
  if (family.id !== 'mega-man') {
    entries.push(makeEntry(family, 'gold'))
    entries.push(makeEntry(family, 'cheat-master'))
  }
  if (family.id === 'crown') {
    entries.push(makeEntry(family, 'loot-hacker', '2026-09-03'))
  }
}

export const spriteEntries = entries as readonly SpriteEntry[]

export const finishLabel = (finish: SpriteFinishKind) => finishLabels[finish]

export const rarityRank: Record<SpriteRarity, number> = {
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  Mythic: 4,
}

export function familyById(id: string) {
  return spriteFamilies.find((family) => family.id === id)
}

export function familyBySlug(slug: string) {
  return spriteFamilies.find((family) => family.slug === slug)
}

export function entriesForFamily(familyId: string) {
  return spriteEntries.filter((entry) => entry.familyId === familyId && entry.released)
}

export function currentReleasedEntries() {
  return spriteEntries.filter((entry) => entry.seasonId === currentSeason.id && entry.released)
}

export const currentReleasedEntryCount = currentReleasedEntries().length
export const currentFamilyCount = new Set(currentReleasedEntries().map((entry) => entry.familyId))
  .size

export function validateSpriteData(): readonly string[] {
  const issues: string[] = []
  const familyIds = new Set<string>()
  const familySlugs = new Set<string>()
  const entryIds = new Set<string>()

  for (const family of spriteFamilies) {
    if (familyIds.has(family.id)) issues.push(`Duplicate family id: ${family.id}`)
    if (familySlugs.has(family.slug)) issues.push(`Duplicate family slug: ${family.slug}`)
    if (!family.sourceRefs.length) issues.push(`Family ${family.id} has no source references.`)
    if (!family.verifiedAt) issues.push(`Family ${family.id} has no verification date.`)
    familyIds.add(family.id)
    familySlugs.add(family.slug)
  }

  for (const entry of spriteEntries) {
    if (entryIds.has(entry.id)) issues.push(`Duplicate entry id: ${entry.id}`)
    if (!familyIds.has(entry.familyId)) issues.push(`Entry ${entry.id} has an unknown family.`)
    if (entry.seasonId !== currentSeason.id) issues.push(`Entry ${entry.id} has an unknown season.`)
    if (!entry.image.startsWith('/images/sprites/')) {
      issues.push(`Entry ${entry.id} does not use a local Sprite image.`)
    }
    if (entry.imageMode === 'entry' && entry.image === familyById(entry.familyId)?.familyImage) {
      issues.push(`Entry ${entry.id} claims independent artwork but uses its family image.`)
    }
    if (!entry.sourceRefs.length) issues.push(`Entry ${entry.id} has no source references.`)
    if (!entry.verifiedAt) issues.push(`Entry ${entry.id} has no verification date.`)
    entryIds.add(entry.id)
  }

  return issues
}

export type SpriteSeoRoute = {
  familyId: string
  slug: string
  path: string
  indexable: boolean
  lastModified: string
}

export type SpriteDetailIndexability = {
  score: number
  hasRequiredSources: boolean
  signals: {
    verifiedAbility: boolean
    acquisitionOrLocation: boolean
    releasedEntryTable: boolean
    uniqueMasteryNotes: boolean
    clearFinishArtwork: boolean
    relatedSpriteLinks: boolean
  }
}

export function spriteDetailIndexability(family: SpriteFamily): SpriteDetailIndexability {
  const familyEntries = entriesForFamily(family.id)
  const signals = {
    verifiedAbility: Boolean(family.ability.trim() && family.verifiedAt),
    acquisitionOrLocation: Boolean(family.acquisitionHint.trim() || family.locationHint.trim()),
    releasedEntryTable: familyEntries.length > 0,
    // V1 currently explains the shared state cycle but has no family-specific mastery notes.
    uniqueMasteryNotes: false,
    clearFinishArtwork: familyEntries.every(
      (entry) =>
        Boolean(entry.image) && Boolean(finishLabels[entry.finish]) && Boolean(entry.imageMode),
    ),
    relatedSpriteLinks:
      spriteFamilies.filter((candidate) => candidate.id !== family.id).length >= 2,
  }

  return {
    score: Object.values(signals).filter(Boolean).length,
    hasRequiredSources: family.sourceRefs.length >= 2,
    signals,
  }
}

export const spriteSeoRegistry: readonly SpriteSeoRoute[] = spriteFamilies.map((family) => {
  const gate = spriteDetailIndexability(family)
  return {
    familyId: family.id,
    slug: family.slug,
    path: `/sprites/${family.slug}`,
    indexable: gate.score >= 4 && gate.hasRequiredSources && family.seoReady,
    lastModified: family.verifiedAt,
  }
})
