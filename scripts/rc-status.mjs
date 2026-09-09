#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()

const artwork = JSON.parse(
  await readFile(path.join(ROOT, 'src', 'data', 'sprite-artworks.json'), 'utf8'),
)
const disclaimer = (
  await readFile(path.join(ROOT, 'src', 'data', 'epic-fan-content-disclaimer.txt'), 'utf8')
).trim()
const displayPending = artwork.filter(({ displayUseReview }) => displayUseReview !== 'approved')
const exportPending = artwork.filter(({ exportUseReview }) => exportUseReview !== 'approved')
const disclaimerReady =
  disclaimer.length >= 100 && !disclaimer.startsWith('PASTE THE EXACT CURRENT DISCLAIMER')

const rows = [
  [
    'Artwork display review',
    displayPending.length === 0,
    `${artwork.length - displayPending.length}/${artwork.length}`,
  ],
  [
    'Artwork share-export review',
    exportPending.length === 0,
    `${artwork.length - exportPending.length}/${artwork.length}`,
  ],
  ['Epic Fan Content disclaimer', disclaimerReady, disclaimerReady ? 'configured' : 'missing'],
]

console.log('FN Sprite Hub — RC status')
console.log('')
for (const [label, ok, detail] of rows) {
  console.log(`${ok ? 'PASS' : 'BLOCK'}  ${label}: ${detail}`)
}

const blockers = rows.filter(([, ok]) => !ok)
console.log('')
console.log(
  blockers.length ? `${blockers.length} RC blocker(s) remain.` : 'No static RC blockers remain.',
)
