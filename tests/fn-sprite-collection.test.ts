import { describe, expect, it } from 'vitest'
import {
  type CollectionStateV1,
  collectionMetrics,
  cycleEntryState,
  entryState,
  normalizeCollectionState,
} from '@/lib/sprites/collection'

const empty: CollectionStateV1 = {
  schemaVersion: 1,
  seasonId: 'c7s4',
  ownedEntryIds: [],
  masteredEntryIds: [],
  updatedAt: '2026-09-07T00:00:00.000Z',
}

describe('Sprite collection state', () => {
  it('cycles missing → owned → mastered → missing', () => {
    const owned = cycleEntryState(empty, 'jonesy:normal')
    expect(entryState(owned, 'jonesy:normal')).toBe('owned')

    const mastered = cycleEntryState(owned, 'jonesy:normal')
    expect(entryState(mastered, 'jonesy:normal')).toBe('mastered')
    expect(mastered.ownedEntryIds).toContain('jonesy:normal')

    const missing = cycleEntryState(mastered, 'jonesy:normal')
    expect(entryState(missing, 'jonesy:normal')).toBe('missing')
  })

  it('drops invalid ids and enforces mastered subset of owned', () => {
    const normalized = normalizeCollectionState({
      ...empty,
      ownedEntryIds: ['jonesy:normal', 'invalid'],
      masteredEntryIds: ['jonesy:normal', 'sonic:normal', 'invalid'],
    })

    expect(normalized.ownedEntryIds).toEqual(['jonesy:normal'])
    expect(normalized.masteredEntryIds).toEqual(['jonesy:normal'])
  })

  it('derives progress against released current entries only', () => {
    const state = {
      ...empty,
      ownedEntryIds: ['jonesy:normal'],
      masteredEntryIds: ['jonesy:normal'],
    }
    expect(collectionMetrics(state)).toMatchObject({
      total: 47,
      owned: 1,
      mastered: 1,
      missing: 46,
    })
  })
})
