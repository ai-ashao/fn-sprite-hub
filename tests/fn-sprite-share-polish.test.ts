import { describe, expect, it } from 'vitest'
import {
  productionArtworkReviewIssues,
  spriteArtworkManifest,
  validateSpriteArtworkManifest,
} from '@/data/sprite-artwork-manifest'
import { currentReleasedEntries } from '@/data/sprites'
import type { CollectionStateV1 } from '@/lib/sprites/collection'
import { buildShareLayoutModel, containRect, shareTypography } from '@/lib/sprites/share-renderer'
import { buildShareSelections, celebrationFamilyIds } from '@/lib/sprites/share-selection'

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

describe('Share visual polish contracts', () => {
  it('keeps the social-card typography above the readability floor', () => {
    expect(shareTypography.mainTitle).toBeGreaterThanOrEqual(56)
    expect(shareTypography.summary).toBeGreaterThanOrEqual(30)
    expect(shareTypography.entryName).toBeGreaterThanOrEqual(28)
    expect(shareTypography.finishBadge).toBeGreaterThanOrEqual(24)
    expect(shareTypography.signature).toBeGreaterThanOrEqual(24)
    expect(shareTypography.pageLabel).toBeGreaterThanOrEqual(24)
  })

  it('contains artwork without changing its aspect ratio', () => {
    const landscape = containRect(400, 200, 10, 20, 100, 100)
    expect(landscape).toEqual({ x: 10, y: 45, width: 100, height: 50 })
    expect(landscape.width / landscape.height).toBeCloseTo(2)

    const portrait = containRect(200, 400, 10, 20, 100, 100)
    expect(portrait).toEqual({ x: 35, y: 20, width: 50, height: 100 })
    expect(portrait.width / portrait.height).toBeCloseTo(0.5)
  })

  it('uses explicit celebration curation rather than array order', () => {
    expect(celebrationFamilyIds).toEqual(['bush', 'sonic', 'crown', 'klombo', 'x-ray'])

    const total = currentReleasedEntries().length
    const selection = buildShareSelections('celebration', state(total))[0]
    expect(selection.familyIds).toEqual([...celebrationFamilyIds])
  })

  it('renders four family finish status slots on the collection poster', () => {
    const selection = buildShareSelections('collection', state(12, 4))[0]
    const model = buildShareLayoutModel(selection, state(12, 4))

    expect(model.cards.length).toBeGreaterThan(0)
    expect(model.cards.every((card) => card.markers?.length === 4)).toBe(true)
    expect(model.cards.some((card) => card.markers?.some((marker) => marker.state === 'na'))).toBe(
      true,
    )
  })

  it('derives celebration totals from the current dataset', () => {
    const total = currentReleasedEntries().length
    const selection = buildShareSelections('celebration', state(total, total))[0]
    const model = buildShareLayoutModel(selection, state(total, total))

    expect(model.summary).toBe(`${total}/${total} · 100%`)
    expect(model.completionPercent).toBe(100)
  })
})

describe('Artwork review manifest', () => {
  it('covers every current entry without runtime hotlinks', () => {
    expect(validateSpriteArtworkManifest()).toEqual([])
    expect(spriteArtworkManifest).toHaveLength(currentReleasedEntries().length)
    expect(spriteArtworkManifest.every((record) => record.localPath.startsWith('/'))).toBe(true)
  })

  it('keeps every display and export use approved with review evidence', () => {
    expect(productionArtworkReviewIssues()).toEqual([])
    expect(
      spriteArtworkManifest.every(
        (record) =>
          record.displayUseReview === 'approved' &&
          record.exportUseReview === 'approved' &&
          Boolean(record.reviewedAt && record.policyOrTermsRef && record.reviewNote),
      ),
    ).toBe(true)
  })
})
