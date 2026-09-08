import { useCallback, useEffect, useMemo, useState } from 'react'
import { currentReleasedEntries, currentSeason, spriteEntries } from '@/data/sprites'

export const collectionStorageKey = 'fn-sprite-hub:collection:v1'

export type CollectionStateV1 = {
  schemaVersion: 1
  seasonId: string
  ownedEntryIds: string[]
  masteredEntryIds: string[]
  updatedAt: string
}

const emptyState = (): CollectionStateV1 => ({
  schemaVersion: 1,
  seasonId: currentSeason.id,
  ownedEntryIds: [],
  masteredEntryIds: [],
  updatedAt: new Date(0).toISOString(),
})

function validEntryIds() {
  return new Set(spriteEntries.map((entry) => entry.id))
}

export function normalizeCollectionState(value: unknown): CollectionStateV1 {
  if (!value || typeof value !== 'object') return emptyState()

  const raw = value as Partial<CollectionStateV1>
  if (raw.schemaVersion !== 1 || raw.seasonId !== currentSeason.id) return emptyState()

  const valid = validEntryIds()
  const owned = Array.from(
    new Set(
      (Array.isArray(raw.ownedEntryIds) ? raw.ownedEntryIds : []).filter((id) => valid.has(id)),
    ),
  )
  const ownedSet = new Set(owned)
  const mastered = Array.from(
    new Set(
      (Array.isArray(raw.masteredEntryIds) ? raw.masteredEntryIds : []).filter(
        (id) => valid.has(id) && ownedSet.has(id),
      ),
    ),
  )

  return {
    schemaVersion: 1,
    seasonId: currentSeason.id,
    ownedEntryIds: owned,
    masteredEntryIds: mastered,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(0).toISOString(),
  }
}

export function loadCollectionState(storage: Pick<Storage, 'getItem'>): CollectionStateV1 {
  try {
    const raw = storage.getItem(collectionStorageKey)
    return raw ? normalizeCollectionState(JSON.parse(raw)) : emptyState()
  } catch {
    return emptyState()
  }
}

export function saveCollectionState(storage: Pick<Storage, 'setItem'>, state: CollectionStateV1) {
  storage.setItem(collectionStorageKey, JSON.stringify(normalizeCollectionState(state)))
}

export type CollectionImportResult =
  | { ok: true; state: CollectionStateV1 }
  | { ok: false; error: string }

export function serializeCollectionBackup(state: CollectionStateV1): string {
  return `${JSON.stringify(normalizeCollectionState(state), null, 2)}\n`
}

export function parseCollectionBackup(text: string): CollectionImportResult {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'The backup must contain one collection object.' }
  }

  const raw = value as Partial<CollectionStateV1>
  if (raw.schemaVersion !== 1) {
    return { ok: false, error: 'Unsupported backup schema version.' }
  }
  if (raw.seasonId !== currentSeason.id) {
    return { ok: false, error: 'This backup belongs to a different Fortnite season.' }
  }
  if (!Array.isArray(raw.ownedEntryIds) || !raw.ownedEntryIds.every(isString)) {
    return { ok: false, error: 'Owned entry IDs must be a list of strings.' }
  }
  if (!Array.isArray(raw.masteredEntryIds) || !raw.masteredEntryIds.every(isString)) {
    return { ok: false, error: 'Mastered entry IDs must be a list of strings.' }
  }
  if (typeof raw.updatedAt !== 'string' || Number.isNaN(Date.parse(raw.updatedAt))) {
    return { ok: false, error: 'The backup has an invalid update date.' }
  }

  const valid = validEntryIds()
  const unknownIds = [...raw.ownedEntryIds, ...raw.masteredEntryIds].filter((id) => !valid.has(id))
  if (unknownIds.length) {
    return { ok: false, error: `Unknown Sprite entry ID: ${unknownIds[0]}` }
  }

  const owned = new Set(raw.ownedEntryIds)
  const invalidMastered = raw.masteredEntryIds.find((id) => !owned.has(id))
  if (invalidMastered) {
    return {
      ok: false,
      error: `Mastered entry must also be owned: ${invalidMastered}`,
    }
  }

  return { ok: true, state: normalizeCollectionState(raw) }
}

export function buildDiscordCollectionSummary(state: CollectionStateV1): string {
  const metrics = collectionMetrics(state)
  const missing = currentReleasedEntries().filter(
    (entry) => entryState(state, entry.id) === 'missing',
  )
  const missingLines = missing.length
    ? missing.map((entry) => `• ${entry.displayName}`).join('\n')
    : '• None — collection complete!'

  return [
    'My Fortnite Sprite Collection',
    '',
    `Collected: ${metrics.owned}/${metrics.total}`,
    `Mastered: ${metrics.mastered}/${metrics.total}`,
    '',
    'Missing:',
    missingLines,
    '',
    'FN Sprite Hub',
  ].join('\n')
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export type EntryState = 'missing' | 'owned' | 'mastered'

export function entryState(collection: CollectionStateV1, entryId: string): EntryState {
  if (collection.masteredEntryIds.includes(entryId)) return 'mastered'
  if (collection.ownedEntryIds.includes(entryId)) return 'owned'
  return 'missing'
}

export function cycleEntryState(collection: CollectionStateV1, entryId: string): CollectionStateV1 {
  const current = entryState(collection, entryId)
  const owned = new Set(collection.ownedEntryIds)
  const mastered = new Set(collection.masteredEntryIds)

  if (current === 'missing') {
    owned.add(entryId)
  } else if (current === 'owned') {
    owned.add(entryId)
    mastered.add(entryId)
  } else {
    owned.delete(entryId)
    mastered.delete(entryId)
  }

  return {
    ...collection,
    ownedEntryIds: [...owned],
    masteredEntryIds: [...mastered],
    updatedAt: new Date().toISOString(),
  }
}

export function collectionMetrics(collection: CollectionStateV1) {
  const releasedIds = new Set(currentReleasedEntries().map((entry) => entry.id))
  const owned = collection.ownedEntryIds.filter((id) => releasedIds.has(id)).length
  const mastered = collection.masteredEntryIds.filter((id) => releasedIds.has(id)).length
  const total = releasedIds.size

  return {
    total,
    owned,
    mastered,
    missing: Math.max(total - owned, 0),
    collectionPercent: total ? Math.round((owned / total) * 100) : 0,
    masteryPercent: total ? Math.round((mastered / total) * 100) : 0,
  }
}

export function useSpriteCollection() {
  const [mounted, setMounted] = useState(false)
  const [collection, setCollection] = useState<CollectionStateV1>(emptyState)

  useEffect(() => {
    setCollection(loadCollectionState(window.localStorage))
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    saveCollectionState(window.localStorage, collection)
  }, [collection, mounted])

  const cycleEntry = useCallback((entryId: string) => {
    setCollection((current) => cycleEntryState(current, entryId))
  }, [])

  const reset = useCallback(() => {
    setCollection({
      ...emptyState(),
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const restore = useCallback((state: CollectionStateV1) => {
    setCollection(normalizeCollectionState(state))
  }, [])

  const metrics = useMemo(() => collectionMetrics(collection), [collection])

  return {
    mounted,
    collection,
    metrics,
    cycleEntry,
    restore,
    reset,
    getEntryState: (entryId: string) => entryState(collection, entryId),
  }
}
