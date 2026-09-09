import { describe, expect, it } from 'vitest'
import {
  spriteArtworkManifest,
  validateSpriteArtworkManifest,
} from '@/data/sprite-artwork-manifest'
import { spriteEntries } from '@/data/sprites'

describe('Sprite artwork single source of truth', () => {
  it('keeps every runtime Sprite entry aligned with the canonical artwork manifest', () => {
    expect(validateSpriteArtworkManifest()).toEqual([])
    expect(spriteArtworkManifest).toHaveLength(spriteEntries.length)

    const records = new Map(spriteArtworkManifest.map((record) => [record.entryId, record]))

    for (const entry of spriteEntries) {
      const record = records.get(entry.id)
      expect(record, entry.id).toBeDefined()
      expect(record?.localPath).toBe(entry.image)
      expect(record?.imageMode).toBe(entry.imageMode)
      expect(record?.sourceUrls).toEqual(entry.sourceRefs)
    }
  })

  it('keeps independent variant download metadata unique and complete', () => {
    const variants = spriteArtworkManifest.filter(({ imageMode }) => imageMode === 'entry')

    expect(variants).toHaveLength(31)
    expect(new Set(variants.map(({ assetId }) => assetId)).size).toBe(31)
    expect(new Set(variants.map(({ sourceUrl }) => sourceUrl)).size).toBe(31)

    for (const record of variants) {
      expect(record.assetId).toBeTypeOf('number')
      expect(record.assetPage).toMatch(/^https:\/\/fortnite\.gg\/assets\?id=\d+$/)
      expect(record.sourceUrl).toMatch(/^https:\/\/fnggcdn\.com\/assets\/[A-Za-z0-9]+\.png$/)
      expect(record.localPath).toMatch(/^\/images\/sprites\/.+\.png$/)
    }
  })

  it('keeps use-review decisions explicit rather than inferred from download availability', () => {
    expect(
      spriteArtworkManifest.every(
        ({ displayUseReview, exportUseReview }) =>
          displayUseReview === 'pending' && exportUseReview === 'pending',
      ),
    ).toBe(true)
  })
})
