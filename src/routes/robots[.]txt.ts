import { createFileRoute } from '@tanstack/react-router'
import { absoluteUrl, site } from '@/lib/site'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /dashboard',
            ...(site.indexingEnabled ? [`Sitemap: ${absoluteUrl('/sitemap.xml')}`] : []),
            '',
          ].join('\n'),
          { headers: { 'content-type': 'text/plain; charset=utf-8' } },
        ),
    },
  },
})
