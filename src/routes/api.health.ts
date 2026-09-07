import { createFileRoute } from '@tanstack/react-router'
import { site } from '@/lib/site'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          ok: true,
          product: site.name,
          runtime: 'tanstack-start',
        }),
    },
  },
})
