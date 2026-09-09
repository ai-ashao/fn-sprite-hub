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
  { path: '/sprites/jonesy', kind: 'page' },
  { path: '/robots.txt', kind: 'text' },
  { path: '/sitemap.xml', kind: 'text' },
  { path: '/images/sprites/jonesy.webp', kind: 'asset' },
]

const failures = []

for (const check of checks) {
  const url = `${baseUrl}${check.path}`

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'FN-Sprite-Hub-deployment-smoke/1.0' },
    })

    const contentType = response.headers.get('content-type') || ''
    const ok = response.ok

    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${String(response.status).padEnd(3)} ${check.path} ${contentType}`,
    )

    if (!ok) {
      const body = await response.text().catch(() => '')
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

if (failures.length) {
  console.error('\nDeployment smoke failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('\nDeployment smoke passed.')
