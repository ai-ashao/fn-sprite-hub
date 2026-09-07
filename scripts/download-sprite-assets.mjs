#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const manifestPath = path.resolve('src/data/sprite-image-manifest.json')
const outDir = path.resolve('public/images/sprites')
const allowedHosts = new Set(['fortnite.gg'])
const maxAssetBytes = 10 * 1024 * 1024

const assets = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
await fs.mkdir(outDir, { recursive: true })

const slugs = new Set()
let downloaded = 0
let failed = 0

for (const asset of assets) {
  const slug = String(asset.name)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const source = new URL(asset.url)

  try {
    if (source.protocol !== 'https:' || !allowedHosts.has(source.hostname)) {
      throw new Error(`source host is not allowed: ${source.hostname}`)
    }
    if (!slug || slugs.has(slug)) throw new Error(`invalid or duplicate slug: ${slug}`)
    slugs.add(slug)

    const response = await fetch(source, {
      headers: {
        Accept: 'image/webp,image/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 FN-Sprite-Hub asset build/1.0',
      },
    })
    const finalUrl = new URL(response.url)
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    if (!allowedHosts.has(finalUrl.hostname)) {
      throw new Error(`redirected to an unapproved host: ${finalUrl.hostname}`)
    }
    if (response.headers.get('content-type')?.split(';', 1)[0] !== 'image/webp') {
      throw new Error(`unexpected content type: ${response.headers.get('content-type')}`)
    }

    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length === 0 || bytes.length > maxAssetBytes) {
      throw new Error(`unexpected file size: ${bytes.length} bytes`)
    }

    const target = path.join(outDir, `${slug}.webp`)
    const temporary = `${target}.tmp`
    await fs.writeFile(temporary, bytes)
    await fs.rename(temporary, target)
    console.log(
      `✓ ${asset.name} -> ${path.relative(process.cwd(), target)} (${Math.round(bytes.length / 1024)} KB)`,
    )
    downloaded += 1
  } catch (error) {
    console.error(`✗ ${asset.name}: ${error instanceof Error ? error.message : String(error)}`)
    failed += 1
  }
}

console.log(`Done. ${downloaded} downloaded, ${failed} failed.`)
if (failed > 0) process.exitCode = 1
