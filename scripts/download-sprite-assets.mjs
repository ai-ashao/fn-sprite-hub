#!/usr/bin/env node
/**
 * FN Sprite Hub - ShipLean sprite asset downloader
 *
 * Put this file at:
 *   scripts/download-sprite-assets.mjs
 *
 * Run from the ShipLean project root:
 *   node scripts/download-sprite-assets.mjs
 *
 * Output:
 *   public/images/sprites/*.webp
 *
 * Note:
 * These URLs are for prototype/testing use. Review the production asset source
 * and applicable Fortnite/Epic fan-content terms before monetized deployment.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const assets = [
  {
    name: 'Jonesy',
    slug: 'jonesy',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Jonesy_L.webp',
  },
  {
    name: 'Adventure',
    slug: 'adventure',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Dwarf_L.webp',
  },
  {
    name: 'Bush',
    slug: 'bush',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_BushRanger_L.webp',
  },
  {
    name: 'Sonic',
    slug: 'sonic',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_NarrowFlea_Obsidian_L.webp',
  },
  {
    name: 'Tails',
    slug: 'tails',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_NarrowFlea_Monkey_L.webp',
  },
  {
    name: 'Shadow',
    slug: 'shadow',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_NarrowFlea_Scribe_L.webp',
  },
  {
    name: '8-Bit',
    slug: '8-bit',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_EightBitBlaster_L.webp',
  },
  {
    name: 'Jackrabbit',
    slug: 'jackrabbit',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_JazzJackrabbit_L.webp',
  },
  {
    name: 'Crown',
    slug: 'crown',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Crown_L.webp',
  },
  {
    name: 'Killswitch',
    slug: 'killswitch',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Killswitch_L.webp',
  },
  {
    name: 'Klombo',
    slug: 'klombo',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Klombo_L.webp',
  },
  {
    name: 'Mega Man',
    slug: 'mega-man',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_ImprovedSlide_L.webp',
  },
  {
    name: 'Overshield',
    slug: 'overshield',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_Overshield_L.webp',
  },
  {
    name: 'X-Ray',
    slug: 'x-ray',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_WinnerB_L.webp',
  },
  {
    name: 'Onigiri',
    slug: 'onigiri',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_WinnerC_L.webp',
  },
  {
    name: 'Storm Scout',
    slug: 'storm-scout',
    url: 'https://fortnite.gg/img/x/sprites/icons/T_Icon_BR_Creature_Sprite_StormScout_L.webp',
  },
]

const outDir = path.resolve('public/images/sprites')
await fs.mkdir(outDir, { recursive: true })

let ok = 0
let failed = 0

for (const asset of assets) {
  const target = path.join(outDir, `${asset.slug}.webp`)

  try {
    const res = await fetch(asset.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 FN-Sprite-Hub asset build/1.0',
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    })

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`)
    }

    const bytes = Buffer.from(await res.arrayBuffer())
    await fs.writeFile(target, bytes)

    console.log(`✓ ${asset.name} -> ${target} (${Math.round(bytes.length / 1024)} KB)`)
    ok++
  } catch (error) {
    console.error(`✗ ${asset.name}: ${error.message}`)
    failed++
  }
}

console.log(`\nDone. ${ok} downloaded, ${failed} failed.`)
if (failed > 0) process.exitCode = 1
