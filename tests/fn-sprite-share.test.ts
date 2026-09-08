import { describe, expect, it } from 'vitest'
import { currentReleasedEntries } from '@/data/sprites'
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
  it.each([
    [0, 2],
    [1, 2],
    [6, 2],
    [12, 2],
    [24, 1],
    [25, 1],
    [47, 1],
  ])(
    'paginates a %i-owned collection with at most 24 missing entries per page',
    (owned, expectedPages) => {
      const selections = buildShareSelections('missing', state(owned))
      expect(selections).toHaveLength(expectedPages)
      expect(selections.every(({ entryIds }) => entryIds.length <= 24)).toBe(true)
      expect(selections.map(({ page }) => page)).toEqual(
        Array.from({ length: expectedPages }, (_, index) => index + 1),
      )
      expect(selections.every(({ pageCount }) => pageCount === expectedPages)).toBe(true)
    },
  )

  it('keeps missing and need-to-master as distinct entry sets', () => {
    const collection = state(13, 1)
    const missing = buildShareSelections('missing', collection).flatMap(({ entryIds }) => entryIds)
    const unmastered = buildShareSelections('unmastered', collection).flatMap(
      ({ entryIds }) => entryIds,
    )
    expect(missing).toHaveLength(34)
    expect(unmastered).toHaveLength(12)
    expect(missing.some((id) => unmastered.includes(id))).toBe(false)
  })

  it('unlocks both celebration outcomes only at full completion', () => {
    expect(shareTemplateAvailable('celebration', state(46))).toBe(false)
    expect(
      buildShareLayoutModel(buildShareSelections('celebration', state(47))[0], state(47))
        .celebration,
    ).toBe('collection')
    expect(
      buildShareLayoutModel(buildShareSelections('celebration', state(47, 47))[0], state(47, 47))
        .celebration,
    ).toBe('mastered')
  })

  it('keeps every fixture inside the fixed 1080 by 1350 canvas with signature and page label', () => {
    const fixtures = [
      buildShareSelections('collection', state(20, 8))[0],
      buildShareSelections('missing', state(41))[0],
      buildShareSelections('missing', state(23))[0],
      buildShareSelections('missing', state(0))[0],
      buildShareSelections('unmastered', state(12))[0],
      buildShareSelections('celebration', state(47))[0],
      buildShareSelections('celebration', state(47, 47))[0],
    ]

    for (const selection of fixtures) {
      const collection = selection.template === 'celebration' ? state(47, 47) : state(12)
      const model = buildShareLayoutModel(selection, collection)
      expect({ width: model.width, height: model.height }).toEqual(shareCanvasSize)
      expect(model.signature).toContain('fnspritehub.com')
      expect(model.cards.every((card) => card.x >= 0 && card.y >= 0)).toBe(true)
      expect(model.cards.every((card) => card.x + card.width <= model.width)).toBe(true)
      expect(model.cards.every((card) => card.y + card.height <= 1225)).toBe(true)
    }

    const multi = buildShareSelections('missing', state(0))[1]
    expect(buildShareLayoutModel(multi, state(0)).pageLabel).toBe('2/2')
    expect(shareFileName(multi)).toContain('2-of-2')
  })

  it('builds all three Discord modes from the same selection contract', () => {
    const collection = state(2, 1)
    for (const template of ['collection', 'missing', 'unmastered'] as const) {
      const pages = buildShareSelections(template, collection)
      const selection = { ...pages[0], entryIds: pages.flatMap(({ entryIds }) => entryIds) }
      const text = buildDiscordShareText(selection, collection)
      expect(text).toContain('Collected: 2/47')
      expect(text).toContain('fnspritehub.com')
    }
    expect(
      buildDiscordShareText(buildShareSelections('unmastered', collection)[0], collection),
    ).toContain('Need to Master')
  })
})
