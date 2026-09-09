#!/usr/bin/env node

/**
 * Download current released Sprite variant artwork from the canonical artwork manifest.
 *
 * Source of truth:
 *   src/data/sprite-artworks.json
 *
 * Only records with imageMode="entry" and sourceUrl are downloaded.
 * The script never owns a second family/finish/asset mapping.
 */

import { constants as fsConstants } from 'node:fs'
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const ROOT = process.cwd()
const ARTWORK_MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'sprite-artworks.json')
const REPORT_PATH = path.join(ROOT, 'scripts', 'sprite-variant-download-report.json')
const MAX_BYTES = 10 * 1024 * 1024
const MAX_OUTPUT_DIMENSION = 512
const OVERWRITE = process.argv.includes('--overwrite')
const DISCOVER_ONLY = process.argv.includes('--discover-only')

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

const manifest = JSON.parse(await readFile(ARTWORK_MANIFEST_PATH, 'utf8'))
const assets = manifest.filter(
  (record) => record.imageMode === 'entry' && record.sourceUrl && record.assetPage,
)

if (!assets.length) throw new Error('Artwork manifest contains no downloadable variant assets.')
if (new Set(assets.map(({ entryId }) => entryId)).size !== assets.length) {
  throw new Error('Artwork manifest contains duplicate downloadable entry IDs.')
}

async function download(asset) {
  const destination = path.join(ROOT, 'public', asset.localPath)
  const temporary = `${destination}.download`
  await mkdir(path.dirname(destination), { recursive: true })

  if (!OVERWRITE && (await exists(destination))) {
    return {
      entryId: asset.entryId,
      assetId: asset.assetId,
      assetPage: asset.assetPage,
      sourceUrl: asset.sourceUrl,
      mode: 'skipped-existing',
      output: path.relative(ROOT, destination),
    }
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
  } catch (error) {
    await unlink(temporary).catch(() => undefined)
    throw error
  }

  return {
    entryId: asset.entryId,
    assetId: asset.assetId,
    assetPage: asset.assetPage,
    sourceUrl: asset.sourceUrl,
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

for (const asset of assets) {
  if (DISCOVER_ONLY) {
    records.push({
      entryId: asset.entryId,
      assetId: asset.assetId,
      assetPage: asset.assetPage,
      sourceUrl: asset.sourceUrl,
      localPath: asset.localPath,
      mode: 'manifest-only',
    })
    continue
  }

  try {
    const record = await download(asset)
    records.push(record)
    console.log(`✓ ${asset.entryId.padEnd(28)} ${record.output}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push({ entryId: asset.entryId, error: message })
    console.error(`✗ ${asset.entryId}: ${message}`)
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceManifest: path.relative(ROOT, ARTWORK_MANIFEST_PATH),
  targetCount: assets.length,
  downloadedCount: records.filter(({ mode }) => mode === 'downloaded').length,
  skippedCount: records.filter(({ mode }) => mode === 'skipped-existing').length,
  records,
  failures,
}

await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log(`\nCompleted: ${records.length}/${assets.length}; failures: ${failures.length}`)
console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`)
if (failures.length) process.exitCode = 2
