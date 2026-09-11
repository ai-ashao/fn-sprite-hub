import { describe, expect, it } from 'vitest'
import { currentReleasedEntryCount } from '@/data/sprites'
import {
  buildDiscordCollectionSummary,
  type CollectionStateV1,
  collectionMetrics,
  cycleEntryState,
  entryState,
  normalizeCollectionState,
  parseCollectionBackup,
  serializeCollectionBackup,
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
      total: currentReleasedEntryCount,
      owned: 1,
      mastered: 1,
      missing: currentReleasedEntryCount - 1,
    })
  })

  it('round-trips a valid JSON backup', () => {
    const state = cycleEntryState(empty, 'jonesy:normal')
    expect(parseCollectionBackup(serializeCollectionBackup(state))).toEqual({ ok: true, state })
  })

  it('rejects malformed, unknown and inconsistent backups without producing replacement state', () => {
    expect(parseCollectionBackup('{bad')).toMatchObject({ ok: false })
    expect(
      parseCollectionBackup(
        JSON.stringify({ ...empty, ownedEntryIds: ['unknown:normal'], masteredEntryIds: [] }),
      ),
    ).toMatchObject({ ok: false, error: 'Unknown Sprite entry ID: unknown:normal' })
    expect(
      parseCollectionBackup(
        JSON.stringify({ ...empty, ownedEntryIds: [], masteredEntryIds: ['jonesy:normal'] }),
      ),
    ).toMatchObject({ ok: false, error: 'Mastered entry must also be owned: jonesy:normal' })
  })

  it('builds a Discord-ready summary from derived collection data', () => {
    const state = cycleEntryState(empty, 'jonesy:normal')
    const summary = buildDiscordCollectionSummary(state)
    expect(summary).toContain(`Collected: 1/${currentReleasedEntryCount}`)
    expect(summary).toContain(`Mastered: 0/${currentReleasedEntryCount}`)
    expect(summary).toContain('Need to Master:\n• Jonesy')
    expect(summary).toContain('• Gold Jonesy')
  })
})
