#!/usr/bin/env node

/**
 * Download the 31 released Chapter 7 Season 4 Sprite variant artworks.
 *
 * The explicit asset-page/CDN mapping avoids crawling Fortnite.GG, whose
 * Cloudflare challenge blocks unattended browser sessions. Every download is
 * constrained to the expected CDN, validated as PNG, size-limited, and moved
 * into place atomically.
 */

import { constants as fsConstants } from 'node:fs'
import { access, mkdir, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const ROOT = process.cwd()
const OUTPUT_ROOT = path.join(ROOT, 'public', 'images', 'sprites')
const REPORT_PATH = path.join(ROOT, 'scripts', 'sprite-variant-download-report.json')
const MAX_BYTES = 10 * 1024 * 1024
const MAX_OUTPUT_DIMENSION = 512
const OVERWRITE = process.argv.includes('--overwrite')
const DISCOVER_ONLY = process.argv.includes('--discover-only')

const assets = [
  ['klombo', 'gold', 6714, 'Bge6PE'],
  ['storm-scout', 'gold', 6715, 'gcgryS'],
  ['bush', 'gold', 6716, '7c8qRB'],
  ['crown', 'gold', 6717, 'kXICHs'],
  ['8-bit', 'gold', 6718, 'EhZcJQ'],
  ['sonic', 'gold', 6719, 'xIvjpR'],
  ['tails', 'gold', 6720, 'kO8Xiq'],
  ['shadow', 'gold', 6721, 'KbBT2x'],
  ['adventure', 'gold', 6722, 'lC64Zq'],
  ['killswitch', 'gold', 6723, 'lFCmnP'],
  ['jackrabbit', 'gold', 6724, 'fHzZ3K'],
  ['jonesy', 'gold', 6725, 'tPLZfl'],
  ['klombo', 'cheat-master', 6726, 'lSPWza'],
  ['storm-scout', 'cheat-master', 6727, 'N42ZkL'],
  ['bush', 'cheat-master', 6728, 'j8Xqdv'],
  ['crown', 'cheat-master', 6729, 'xyQS7t'],
  ['8-bit', 'cheat-master', 6730, 'MT8HRt'],
  ['sonic', 'cheat-master', 6731, 'IlDV5Z'],
  ['tails', 'cheat-master', 6732, 'kWGlTk'],
  ['shadow', 'cheat-master', 6733, 'ogIPYD'],
  ['adventure', 'cheat-master', 6734, 'lx7RNQ'],
  ['killswitch', 'cheat-master', 6735, 'vKEKeV'],
  ['jackrabbit', 'cheat-master', 6736, 'yu0qdi'],
  ['jonesy', 'cheat-master', 6737, 'OzjU4w'],
  ['x-ray', 'gold', 6894, 'itIwfn'],
  ['x-ray', 'cheat-master', 6895, 'pjnWfR'],
  ['onigiri', 'gold', 6897, 'ZRLC1I'],
  ['onigiri', 'cheat-master', 6898, 'RuRPR6'],
  ['overshield', 'gold', 6900, 'gPC3OF'],
  ['overshield', 'cheat-master', 6901, 'xWABAX'],
  ['crown', 'loot-hacker', 6903, 'w0edGJ'],
].map(([family, finish, assetId, cdnId]) => ({
  key: `${family}:${finish}`,
  family,
  finish,
  assetId,
  assetPage: `https://fortnite.gg/assets?id=${assetId}`,
  sourceUrl: `https://fnggcdn.com/assets/${cdnId}.png`,
}))

async function exists(file) {
  try {
    await access(file, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

function validatePng(bytes, contentType, finalUrl) {
  const url = new URL(finalUrl)
  if (url.protocol !== 'https:' || url.hostname !== 'fnggcdn.com') {
    throw new Error(`Unexpected download host: ${url.origin}`)
  }
  if (!contentType.toLowerCase().startsWith('image/png')) {
    throw new Error(`Unexpected content type: ${contentType || 'missing'}`)
  }
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw new Error(`Unexpected file size: ${bytes.length} bytes`)
  }
  if (!bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error('Downloaded file does not have a PNG signature.')
  }
}

async function download(asset) {
  const familyDir = path.join(OUTPUT_ROOT, asset.family)
  const destination = path.join(familyDir, `${asset.finish}.png`)
  const legacyThumbnail = path.join(familyDir, `${asset.finish}.jpg`)
  const temporary = `${destination}.download`
  await mkdir(familyDir, { recursive: true })

  if (!OVERWRITE && (await exists(destination))) {
    return { ...asset, mode: 'skipped-existing', output: path.relative(ROOT, destination) }
  }

  const response = await fetch(asset.sourceUrl, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${asset.sourceUrl}`)
  }

  const sourceBytes = Buffer.from(await response.arrayBuffer())
  validatePng(sourceBytes, response.headers.get('content-type') ?? '', response.url)
  const { data: outputBytes, info } = await sharp(sourceBytes)
    .resize({
      width: MAX_OUTPUT_DIMENSION,
      height: MAX_OUTPUT_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true })

  if (info.width > MAX_OUTPUT_DIMENSION || info.height > MAX_OUTPUT_DIMENSION) {
    throw new Error(`Optimized image is too large: ${info.width}x${info.height}`)
  }
  validatePng(outputBytes, 'image/png', asset.sourceUrl)

  try {
    await writeFile(temporary, outputBytes, { flag: 'wx' })
    await rename(temporary, destination)
    await unlink(legacyThumbnail).catch(() => undefined)
  } catch (error) {
    await unlink(temporary).catch(() => undefined)
    throw error
  }

  return {
    ...asset,
    mode: 'downloaded',
    output: path.relative(ROOT, destination),
    sourceBytes: sourceBytes.length,
    bytes: outputBytes.length,
    width: info.width,
    height: info.height,
  }
}

const records = []
const failures = []

if (new Set(assets.map(({ key }) => key)).size !== assets.length) {
  throw new Error('Variant manifest contains duplicate entry keys.')
}

for (const asset of assets) {
  if (DISCOVER_ONLY) {
    records.push({ ...asset, mode: 'manifest-only' })
    continue
  }

  try {
    const record = await download(asset)
    records.push(record)
    console.log(`✓ ${asset.key.padEnd(28)} ${record.output}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push({ key: asset.key, error: message })
    console.error(`✗ ${asset.key}: ${message}`)
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  targetCount: assets.length,
  downloadedCount: records.filter(({ mode }) => mode === 'downloaded').length,
  skippedCount: records.filter(({ mode }) => mode === 'skipped-existing').length,
  records,
  failures,
}

await mkdir(path.dirname(REPORT_PATH), { recursive: true })
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log(`\nCompleted: ${records.length}/${assets.length}; failures: ${failures.length}`)
console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`)
if (failures.length) process.exitCode = 2
