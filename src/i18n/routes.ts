import { spriteSeoRegistry } from '@/data/sprites'
import { type GuideSlug, guides } from '@/lib/guides'
import { isLegalProfileLaunchReady } from '@/lib/legal'
import { legalProfile } from '@/modules/legal-profile'
import { defaultLocale, type Locale } from './config'

export type PublicPageId =
  | 'home'
  | 'checklist'
  | 'sprites'
  | 'variants'
  | 'rarity'
  | 'locations'
  | 'rarest'
  | 'new'
  | 'mastery'
  | 'pricing'
  | 'guides'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | `guide:${GuideSlug}`

export type LocalizedPaths = Partial<Record<Locale, string>>

export type PublicPageRoute = {
  id: PublicPageId
  indexable: boolean
  paths: LocalizedPaths
  lastModified?: string
}

const legalPagesIndexable = isLegalProfileLaunchReady(legalProfile)

const staticPages: PublicPageRoute[] = [
  { id: 'home', indexable: true, paths: { en: '/' }, lastModified: '2026-09-07' },
  { id: 'checklist', indexable: true, paths: { en: '/checklist' }, lastModified: '2026-09-07' },
  { id: 'sprites', indexable: true, paths: { en: '/sprites' }, lastModified: '2026-09-07' },
  { id: 'variants', indexable: true, paths: { en: '/variants' }, lastModified: '2026-09-07' },
  { id: 'rarity', indexable: true, paths: { en: '/rarity' }, lastModified: '2026-09-07' },
  { id: 'locations', indexable: true, paths: { en: '/locations' }, lastModified: '2026-09-07' },
  { id: 'rarest', indexable: true, paths: { en: '/rarest-sprites' }, lastModified: '2026-09-07' },
  { id: 'new', indexable: true, paths: { en: '/new-sprites' }, lastModified: '2026-09-07' },
  {
    id: 'mastery',
    indexable: true,
    paths: { en: '/guides/how-to-master-sprites' },
    lastModified: '2026-09-07',
  },

  // Compatibility surfaces remain available but are excluded from the V1 topical index set.
  { id: 'pricing', indexable: false, paths: { en: '/pricing' } },
  { id: 'guides', indexable: false, paths: { en: '/guides' } },
  { id: 'about', indexable: true, paths: { en: '/about' } },
  { id: 'contact', indexable: true, paths: { en: '/contact' } },
  { id: 'privacy', indexable: legalPagesIndexable, paths: { en: '/privacy-policy' } },
  { id: 'terms', indexable: legalPagesIndexable, paths: { en: '/terms-of-service' } },
]

const legacyGuidePages: PublicPageRoute[] = guides.map((guide) => ({
  id: guidePageId(guide.slug),
  indexable: false,
  paths: { en: `/guides/${guide.slug}` },
}))

export const publicPageRoutes: ReadonlyArray<PublicPageRoute> = [
  ...staticPages,
  ...legacyGuidePages,
]

export type LocaleAlternate = {
  locale: Locale
  path: string
  label: string
  shortLabel: string
}

export type SitemapEntry = {
  path: string
  lastModified?: string
}

export function guidePageId(slug: GuideSlug): `guide:${GuideSlug}` {
  return `guide:${slug}`
}

export function localizedPath(pageId: PublicPageId, locale: Locale): string | undefined {
  return publicPageRoutes.find((page) => page.id === pageId)?.paths[locale]
}

export function isPublicPageIndexable(pageId: PublicPageId): boolean {
  const page = publicPageRoutes.find((candidate) => candidate.id === pageId)
  if (!page) throw new Error(`Unknown public page: ${pageId}`)
  return page.indexable
}

export function localizedPathOrDefault(pageId: PublicPageId, locale: Locale): string {
  const page = publicPageRoutes.find((candidate) => candidate.id === pageId)
  const path = page?.paths[locale] || page?.paths[defaultLocale]
  if (!path) throw new Error(`Missing localized route for ${pageId}`)
  return path
}

export function resolvePublicPage(
  pathname: string,
): { pageId: PublicPageId; locale: Locale; path: string } | undefined {
  const normalized = normalizePath(pathname)
  for (const page of publicPageRoutes) {
    for (const [locale, path] of Object.entries(page.paths) as [Locale, string][]) {
      if (path && normalizePath(path) === normalized) return { pageId: page.id, locale, path }
    }
  }
  return undefined
}

export function localeAlternatesForPath(_pathname: string): LocaleAlternate[] {
  // Phase A is English-only in production.
  return []
}

export function hreflangAlternates(_pageId: PublicPageId): Array<{
  locale: Locale | 'x-default'
  path: string
}> {
  // Phase A intentionally emits no hreflang until a real localized equivalent exists.
  return []
}

export function sitemapEntries(): SitemapEntry[] {
  const staticEntries = publicPageRoutes.flatMap((page) => {
    if (!page.indexable) return []
    const path = page.paths.en
    return path ? [{ path, lastModified: page.lastModified }] : []
  })

  const spriteEntries = spriteSeoRegistry
    .filter((entry) => entry.indexable)
    .map((entry) => ({
      path: entry.path,
      lastModified: entry.lastModified,
    }))

  const byPath = new Map<string, SitemapEntry>()
  for (const entry of [...staticEntries, ...spriteEntries]) {
    byPath.set(normalizePath(entry.path), { ...entry, path: normalizePath(entry.path) })
  }

  return [...byPath.values()]
}

export function sitemapPaths(): string[] {
  return sitemapEntries().map((entry) => entry.path)
}

export function spriteSeoRouteForPath(pathname: string) {
  const normalized = normalizePath(pathname)
  return spriteSeoRegistry.find((entry) => normalizePath(entry.path) === normalized)
}

export function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0] || '/'
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}
