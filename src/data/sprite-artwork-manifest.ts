import { type SpriteImageMode, spriteEntries } from '@/data/sprites'

export type ArtworkUseReview = 'pending' | 'approved' | 'blocked'

export type SpriteArtworkRecord = {
  id: string
  entryId: string
  localPath: string
  imageMode: SpriteImageMode
  sourceUrls: string[]
  sourceType: 'official' | 'structured-data' | 'specialist' | 'fallback'
  reviewedAt: string
  reviewNote?: string
  policyOrTermsRef?: string
  displayUseReview: ArtworkUseReview
  exportUseReview: ArtworkUseReview
}

// Human review decisions belong here. Empty means the current fallback asset remains
// unapproved for production/share export until its actual source/policy review is completed.
const reviewOverrides: Partial<
  Record<
    string,
    Pick<
      SpriteArtworkRecord,
      | 'sourceType'
      | 'reviewedAt'
      | 'reviewNote'
      | 'policyOrTermsRef'
      | 'displayUseReview'
      | 'exportUseReview'
    >
  >
> = {}

function sourceTypeFor(imageMode: SpriteImageMode): SpriteArtworkRecord['sourceType'] {
  return imageMode === 'family-fallback' ? 'fallback' : 'specialist'
}

export const spriteArtworkManifest: readonly SpriteArtworkRecord[] = spriteEntries.map((entry) => {
  const review = reviewOverrides[entry.id]
  return {
    id: `sprite-artwork:${entry.id}`,
    entryId: entry.id,
    localPath: entry.image,
    imageMode: entry.imageMode,
    sourceUrls: [...entry.sourceRefs],
    sourceType: review?.sourceType ?? sourceTypeFor(entry.imageMode),
    reviewedAt: review?.reviewedAt ?? entry.verifiedAt,
    reviewNote: review?.reviewNote,
    policyOrTermsRef: review?.policyOrTermsRef,
    displayUseReview: review?.displayUseReview ?? 'pending',
    exportUseReview: review?.exportUseReview ?? 'pending',
  }
})

export function artworkRecordForEntry(entryId: string): SpriteArtworkRecord | undefined {
  return spriteArtworkManifest.find((record) => record.entryId === entryId)
}

export function validateSpriteArtworkManifest(): readonly string[] {
  const issues: string[] = []
  const seenEntryIds = new Set<string>()

  for (const record of spriteArtworkManifest) {
    if (seenEntryIds.has(record.entryId)) {
      issues.push(`Duplicate artwork review record: ${record.entryId}`)
    }
    seenEntryIds.add(record.entryId)

    if (!record.localPath.startsWith('/')) {
      issues.push(`Artwork must use a same-origin local path: ${record.entryId}`)
    }
    if (/^https?:\/\//i.test(record.localPath)) {
      issues.push(`Runtime artwork hotlink is not allowed: ${record.entryId}`)
    }
    if (!record.sourceUrls.length) {
      issues.push(`Artwork has no traceable source state: ${record.entryId}`)
    }
    if (!record.reviewedAt || Number.isNaN(Date.parse(record.reviewedAt))) {
      issues.push(`Artwork has invalid reviewedAt: ${record.entryId}`)
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
