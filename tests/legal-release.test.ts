import { describe, expect, it } from 'vitest'
import { validateLegalProfile } from '@/lib/legal'
import { legalProfile } from '@/modules/legal-profile'

describe('legal production release gate', () => {
  it('requires the checked-in legal profile to be structurally valid and truthful', () => {
    expect(validateLegalProfile(legalProfile)).toEqual([])
  })
})
