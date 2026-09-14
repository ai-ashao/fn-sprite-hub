#!/usr/bin/env node

import process from 'node:process'

const baseUrl = (process.argv[2] || process.env.WORKER_PREVIEW_URL || '').replace(/\/$/, '')

if (!baseUrl) {
  console.error(
    'Usage: node scripts/smoke-deployed-worker.mjs https://fn-sprite-hub.<subdomain>.workers.dev',
  )
  process.exit(2)
}

try {
  const parsed = new URL(baseUrl)
  if (parsed.protocol !== 'https:') throw new Error('HTTPS required')
} catch {
  console.error(`Invalid deployed Worker URL: ${baseUrl}`)
  process.exit(2)
}

const checks = [
  { path: '/', kind: 'page' },
  { path: '/api/health', kind: 'api' },
  { path: '/checklist', kind: 'page' },
  { path: '/variants', kind: 'page' },
  { path: '/new-sprites', kind: 'page' },
  { path: '/sprites/jonesy', kind: 'page' },
  { path: '/robots.txt', kind: 'text' },
  { path: '/sitemap.xml', kind: 'text' },
  { path: '/images/sprites/jonesy.webp', kind: 'asset' },
  { path: '/images/sprites/jonesy/loot-hacker.png', kind: 'asset' },
]

const failures = []
const results = new Map()

for (const check of checks) {
  const url = `${baseUrl}${check.path}`

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'FN-Sprite-Hub-deployment-smoke/1.0' },
    })

    const contentType = response.headers.get('content-type') || ''
    const ok = response.ok
    const body = check.kind === 'asset' ? '' : await response.text()
    results.set(check.path, { response, body })

    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${String(response.status).padEnd(3)} ${check.path} ${contentType}`,
    )

    if (!ok) {
      failures.push(
        `${check.path}: HTTP ${response.status}${body ? ` — ${body.slice(0, 220)}` : ''}`,
      )
      continue
    }

    if (check.kind === 'page' && !contentType.includes('text/html')) {
      failures.push(`${check.path}: expected text/html, got ${contentType || 'no content-type'}`)
    }

    if (check.kind === 'asset' && !contentType.startsWith('image/')) {
      failures.push(`${check.path}: expected image/*, got ${contentType || 'no content-type'}`)
    }
  } catch (error) {
    failures.push(`${check.path}: ${error instanceof Error ? error.message : String(error)}`)
    console.log(`FAIL --- ${check.path}`)
  }
}

const home = results.get('/')
if (home) {
  if (!home.body.includes('16 Sprite families · 61 entries')) {
    failures.push('/: expected the 16-family / 61-entry release snapshot.')
  }
  if (home.response.headers.get('x-robots-tag')?.toLowerCase().includes('noindex')) {
    failures.push('/: V1 owner page must not return an X-Robots-Tag noindex header.')
  }
  if (home.body.toLowerCase().includes('noindex,nofollow')) {
    failures.push('/: V1 owner page must not emit a noindex meta tag.')
  }
}

const variants = results.get('/variants')
if (variants && !variants.body.includes('15 released')) {
  failures.push('/variants: expected 15 released Loot Hacker entries.')
}

const newSprites = results.get('/new-sprites')
if (newSprites && !newSprites.body.includes('Fourteen more Loot Hacker variants')) {
  failures.push('/new-sprites: September 10 Loot Hacker update is missing.')
}

const detail = results.get('/sprites/jonesy')
if (detail && !detail.body.toLowerCase().includes('noindex,nofollow')) {
  failures.push('/sprites/jonesy: unreviewed Sprite detail must remain noindex.')
}

const robots = results.get('/robots.txt')
if (robots && !robots.body.includes('Sitemap: https://fnspritehub.com/sitemap.xml')) {
  failures.push('/robots.txt: production sitemap discovery is missing.')
}

const sitemap = results.get('/sitemap.xml')
if (sitemap) {
  for (const path of ['/', '/sprites', '/variants', '/new-sprites', '/checklist']) {
    const url = new URL(path, 'https://fnspritehub.com').toString()
    if (!sitemap.body.includes(`<loc>${url}</loc>`)) {
      failures.push(`/sitemap.xml: expected owner page ${url}.`)
    }
  }
  if (sitemap.body.includes('/sprites/jonesy')) {
    failures.push('/sitemap.xml: unreviewed Sprite detail must stay excluded.')
  }
}

if (failures.length) {
  console.error('\nDeployment smoke failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('\nDeployment smoke passed.')
