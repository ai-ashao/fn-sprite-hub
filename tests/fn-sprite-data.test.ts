import { describe, expect, it } from 'vitest'
import {
  currentFamilyCount,
  currentReleasedEntryCount,
  entriesForFamily,
  spriteDetailIndexability,
  spriteEntries,
  spriteFamilies,
  spriteSeoRegistry,
  validateSpriteData,
} from '@/data/sprites'

describe('FN Sprite Hub current-season data', () => {
  it('matches the 2026-09-08 verified release snapshot', () => {
    expect(currentFamilyCount).toBe(16)
    expect(currentReleasedEntryCount).toBe(47)
    expect(spriteFamilies).toHaveLength(16)
  })

  it('passes the current-season structural data gate', () => {
    expect(validateSpriteData()).toEqual([])
  })

  it('keeps family ids, slugs and entry ids unique', () => {
    expect(new Set(spriteFamilies.map((family) => family.id)).size).toBe(spriteFamilies.length)
    expect(new Set(spriteFamilies.map((family) => family.slug)).size).toBe(spriteFamilies.length)
    expect(new Set(spriteEntries.map((entry) => entry.id)).size).toBe(spriteEntries.length)
  })

  it('keeps every released entry attached to a real family and local image', () => {
    const familyIds = new Set(spriteFamilies.map((family) => family.id))
    for (const entry of spriteEntries) {
      expect(familyIds.has(entry.familyId)).toBe(true)
      expect(entry.image.startsWith('/images/sprites/')).toBe(true)
      expect(entry.imageMode).toBe('family-fallback')
      expect(entry.sourceRefs.length).toBeGreaterThan(0)
      expect(entry.verifiedAt).toBe('2026-09-08')
    }
  })

  it('tracks Mega Man as single-form and Crown with released Loot Hacker', () => {
    expect(entriesForFamily('mega-man').map((entry) => entry.finish)).toEqual(['normal'])
    expect(entriesForFamily('crown').map((entry) => entry.finish)).toEqual([
      'normal',
      'gold',
      'cheat-master',
      'loot-hacker',
    ])
  })

  it('builds one SEO detail route per current family', () => {
    expect(spriteSeoRegistry).toHaveLength(16)
    expect(spriteSeoRegistry.every((route) => route.path.startsWith('/sprites/'))).toBe(true)
    expect(spriteSeoRegistry.every((route) => route.indexable)).toBe(true)
    for (const family of spriteFamilies) {
      expect(spriteDetailIndexability(family)).toMatchObject({
        score: 5,
        hasRequiredSources: true,
      })
    }
  })
})
