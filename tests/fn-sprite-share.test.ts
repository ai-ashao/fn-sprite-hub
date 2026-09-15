import { describe, expect, it } from 'vitest'
import { currentReleasedEntries, currentReleasedEntryCount } from '@/data/sprites'
import type { CollectionStateV1 } from '@/lib/sprites/collection'
import {
  buildShareLayoutModel,
  shareCanvasMinHeight,
  shareCanvasWidth,
  shareFileName,
} from '@/lib/sprites/share-renderer'
import {
  buildDiscordShareSelection,
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
  it.each([0, 1, 6, 12, 24, 25, 47])(
    'keeps a %i-owned collection in one missing-Sprites poster',
    (owned) => {
      const selections = buildShareSelections('missing', state(owned))
      expect(selections).toHaveLength(1)
      expect(selections[0].entryIds).toHaveLength(currentReleasedEntryCount - owned)
      expect(selections[0]).toMatchObject({ page: 1, pageCount: 1 })
    },
  )

  it('does not create an empty Missing image for a complete collection', () => {
    expect(buildShareSelections('missing', state(currentReleasedEntryCount))).toEqual([])
    expect(shareTemplateAvailable('missing', state(currentReleasedEntryCount))).toBe(false)
  })

  it('derives all four image types from the same collection state', () => {
    const collection = state(13, 1)
    const collected = buildShareSelections('collection', collection)[0].entryIds
    const missing = buildShareSelections('missing', collection).flatMap(({ entryIds }) => entryIds)
    const unmastered = buildShareSelections('unmastered', collection).flatMap(
      ({ entryIds }) => entryIds,
    )
    const mastered = buildShareSelections('mastered', collection)[0].entryIds
    expect(collected).toHaveLength(13)
    expect(missing).toHaveLength(48)
    expect(unmastered).toHaveLength(12)
    expect(mastered).toHaveLength(1)
    expect(missing.some((id) => unmastered.includes(id))).toBe(false)
    expect(new Set([...unmastered, ...mastered])).toEqual(new Set(collected))
  })

  it('disables image types that would render an empty card grid', () => {
    expect(shareTemplateAvailable('collection', state())).toBe(false)
    expect(shareTemplateAvailable('unmastered', state())).toBe(false)
    expect(shareTemplateAvailable('mastered', state())).toBe(false)
    expect(shareTemplateAvailable('missing', state())).toBe(true)
    expect(buildShareSelections('collection', state())).toEqual([])
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

  it('keeps every fixture inside one dynamic-height 1080px-wide canvas', () => {
    const collectionState = state(20, 8)
    const sixMissing = state(55, 8)
    const thirtyEightMissing = state(23, 8)
    const allMissing = state()
    const unmastered = state(12)
    const mastered = state(12, 4)
    const complete = state(currentReleasedEntryCount, currentReleasedEntryCount)
    const fixtures = [
      { selection: buildShareSelections('collection', collectionState)[0], collectionState },
      { selection: buildShareSelections('missing', sixMissing)[0], collectionState: sixMissing },
      {
        selection: buildShareSelections('missing', thirtyEightMissing)[0],
        collectionState: thirtyEightMissing,
      },
      { selection: buildShareSelections('missing', allMissing)[0], collectionState: allMissing },
      { selection: buildShareSelections('unmastered', unmastered)[0], collectionState: unmastered },
      { selection: buildShareSelections('mastered', mastered)[0], collectionState: mastered },
      { selection: buildShareSelections('celebration', complete)[0], collectionState: complete },
    ]

    for (const { selection, collectionState: fixtureCollection } of fixtures) {
      const model = buildShareLayoutModel(selection, fixtureCollection)
      expect(model.width).toBe(shareCanvasWidth)
      expect(model.height).toBeGreaterThanOrEqual(shareCanvasMinHeight)
      expect(model.signature).toContain('fnspritehub.com')
      expect(model.cards.every((card) => card.x >= 0 && card.y >= 0)).toBe(true)
      expect(model.cards.every((card) => card.x + card.width <= model.width)).toBe(true)
      expect(model.cards.every((card) => card.y + card.height <= model.height - 112)).toBe(true)
      expect(model.pageLabel).toBeUndefined()
      expect(shareFileName(selection)).not.toContain('-of-')
    }

    const longest = buildShareLayoutModel(buildShareSelections('missing', state())[0], state())
    expect(longest.height).toBeGreaterThan(1920)
  })

  it('keeps all three Discord modes independent from image filtering', () => {
    const collection = state(2, 1)
    for (const template of ['collection', 'missing', 'unmastered'] as const) {
      const selection = buildDiscordShareSelection(template, collection)
      const text = buildDiscordShareText(selection, collection)
      expect(text).toContain(`Collected: 2/${currentReleasedEntryCount}`)
      expect(text).toContain('fnspritehub.com')
    }
    expect(
      buildDiscordShareText(buildDiscordShareSelection('unmastered', collection), collection),
    ).toContain('Need to Master')

    const emptySummary = buildDiscordShareText(
      buildDiscordShareSelection('collection', state()),
      state(),
    )
    expect(emptySummary).toContain('My Fortnite Sprite Collection')
    expect(emptySummary).toContain('• Bush')
  })
})
