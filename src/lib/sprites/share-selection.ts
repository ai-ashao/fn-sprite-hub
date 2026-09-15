import { currentReleasedEntries, currentSeason, familyById, spriteFamilies } from '@/data/sprites'
import { type CollectionStateV1, collectionMetrics, entryState } from './collection'

export type ShareTemplate = 'collection' | 'missing' | 'unmastered' | 'mastered' | 'celebration'
export type CollectionShareTemplate = Exclude<ShareTemplate, 'celebration'>
export type DiscordShareTemplate = Exclude<CollectionShareTemplate, 'mastered'>

export type ShareSelection = {
  template: ShareTemplate
  seasonId: string
  familyIds: string[]
  entryIds: string[]
  page: number
  pageCount: number
}

// Curated for silhouette, rarity and color contrast. This is intentionally
// explicit rather than depending on spriteFamilies array order.
export const celebrationFamilyIds = ['bush', 'sonic', 'crown', 'klombo', 'x-ray'] as const

export function shareTemplateAvailable(
  template: ShareTemplate,
  collection: CollectionStateV1,
): boolean {
  if (template === 'celebration') {
    const metrics = collectionMetrics(collection)
    return metrics.owned === metrics.total || metrics.mastered === metrics.total
  }
  return entriesForShareTemplate(template, collection).length > 0
}

export function buildShareSelections(
  template: ShareTemplate,
  collection: CollectionStateV1,
): ShareSelection[] {
  if (template === 'celebration') {
    if (!shareTemplateAvailable(template, collection)) return []

    const representativeFamilies = celebrationFamilyIds.filter((id) => familyById(id))
    return [selection(template, [...representativeFamilies], [], 1, 1)]
  }

  const entries = entriesForShareTemplate(template, collection)
  if (!entries.length) return []
  return [
    selection(
      template,
      Array.from(new Set(entries.map(({ familyId }) => familyId))),
      entries.map(({ id }) => id),
      1,
      1,
    ),
  ]
}

export function buildDiscordShareSelection(
  template: DiscordShareTemplate,
  collection: CollectionStateV1,
): ShareSelection {
  if (template === 'collection') {
    return selection(
      template,
      spriteFamilies.map(({ id }) => id),
      [],
      1,
      1,
    )
  }

  const entries = currentReleasedEntries().filter((entry) => {
    const state = entryState(collection, entry.id)
    return template === 'missing' ? state === 'missing' : state === 'owned'
  })
  return selection(
    template,
    Array.from(new Set(entries.map(({ familyId }) => familyId))),
    entries.map(({ id }) => id),
    1,
    1,
  )
}

function entriesForShareTemplate(template: CollectionShareTemplate, collection: CollectionStateV1) {
  return currentReleasedEntries().filter((entry) => {
    const state = entryState(collection, entry.id)
    if (template === 'collection') return state !== 'missing'
    if (template === 'missing') return state === 'missing'
    if (template === 'unmastered') return state === 'owned'
    return state === 'mastered'
  })
}

function selection(
  template: ShareTemplate,
  familyIds: string[],
  entryIds: string[],
  page: number,
  pageCount: number,
): ShareSelection {
  return { template, seasonId: currentSeason.id, familyIds, entryIds, page, pageCount }
}

export function buildDiscordShareText(
  selection: ShareSelection,
  collection: CollectionStateV1,
): string {
  const metrics = collectionMetrics(collection)
  const title =
    selection.template === 'missing'
      ? 'Missing Fortnite Sprites'
      : selection.template === 'unmastered'
        ? 'Fortnite Sprites I Need to Master'
        : 'My Fortnite Sprite Collection'
  const entryLines = selection.entryIds.map((id) => {
    const entry = currentReleasedEntries().find((candidate) => candidate.id === id)
    return entry ? `• ${entry.displayName}` : undefined
  })
  const familyLines = selection.familyIds.map((id) => {
    const family = familyById(id)
    return family ? `• ${family.name}` : undefined
  })
  const list = (entryLines.length ? entryLines : familyLines).filter(Boolean)

  return [
    title,
    '',
    `Collected: ${metrics.owned}/${metrics.total}`,
    `Mastered: ${metrics.mastered}/${metrics.total}`,
    ...(list.length ? ['', ...list] : []),
    '',
    '✦ Track yours at FN Sprite Hub · fnspritehub.com',
  ].join('\n')
}
