import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { publicEnv } from '@/lib/config/env'
import { epicFanContentDisclaimer, hasConfiguredEpicFanContentDisclaimer } from '@/lib/fan-content'
import { site } from '@/lib/site'
import spriteStyles from '@/sprite-theme.css?url'
import styles from '@/styles.css?url'

const nav = [
  ['Tracker', '/'],
  ['Checklist', '/checklist'],
  ['Sprites', '/sprites'],
  ['Variants', '/variants'],
  ['Rarity', '/rarity'],
  ['Locations', '/locations'],
] as const

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: site.name },
      ...(publicEnv.googleSiteVerification
        ? [{ name: 'google-site-verification', content: publicEnv.googleSiteVerification }]
        : []),
    ],
    links: [
      { rel: 'stylesheet', href: styles },
      { rel: 'stylesheet', href: spriteStyles },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div className="fn-app-shell" data-product-surface-mode="tool">
      <header className="fn-header" data-site-header>
        <div className="fn-header-inner">
          <a className="fn-brand" href="/" aria-label="FN Sprite Hub home">
            <span className="fn-brand-mark" aria-hidden="true">
              <i />
              <b />
            </span>
            <span>FN Sprite Hub</span>
          </a>

          <nav aria-label="Primary navigation" className="fn-nav">
            {nav.map(([label, href]) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <a aria-current={active ? 'page' : undefined} href={href} key={href}>
                  {label}
                </a>
              )
            })}
          </nav>

          <span className="fn-language-pill" title="More languages after English SEO validation">
            EN · English
          </span>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="fn-footer" data-site-footer>
        <div className="fn-footer-inner">
          <div>
            <a className="fn-brand" href="/">
              <span className="fn-brand-mark small" aria-hidden="true">
                <i />
                <b />
              </span>
              <span>FN Sprite Hub</span>
            </a>
            <p>
              Free, fan-made Fortnite Sprite tracking tools. Collection progress stays in your
              browser.
            </p>
          </div>
          <nav aria-label="Footer">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy-policy">Privacy</a>
            <a href="/terms-of-service">Terms</a>
          </nav>
        </div>
        {hasConfiguredEpicFanContentDisclaimer ? (
          <div className="fn-disclaimer" data-epic-fan-content-disclaimer>
            {epicFanContentDisclaimer}
          </div>
        ) : null}
      </footer>
    </div>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: 'en',
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <section className="sprite-container sprite-not-found">
      <p className="sprite-kicker">404</p>
      <h1>Sprite page not found</h1>
      <p>The page may have moved or the Sprite slug is not part of the verified roster.</p>
      <Button asChild className="mt-7">
        <a href="/">Return to the tracker</a>
      </Button>
    </section>
  )
}
