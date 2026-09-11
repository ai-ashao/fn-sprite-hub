import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('@/lib/site')
  vi.doUnmock('@/data/sprites')
  vi.resetModules()
})

test('QA30: default configuration still holds indexing and sitemap publication', async () => {
  const { site } = await import('@/lib/site')
  const { pageHead } = await import('@/lib/seo')
  const { sitemapEntries } = await import('@/i18n/routes')
  expect(site.indexingEnabled).toBe(false)
  expect(sitemapEntries()).toEqual([])
  expect(
    pageHead({ title: 'Test', description: 'Test.', path: '/', indexable: true }).meta,
  ).toContainEqual({ name: 'robots', content: 'noindex,nofollow' })
})

test('QA30 isolated fixture: future release still respects per-page editorial gates', async () => {
  vi.doMock('@/lib/site', () => ({
    site: { name: 'FN Sprite Hub', url: 'https://fnspritehub.com', indexingEnabled: true },
    absoluteUrl: (path: string) => new URL(path, 'https://fnspritehub.com').toString(),
  }))
  vi.doMock('@/data/sprites', () => ({
    currentDataVerifiedAt: '2026-09-08',
    spriteSeoRegistry: [
      {
        familyId: 'approved',
        slug: 'approved',
        path: '/sprites/approved',
        indexable: true,
        lastModified: '2026-09-08',
      },
      {
        familyId: 'pending',
        slug: 'pending',
        path: '/sprites/pending',
        indexable: false,
        lastModified: '2026-09-08',
      },
    ],
  }))
  vi.resetModules()
  const { pageHead } = await import('@/lib/seo')
  const { sitemapEntries } = await import('@/i18n/routes')
  const paths = sitemapEntries().map(({ path }) => path)
  expect(paths).toContain('/sprites/approved')
  expect(paths).not.toContain('/sprites/pending')
  expect(paths.every((path) => !path.includes('?'))).toBe(true)
  expect(
    pageHead({
      title: 'Pending',
      description: 'Pending.',
      path: '/sprites/pending',
      indexable: false,
    }).meta,
  ).toContainEqual({ name: 'robots', content: 'noindex,nofollow' })
  expect(
    pageHead({
      title: 'Approved',
      description: 'Approved.',
      path: '/sprites/approved',
      indexable: true,
    }).meta,
  ).not.toContainEqual({ name: 'robots', content: 'noindex,nofollow' })
})
