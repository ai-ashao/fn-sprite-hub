import { createFileRoute } from '@tanstack/react-router'
import { sitemapEntries } from '@/i18n/routes'
import { absoluteUrl } from '@/lib/site'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const urls = sitemapEntries()
          .map((entry) => {
            const lastmod = entry.lastModified
              ? `<lastmod>${escapeXml(entry.lastModified)}</lastmod>`
              : ''
            return `<url><loc>${escapeXml(absoluteUrl(entry.path))}</loc>${lastmod}</url>`
          })
          .join('')

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
          { headers: { 'content-type': 'application/xml; charset=utf-8' } },
        )
      },
    },
  },
})

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
