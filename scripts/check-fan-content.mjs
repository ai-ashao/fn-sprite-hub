#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const file = path.join(ROOT, 'src', 'data', 'epic-fan-content-disclaimer.txt')
const text = (await readFile(file, 'utf8')).trim()
const expectedDisclaimer =
  'Portions of the materials used are trademarks and/or copyrighted works of Epic Games, Inc. All rights reserved by Epic. This material is not official and is not endorsed by Epic.'

const issues = []
const placeholderPrefix = 'PASTE THE EXACT CURRENT DISCLAIMER'

if (text.startsWith(placeholderPrefix)) {
  issues.push('Epic Fan Content disclaimer is still the repository placeholder.')
}
if (text.length < 100) {
  issues.push('Epic Fan Content disclaimer is unexpectedly short.')
}
if (text !== expectedDisclaimer) {
  issues.push('Epic Fan Content disclaimer does not match the reviewed Section 1.10 wording.')
}

for (const phrase of [
  'Epic Games, Inc.',
  'trademarks',
  'copyrighted',
  'rights reserved',
  'not official',
  'not endorsed by Epic',
]) {
  if (!text.toLowerCase().includes(phrase.toLowerCase())) {
    issues.push(`Epic Fan Content disclaimer is missing expected wording: ${phrase}`)
  }
}

if (issues.length) {
  console.error(`Fan Content release gate failed with ${issues.length} issue(s):`)
  for (const issue of issues) console.error(`- ${issue}`)
  console.error(
    '\nOpen the current Epic Fan Content Policy and paste the exact Section 1.10 disclaimer into ' +
      'src/data/epic-fan-content-disclaimer.txt.',
  )
  process.exit(1)
}

console.log('Epic Fan Content disclaimer release gate passed.')
