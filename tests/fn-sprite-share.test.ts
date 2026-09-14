import { describe, expect, it } from 'vitest'
import { currentReleasedEntries, currentReleasedEntryCount } from '@/data/sprites'
import type { CollectionStateV1 } from '@/lib/sprites/collection'
import { buildShareLayoutModel, shareCanvasSize, shareFileName } from '@/lib/sprites/share-renderer'
import {
  buildDiscordShareText,
  buildShareSelections,
  shareTemplateAvailable,
} from '@/lib/sprites/share-selection'

function state(owned = 0, mastered = 0): CollectionStateV1 {
  const ids = currentReleasedEntries().map(({ id }) => id)
  return {
    schemaVersion: 1,
    seasonId: 'c7s4',
    ownedEntryIds: ids.slice(0, owned),
    masteredEntryIds: ids.slice(0, mastered),
    updatedAt: '2026-09-08T00:00:00.000Z',
  }
}

describe('Share Studio selection and deterministic layout', () => {
  it.each([0, 1, 6, 12, 24, 25, 47, 61])(
    'keeps a %i-owned collection in one missing-Sprites poster',
    (owned) => {
      const selections = buildShareSelections('missing', state(owned))
      expect(selections).toHaveLength(1)
      expect(selections[0].entryIds).toHaveLength(currentReleasedEntryCount - owned)
      expect(selections[0]).toMatchObject({ page: 1, pageCount: 1 })
    },
  )

  it('keeps missing and need-to-master as distinct entry sets', () => {
    const collection = state(13, 1)
    const missing = buildShareSelections('missing', collection).flatMap(({ entryIds }) => entryIds)
    const unmastered = buildShareSelections('unmastered', collection).flatMap(
      ({ entryIds }) => entryIds,
    )
    expect(missing).toHaveLength(48)
    expect(unmastered).toHaveLength(12)
    expect(missing.some((id) => unmastered.includes(id))).toBe(false)
  })

  it('unlocks both celebration outcomes only at full completion', () => {
    expect(shareTemplateAvailable('celebration', state(currentReleasedEntryCount - 1))).toBe(false)
    expect(
      buildShareLayoutModel(
        buildShareSelections('celebration', state(currentReleasedEntryCount))[0],
        state(currentReleasedEntryCount),
      ).celebration,
    ).toBe('collection')
    expect(
      buildShareLayoutModel(
        buildShareSelections(
          'celebration',
          state(currentReleasedEntryCount, currentReleasedEntryCount),
        )[0],
        state(currentReleasedEntryCount, currentReleasedEntryCount),
      ).celebration,
    ).toBe('mastered')
  })

  it('keeps every fixture inside the fixed 1080 by 1920 canvas with one stable filename', () => {
    const fixtures = [
      buildShareSelections('collection', state(20, 8))[0],
      buildShareSelections('missing', state(41))[0],
      buildShareSelections('missing', state(23))[0],
      buildShareSelections('missing', state(0))[0],
      buildShareSelections('unmastered', state(12))[0],
      buildShareSelections('celebration', state(currentReleasedEntryCount))[0],
      buildShareSelections(
        'celebration',
        state(currentReleasedEntryCount, currentReleasedEntryCount),
      )[0],
    ]

    for (const selection of fixtures) {
      const collection =
        selection.template === 'celebration'
          ? state(currentReleasedEntryCount, currentReleasedEntryCount)
          : state(12)
      const model = buildShareLayoutModel(selection, collection)
      expect({ width: model.width, height: model.height }).toEqual(shareCanvasSize)
      expect(model.signature).toContain('fnspritehub.com')
      expect(model.cards.every((card) => card.x >= 0 && card.y >= 0)).toBe(true)
      expect(model.cards.every((card) => card.x + card.width <= model.width)).toBe(true)
      expect(model.cards.every((card) => card.y + card.height <= 1810)).toBe(true)
      expect(model.pageLabel).toBeUndefined()
      expect(shareFileName(selection)).not.toContain('-of-')
    }
  })

  it('builds all three Discord modes from the same selection contract', () => {
    const collection = state(2, 1)
    for (const template of ['collection', 'missing', 'unmastered'] as const) {
      const pages = buildShareSelections(template, collection)
      const selection = { ...pages[0], entryIds: pages.flatMap(({ entryIds }) => entryIds) }
      const text = buildDiscordShareText(selection, collection)
      expect(text).toContain(`Collected: 2/${currentReleasedEntryCount}`)
      expect(text).toContain('fnspritehub.com')
    }
    expect(
      buildDiscordShareText(buildShareSelections('unmastered', collection)[0], collection),
    ).toContain('Need to Master')
  })
})
