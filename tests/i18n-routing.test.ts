import { describe, expect, it } from 'vitest'
import {
  hreflangAlternates,
  localeAlternatesForPath,
  publicPageRoutes,
  sitemapEntries,
  sitemapPaths,
} from '../src/i18n/routes'

describe('FN Sprite Hub Phase A routing', () => {
  it('keeps the production SEO registry English-only', () => {
    for (const page of publicPageRoutes) {
      expect(page.paths['zh-CN']).toBeUndefined()
    }
    expect(hreflangAlternates('home')).toEqual([])
    expect(localeAlternatesForPath('/')).toEqual([])
  })

  it('keeps unreviewed Sprite details out of the sitemap without duplicates', () => {
    expect(sitemapPaths()).not.toContain('/sprites/sonic')
    expect(sitemapPaths()).not.toContain('/sprites/klombo')
    expect(new Set(sitemapPaths()).size).toBe(sitemapPaths().length)
  })

  it('keeps sitemap paths canonical and filter-free', () => {
    for (const entry of sitemapEntries()) {
      expect(entry.path === '/' || !entry.path.endsWith('/')).toBe(true)
      expect(entry.path).not.toContain('?')
      expect(entry.path).not.toContain('#')
    }
  })
})
