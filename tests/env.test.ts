import { describe, expect, it } from 'vitest'
import { defaultSiteUrl, parsePublicEnv, validateProductionSiteUrl } from '@/lib/config/env'

describe('FN Sprite Hub public environment', () => {
  it('defaults to the real production domain instead of a ShipLean starter host', () => {
    expect(defaultSiteUrl).toBe('https://fnspritehub.com')
    expect(parsePublicEnv({}).siteUrl).toBe('https://fnspritehub.com')
  })

  it('normalizes explicit public configuration', () => {
    expect(
      parsePublicEnv({
        VITE_SITE_URL: 'https://preview.example.com/',
        VITE_GA4_ID: 'G-ABC123',
        VITE_GOOGLE_SITE_VERIFICATION: 'verify-me',
      }),
    ).toEqual({
      siteUrl: 'https://preview.example.com',
      ga4Id: 'G-ABC123',
      googleSiteVerification: 'verify-me',
    })
  })

  it('accepts the FN Sprite Hub production URL', () => {
    expect(validateProductionSiteUrl('https://fnspritehub.com')).toEqual([])
  })

  it('continues to reject starter, localhost and insecure production URLs', () => {
    expect(validateProductionSiteUrl('https://shiplean.dev')).toContain(
      'Production site URL must not use starter host: shiplean.dev',
    )
    expect(validateProductionSiteUrl('http://localhost:3000')).toEqual(
      expect.arrayContaining([
        'Production site URL must use HTTPS.',
        'Production site URL must not use localhost.',
      ]),
    )
  })

  it('rejects malformed public configuration early', () => {
    expect(() => parsePublicEnv({ VITE_SITE_URL: 'not-a-url' })).toThrow(
      'VITE_SITE_URL must be an absolute http(s) URL.',
    )
    expect(() => parsePublicEnv({ VITE_GA4_ID: 'bad-id' })).toThrow(
      'VITE_GA4_ID must look like G-XXXXXXXXXX.',
    )
  })
})
