import artworkData from './sprite-artworks.json'
import { type SpriteImageMode, spriteEntries } from './sprites'

export type ArtworkUseReview = 'pending' | 'approved' | 'blocked'

export type SpriteArtworkRecord = {
  entryId: string
  localPath: string
  imageMode: SpriteImageMode
  sourceType: 'official' | 'structured-data' | 'specialist' | 'fallback'
  sourceUrls: string[]
  assetId: number | null
  assetPage: string | null
  sourceUrl: string | null
  reviewedAt: string
  policyOrTermsRef: string | null
  displayUseReview: ArtworkUseReview
  exportUseReview: ArtworkUseReview
  reviewNote: string | null
}

export const spriteArtworkManifest: readonly SpriteArtworkRecord[] = artworkData.map((record) => ({
  ...record,
  imageMode: record.imageMode as SpriteImageMode,
  sourceType: record.sourceType as SpriteArtworkRecord['sourceType'],
  displayUseReview: record.displayUseReview as ArtworkUseReview,
  exportUseReview: record.exportUseReview as ArtworkUseReview,
}))

export function artworkRecordForEntry(entryId: string): SpriteArtworkRecord | undefined {
  return spriteArtworkManifest.find((record) => record.entryId === entryId)
}

export function validateSpriteArtworkManifest(): readonly string[] {
  const issues: string[] = []
  const entryById = new Map(spriteEntries.map((entry) => [entry.id, entry] as const))
  const seenEntryIds = new Set<string>()

  for (const record of spriteArtworkManifest) {
    if (seenEntryIds.has(record.entryId)) {
      issues.push(`Duplicate artwork record: ${record.entryId}`)
    }
    seenEntryIds.add(record.entryId)

    const entry = entryById.get(record.entryId)
    if (!entry) {
      issues.push(`Artwork record has no matching Sprite entry: ${record.entryId}`)
      continue
    }

    if (entry.image !== record.localPath) {
      issues.push(`Artwork path drift for ${record.entryId}: ${entry.image} != ${record.localPath}`)
    }
    if (entry.imageMode !== record.imageMode) {
      issues.push(
        `Artwork imageMode drift for ${record.entryId}: ${entry.imageMode} != ${record.imageMode}`,
      )
    }
    if (JSON.stringify(entry.sourceRefs) !== JSON.stringify(record.sourceUrls)) {
      issues.push(`Artwork sourceRefs drift for ${record.entryId}`)
    }

    if (!record.localPath.startsWith('/') || /^https?:\/\//i.test(record.localPath)) {
      issues.push(`Artwork must use a same-origin local path: ${record.entryId}`)
    }
    if (!record.sourceUrls.length) {
      issues.push(`Artwork has no traceable source state: ${record.entryId}`)
    }
    if (!record.reviewedAt || Number.isNaN(Date.parse(record.reviewedAt))) {
      issues.push(`Artwork has invalid reviewedAt: ${record.entryId}`)
    }

    if (record.imageMode === 'entry') {
      if (!record.assetId || !record.assetPage || !record.sourceUrl) {
        issues.push(`Independent artwork is missing asset metadata: ${record.entryId}`)
      }
    }
  }

  if (seenEntryIds.size !== spriteEntries.length) {
    issues.push(
      `Artwork manifest coverage mismatch: ${seenEntryIds.size}/${spriteEntries.length} entries.`,
    )
  }

  return issues
}

export function productionArtworkReviewIssues(): readonly string[] {
  const issues = [...validateSpriteArtworkManifest()]

  for (const record of spriteArtworkManifest) {
    if (record.displayUseReview !== 'approved') {
      issues.push(`Display use review is not approved: ${record.entryId}`)
    }
    if (record.exportUseReview !== 'approved') {
      issues.push(`Share export use review is not approved: ${record.entryId}`)
    }
  }

  return issues
}
