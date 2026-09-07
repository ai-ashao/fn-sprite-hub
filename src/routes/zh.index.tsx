import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/zh/')({
  beforeLoad: () => {
    throw redirect({ to: '/', replace: true })
  },
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex,nofollow' }],
  }),
  component: () => null,
})
