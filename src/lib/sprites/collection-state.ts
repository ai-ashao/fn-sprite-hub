/** Pure collection rules. Catalog facts are supplied by the existing Sprite data module. */
export type CollectionCatalog = { seasonId: string; entryIds: readonly string[] }
export type EntryState = 'missing' | 'owned' | 'mastered'
export type CollectionStateV1 = {
  schemaVersion: 1
  seasonId: string
  ownedEntryIds: string[]
  masteredEntryIds: string[]
  updatedAt: string
  // Optional coordination metadata; old v1 backups without these fields remain valid.
  revision?: string
  entryVersions?: Record<string, string>
}
export type ImportResult = { ok: true; state: CollectionStateV1 } | { ok: false; error: string }
export type LoadKind =
  | 'empty'
  | 'valid'
  | 'unavailable'
  | 'damaged'
  | 'schema'
  | 'season'
  | 'invalid'
export type LoadResult = {
  kind: LoadKind
  raw: string | null
  state: CollectionStateV1
  message: string
}

export function emptyCollection(catalog: CollectionCatalog): CollectionStateV1 {
  return {
    schemaVersion: 1,
    seasonId: catalog.seasonId,
    ownedEntryIds: [],
    masteredEntryIds: [],
    updatedAt: new Date(0).toISOString(),
  }
}

export function stateOf(state: CollectionStateV1, id: string): EntryState {
  if (state.masteredEntryIds.includes(id)) return 'mastered'
  return state.ownedEntryIds.includes(id) ? 'owned' : 'missing'
}

export function normalize(value: unknown, catalog: CollectionCatalog): CollectionStateV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyCollection(catalog)
  const raw = value as Partial<CollectionStateV1>
  if (raw.schemaVersion !== 1 || raw.seasonId !== catalog.seasonId) return emptyCollection(catalog)
  const valid = new Set(catalog.entryIds)
  const owned = [
    ...new Set(
      (Array.isArray(raw.ownedEntryIds) ? raw.ownedEntryIds : []).filter((id) => valid.has(id)),
    ),
  ]
  const ownedSet = new Set(owned)
  const mastered = [
    ...new Set(
      (Array.isArray(raw.masteredEntryIds) ? raw.masteredEntryIds : []).filter(
        (id) => valid.has(id) && ownedSet.has(id),
      ),
    ),
  ]
  return {
    schemaVersion: 1,
    seasonId: catalog.seasonId,
    ownedEntryIds: owned,
    masteredEntryIds: mastered,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(0).toISOString(),
    ...(typeof raw.revision === 'string' ? { revision: raw.revision } : {}),
    ...(raw.entryVersions &&
    typeof raw.entryVersions === 'object' &&
    !Array.isArray(raw.entryVersions)
      ? {
          entryVersions: Object.fromEntries(
            Object.entries(raw.entryVersions).filter(
              ([id, version]) => valid.has(id) && typeof version === 'string',
            ),
          ),
        }
      : {}),
  }
}

export function parseBackup(text: string, catalog: CollectionCatalog): ImportResult {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { ok: false, error: 'The backup must contain one collection object.' }
  const raw = value as Partial<CollectionStateV1>
  if (raw.schemaVersion !== 1) return { ok: false, error: 'Unsupported backup schema version.' }
  if (raw.seasonId !== catalog.seasonId)
    return { ok: false, error: 'This backup belongs to a different Fortnite season.' }
  if (!Array.isArray(raw.ownedEntryIds) || !raw.ownedEntryIds.every((id) => typeof id === 'string'))
    return { ok: false, error: 'Owned entry IDs must be a list of strings.' }
  if (
    !Array.isArray(raw.masteredEntryIds) ||
    !raw.masteredEntryIds.every((id) => typeof id === 'string')
  )
    return { ok: false, error: 'Mastered entry IDs must be a list of strings.' }
  if (typeof raw.updatedAt !== 'string' || Number.isNaN(Date.parse(raw.updatedAt)))
    return { ok: false, error: 'The backup has an invalid update date.' }
  const valid = new Set(catalog.entryIds)
  const unknown = [...raw.ownedEntryIds, ...raw.masteredEntryIds].find((id) => !valid.has(id))
  if (unknown !== undefined) return { ok: false, error: `Unknown Sprite entry ID: ${unknown}` }
  const owned = new Set(raw.ownedEntryIds)
  const invalid = raw.masteredEntryIds.find((id) => !owned.has(id))
  if (invalid !== undefined)
    return { ok: false, error: `Mastered entry must also be owned: ${invalid}` }
  if (raw.revision !== undefined && typeof raw.revision !== 'string')
    return { ok: false, error: 'The backup has invalid revision metadata.' }
  if (
    raw.entryVersions !== undefined &&
    (!raw.entryVersions ||
      typeof raw.entryVersions !== 'object' ||
      Array.isArray(raw.entryVersions) ||
      Object.entries(raw.entryVersions).some(([id, v]) => !valid.has(id) || typeof v !== 'string'))
  )
    return { ok: false, error: 'The backup has invalid entry revision metadata.' }
  // Unknown top-level fields may belong to a newer client. Never silently strip them on disk.
  const allowed = new Set([
    'schemaVersion',
    'seasonId',
    'ownedEntryIds',
    'masteredEntryIds',
    'updatedAt',
    'revision',
    'entryVersions',
  ])
  if (Object.keys(raw).some((key) => !allowed.has(key)))
    return {
      ok: false,
      error: 'This backup has unrecognized fields. Its original data has been preserved.',
    }
  return { ok: true, state: normalize(raw, catalog) }
}

export function inspectCollection(raw: string | null, catalog: CollectionCatalog): LoadResult {
  const empty = emptyCollection(catalog)
  if (raw === null) return { kind: 'empty', raw, state: empty, message: 'No saved collection yet.' }
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return {
      kind: 'damaged',
      raw,
      state: empty,
      message:
        'Saved data could not be read. The original has not been changed; export it before restoring a backup.',
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Partial<CollectionStateV1>
    if (v.schemaVersion !== 1)
      return {
        kind: 'schema',
        raw,
        state: empty,
        message: 'Saved data uses an unsupported version. The original has not been changed.',
      }
    if (v.seasonId !== catalog.seasonId)
      return {
        kind: 'season',
        raw,
        state: empty,
        message:
          'A collection from another season is preserved in this browser. Export the original before starting this season.',
      }
  }
  const parsed = parseBackup(raw, catalog)
  if (!parsed.ok)
    return { kind: 'invalid', raw, state: normalize(value, catalog), message: parsed.error }
  return { kind: 'valid', raw, state: parsed.state, message: 'Saved in this browser.' }
}

export function setEntry(
  state: CollectionStateV1,
  id: string,
  next: EntryState,
  catalog: CollectionCatalog,
  revision: string,
): CollectionStateV1 {
  if (!catalog.entryIds.includes(id)) throw new Error(`Unknown Sprite entry ID: ${id}`)
  const owned = new Set(state.ownedEntryIds)
  const mastered = new Set(state.masteredEntryIds)
  if (next === 'missing') {
    owned.delete(id)
    mastered.delete(id)
  } else {
    owned.add(id)
    if (next === 'mastered') mastered.add(id)
    else mastered.delete(id)
  }
  return {
    ...state,
    ownedEntryIds: [...owned],
    masteredEntryIds: [...mastered],
    updatedAt: new Date().toISOString(),
    revision,
    entryVersions: { ...state.entryVersions, [id]: revision },
  }
}
export function nextState(state: EntryState): EntryState {
  return state === 'missing' ? 'owned' : state === 'owned' ? 'mastered' : 'missing'
}
export function versionOf(state: CollectionStateV1, id: string): string {
  return state.entryVersions?.[id] ?? `${state.updatedAt}:${stateOf(state, id)}`
}
export function metrics(state: CollectionStateV1, catalog: CollectionCatalog) {
  const valid = new Set(catalog.entryIds)
  const owned = new Set(state.ownedEntryIds.filter((id) => valid.has(id))).size
  const mastered = new Set(
    state.masteredEntryIds.filter((id) => valid.has(id) && state.ownedEntryIds.includes(id)),
  ).size
  const total = valid.size
  return {
    total,
    owned,
    mastered,
    missing: Math.max(total - owned, 0),
    collectionPercent: total ? Math.round((owned / total) * 100) : 0,
    masteryPercent: total ? Math.round((mastered / total) * 100) : 0,
  }
}
