#!/usr/bin/env node

import { constants as fsConstants } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'sprite-artworks.json')

async function exists(file) {
  try {
    await access(file, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

const records = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
const issues = []
const seen = new Set()

for (const record of records) {
  if (!record?.entryId) {
    issues.push('Artwork record is missing entryId.')
    continue
  }
  if (seen.has(record.entryId)) issues.push(`Duplicate artwork record: ${record.entryId}`)
  seen.add(record.entryId)

  if (typeof record.localPath !== 'string' || !record.localPath.startsWith('/')) {
    issues.push(`Artwork must use a root-relative local path: ${record.entryId}`)
  }
  if (/^https?:\/\//i.test(record.localPath ?? '')) {
    issues.push(`Runtime artwork hotlink is not allowed: ${record.entryId}`)
  }

  const filePath = path.join(ROOT, 'public', record.localPath ?? '')
  if (!(await exists(filePath))) {
    issues.push(`Artwork file is missing: ${record.entryId} -> ${record.localPath}`)
  }

  if (!Array.isArray(record.sourceUrls) || record.sourceUrls.length === 0) {
    issues.push(`Artwork source state is missing: ${record.entryId}`)
  }

  if (record.imageMode === 'entry') {
    if (!Number.isInteger(record.assetId) || !record.assetPage || !record.sourceUrl) {
      issues.push(`Independent artwork metadata is incomplete: ${record.entryId}`)
    }
  }

  if (record.displayUseReview !== 'approved') {
    issues.push(`Display use review is not approved: ${record.entryId}`)
  }
  if (record.exportUseReview !== 'approved') {
    issues.push(`Share export use review is not approved: ${record.entryId}`)
  }
}

if (issues.length) {
  console.error(`Artwork release gate failed with ${issues.length} issue(s):`)
  for (const issue of issues) console.error(`- ${issue}`)
  console.error(
    '\nDo not bypass this gate. Complete the human display/share-export review in ' +
      'src/data/sprite-artworks.json.',
  )
  process.exit(1)
}

console.log(`Artwork release gate passed for ${records.length} records.`)
