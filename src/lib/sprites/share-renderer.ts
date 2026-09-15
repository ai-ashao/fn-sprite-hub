import {
  currentReleasedEntries,
  currentSeason,
  familyById,
  finishLabel,
  type SpriteFinishKind,
  type SpriteRarity,
} from '@/data/sprites'
import {
  type CollectionStateV1,
  collectionMetrics,
  type EntryState,
  entryState,
} from './collection'
import type { ShareSelection } from './share-selection'

export const shareCanvasWidth = 1080
export const shareCanvasMinHeight = 720
export const celebrationCanvasHeight = 1920

export const shareFontFamilies = {
  display: 'Inter Variable',
  ui: 'Inter Variable',
  mono: 'DM Mono',
} as const

export const shareTypography = {
  mainTitle: 74,
  summary: 34,
  entryName: 20,
  finishBadge: 14,
  signature: 24,
  pageLabel: 24,
} as const

const finishOrder: readonly SpriteFinishKind[] = ['normal', 'gold', 'cheat-master', 'loot-hacker']

type ShareCard = {
  id: string
  image: string
  title: string
  badge: string
  status?: string
  state?: EntryState
  rarity?: SpriteRarity
  x: number
  y: number
  width: number
  height: number
}

export type ShareLayoutModel = {
  width: number
  height: number
  title: string
  subtitle: string
  summary: string
  pageLabel?: string
  signature: string
  cards: ShareCard[]
  celebration: 'collection' | 'mastered' | null
  completionPercent: number
  collectionPercent: number
  masteryPercent: number
  owned: number
  mastered: number
  total: number
}

export type ContainRect = {
  x: number
  y: number
  width: number
  height: number
}

export function containRect(
  sourceWidth: number,
  sourceHeight: number,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number,
): ContainRect {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    throw new Error('Image containment requires positive source and target dimensions.')
  }

  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale

  return {
    x: targetX + (targetWidth - width) / 2,
    y: targetY + (targetHeight - height) / 2,
    width,
    height,
  }
}

export function buildShareLayoutModel(
  selection: ShareSelection,
  collection: CollectionStateV1,
): ShareLayoutModel {
  const metrics = collectionMetrics(collection)
  const celebration =
    selection.template === 'celebration'
      ? metrics.mastered === metrics.total
        ? 'mastered'
        : 'collection'
      : null

  const entries = currentReleasedEntries()
    .filter(({ id }) => selection.entryIds.includes(id))
    .sort((left, right) => {
      const finishDifference = finishOrder.indexOf(left.finish) - finishOrder.indexOf(right.finish)
      if (finishDifference) return finishDifference
      return (familyById(left.familyId)?.name ?? left.displayName).localeCompare(
        familyById(right.familyId)?.name ?? right.displayName,
      )
    })

  const columns = 5
  const columnGap = 14
  const rowGap = 16
  const areaX = 54
  const areaWidth = shareCanvasWidth - areaX * 2
  const cardWidth = (areaWidth - columnGap * (columns - 1)) / columns
  const cardHeight = 250
  const startY = 350
  const rows = Math.ceil(entries.length / columns)
  const contentBottom = rows ? startY + rows * cardHeight + (rows - 1) * rowGap : startY
  const canvasHeight = celebration
    ? celebrationCanvasHeight
    : Math.max(shareCanvasMinHeight, Math.ceil((contentBottom + 112) / 8) * 8)

  const sourceCards = celebration
    ? selection.familyIds.map((id) => {
        const family = familyById(id)
        return {
          id,
          image: family?.familyImage ?? '',
          title: family?.name ?? id,
          badge: family?.rarity ?? '',
          rarity: family?.rarity,
        }
      })
    : entries.map((entry) => {
        const family = familyById(entry.familyId)
        const state = entryState(collection, entry.id)
        return {
          id: entry.id,
          image: entry.image,
          title: entry.displayName,
          badge: finishLabel(entry.finish),
          status: state === 'mastered' ? 'Mastered' : state === 'owned' ? 'Owned' : 'Missing',
          state,
          rarity: family?.rarity,
        }
      })

  const cards = sourceCards.map((card, index) => ({
    ...card,
    x: areaX + (index % columns) * (cardWidth + columnGap),
    y: startY + Math.floor(index / columns) * (cardHeight + rowGap),
    width: cardWidth,
    height: cardHeight,
  }))

  const title =
    selection.template === 'collection'
      ? 'My Collection'
      : selection.template === 'missing'
        ? 'Missing Sprites'
        : selection.template === 'unmastered'
          ? 'Unmastered Sprites'
          : selection.template === 'mastered'
            ? 'Mastered Sprites'
            : celebration === 'mastered'
              ? 'Mastery Complete'
              : 'Collection Complete'

  const count = selection.entryIds.length

  return {
    width: shareCanvasWidth,
    height: canvasHeight,
    title,
    subtitle: `Chapter ${currentSeason.chapter} · Season ${currentSeason.season} ${currentSeason.name}`,
    summary:
      selection.template === 'collection'
        ? `${metrics.owned}/${metrics.total} collected · ${metrics.mastered} mastered`
        : selection.template === 'celebration'
          ? `${metrics.total}/${metrics.total} · 100%`
          : `${count} ${selection.template === 'missing' ? 'missing' : selection.template === 'mastered' ? 'mastered' : 'unmastered'} · ${metrics.owned}/${metrics.total} collected`,
    pageLabel: selection.pageCount > 1 ? `${selection.page}/${selection.pageCount}` : undefined,
    signature: '✦ Track yours at FN Sprite Hub · fnspritehub.com',
    cards,
    celebration,
    completionPercent:
      celebration === 'mastered' ? metrics.masteryPercent : metrics.collectionPercent,
    collectionPercent: metrics.collectionPercent,
    masteryPercent: metrics.masteryPercent,
    owned: metrics.owned,
    mastered: metrics.mastered,
    total: metrics.total,
  }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

function font(weight: number, size: number, family: keyof typeof shareFontFamilies = 'ui'): string {
  return `${weight} ${size}px "${shareFontFamilies[family]}"`
}

export async function ensureShareFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) {
    throw new Error('The browser Font Loading API is required for deterministic share images.')
  }

  await Promise.all([
    document.fonts.load(font(800, shareTypography.mainTitle, 'display')),
    document.fonts.load(font(700, shareTypography.entryName, 'ui')),
    document.fonts.load(font(500, shareTypography.finishBadge, 'mono')),
  ])
  await document.fonts.ready

  const required = [
    font(800, shareTypography.mainTitle, 'display'),
    font(700, shareTypography.entryName, 'ui'),
    font(500, shareTypography.finishBadge, 'mono'),
  ]
  if (!required.every((descriptor) => document.fonts.check(descriptor))) {
    throw new Error('FN Sprite Hub share fonts did not load. Please retry before exporting.')
  }
}

function ensureSameOriginArtwork(src: string): void {
  if (typeof window === 'undefined') return
  const url = new URL(src, window.location.origin)
  if (url.origin !== window.location.origin) {
    throw new Error(`Share artwork must be a same-origin local asset: ${src}`)
  }
}

const decodedImageCache = new Map<string, Promise<HTMLImageElement>>()

async function loadImage(src: string): Promise<HTMLImageElement> {
  ensureSameOriginArtwork(src)

  const cachedImage = decodedImageCache.get(src)
  if (cachedImage) return cachedImage

  const decodedImage = (async () => {
    const image = new Image()
    image.decoding = 'async'
    image.src = src

    try {
      await image.decode()
    } catch {
      throw new Error(`Could not load share artwork: ${src}`)
    }

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error(`Share artwork has invalid dimensions: ${src}`)
    }

    return image
  })()

  decodedImageCache.set(src, decodedImage)

  try {
    return await decodedImage
  } catch (error) {
    decodedImageCache.delete(src)
    throw error
  }
}

export function drawImageContain(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const rect = containRect(image.naturalWidth, image.naturalHeight, x, y, width, height)
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height)
}

const stateStyle: Record<EntryState, { fill: string; ink: string; symbol: string }> = {
  missing: { fill: '#efede7', ink: '#746f66', symbol: '○' },
  owned: { fill: '#e1efdd', ink: '#486943', symbol: '✓' },
  mastered: { fill: '#f4e9b9', ink: '#705c16', symbol: '★' },
}

const rarityStyle: Record<SpriteRarity, { accent: string; tint: string }> = {
  Rare: { accent: '#3f8eb5', tint: '#edf6fa' },
  Epic: { accent: '#8b6bb5', tint: '#f3eef8' },
  Legendary: { accent: '#b68132', tint: '#faf3e5' },
  Mythic: { accent: '#9a5c75', tint: '#f8edf1' },
}

function fittedFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  preferred: number,
  minimum: number,
): number {
  for (let size = preferred; size > minimum; size -= 1) {
    context.font = font(800, size)
    if (context.measureText(text).width <= maxWidth) return size
  }
  return minimum
}

function drawProgress(
  context: CanvasRenderingContext2D,
  label: string,
  value: number,
  total: number,
  percent: number,
  x: number,
  accent: string,
) {
  const width = 452
  context.fillStyle = '#59584f'
  context.font = font(700, 19, 'mono')
  context.fillText(`${label}: ${value}/${total}`, x, 280)
  context.fillStyle = '#d9ddd4'
  roundedRect(context, x, 294, width, 16, 8)
  context.fill()
  if (percent > 0) {
    context.fillStyle = accent
    roundedRect(context, x, 294, width * (percent / 100), 16, 8)
    context.fill()
  }
}

export async function renderSharePng(
  selection: ShareSelection,
  collection: CollectionStateV1,
): Promise<Blob> {
  await ensureShareFontsReady()

  const model = buildShareLayoutModel(selection, collection)
  const canvas = document.createElement('canvas')
  canvas.width = model.width
  canvas.height = model.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas rendering is not supported in this browser.')

  const background = context.createLinearGradient(0, 0, model.width, model.height)
  background.addColorStop(0, '#fbfaf4')
  background.addColorStop(0.55, '#eef3e9')
  background.addColorStop(1, '#e8f0f3')
  context.fillStyle = background
  context.fillRect(0, 0, model.width, model.height)

  context.fillStyle = 'rgba(126,155,106,.12)'
  context.beginPath()
  context.arc(92, 90, 250, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = 'rgba(156,138,197,.11)'
  context.beginPath()
  context.arc(1010, model.height * 0.68, 310, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#5f6d58'
  context.font = font(500, 20, 'mono')
  context.fillText(`FN SPRITE HUB · ${currentSeason.patch}`, 54, 62)

  context.fillStyle = '#25251f'
  const titleSize = fittedFontSize(context, model.title, 972, shareTypography.mainTitle, 50)
  context.font = font(800, titleSize, 'display')
  context.fillText(model.title, 54, 142)

  context.fillStyle = '#706f67'
  context.font = font(500, 24)
  context.fillText(model.subtitle, 54, 188)

  context.fillStyle = '#4f6d48'
  context.font = font(800, 30)
  context.fillText(model.summary, 54, 232)

  drawProgress(
    context,
    'COLLECTION',
    model.owned,
    model.total,
    model.collectionPercent,
    54,
    '#6d8d63',
  )
  drawProgress(
    context,
    'MASTERY',
    model.mastered,
    model.total,
    model.masteryPercent,
    574,
    '#b39334',
  )

  if (model.celebration) {
    context.textAlign = 'center'
    context.fillStyle = '#25251f'
    context.font = font(800, 200, 'display')
    context.fillText(`${model.completionPercent}%`, 540, 720)

    context.fillStyle = '#5f6d58'
    context.font = font(800, 38)
    context.fillText(
      model.celebration === 'mastered' ? 'MASTERED' : 'COLLECTION COMPLETE',
      540,
      790,
    )

    context.fillStyle = '#706f67'
    context.font = font(700, 30)
    context.fillText(model.summary, 540, 838)
    context.textAlign = 'left'
  }

  const images = await Promise.all(model.cards.map((card) => loadImage(card.image)))

  for (const [index, card] of model.cards.entries()) {
    const image = images[index]

    if (model.celebration) {
      const x = 70 + index * 190
      const y = 960
      const width = 172
      const height = 270

      context.fillStyle = 'rgba(255,253,248,.9)'
      roundedRect(context, x, y, width, height, 26)
      context.fill()

      drawImageContain(context, image, x + 16, y + 12, width - 32, 192)

      context.fillStyle = '#25251f'
      context.font = font(800, 24)
      context.textAlign = 'center'
      context.fillText(card.title, x + width / 2, y + 244)
      context.textAlign = 'left'
      continue
    }

    const rarity = card.rarity ? rarityStyle[card.rarity] : undefined
    context.fillStyle = rarity?.tint ?? 'rgba(255,253,248,.94)'
    roundedRect(context, card.x, card.y, card.width, card.height, 24)
    context.fill()
    context.strokeStyle = rarity?.accent ?? '#d7d1c5'
    context.lineWidth = 2
    context.stroke()

    context.fillStyle = rarity?.accent ?? '#7b776e'
    roundedRect(context, card.x, card.y, card.width, 7, 4)
    context.fill()

    const textLeft = card.x + 13
    context.fillStyle = '#68655d'
    context.font = font(600, shareTypography.finishBadge, 'mono')
    context.fillText(card.badge.toUpperCase(), textLeft, card.y + 30)

    if (card.state && card.status) {
      const style = stateStyle[card.state]
      context.font = font(700, 12, 'mono')
      const statusText = `${style.symbol} ${card.status}`
      const statusWidth = context.measureText(statusText).width + 18
      const statusX = card.x + card.width - statusWidth - 10
      context.fillStyle = style.fill
      roundedRect(context, statusX, card.y + 44, statusWidth, 25, 10)
      context.fill()
      context.fillStyle = style.ink
      context.fillText(statusText, statusX + 9, card.y + 61)
    }

    context.save()
    if (card.state === 'missing') context.globalAlpha = 0.44
    drawImageContain(context, image, card.x + 16, card.y + 42, card.width - 32, 132)
    context.restore()

    if (card.rarity) {
      context.fillStyle = rarity?.accent ?? '#706f67'
      context.font = font(700, 13, 'mono')
      context.fillText(card.rarity.toUpperCase(), textLeft, card.y + 198)
    }

    context.fillStyle = '#25251f'
    const entryFontSize = fittedFontSize(
      context,
      card.title,
      card.width - 26,
      shareTypography.entryName,
      13,
    )
    context.font = font(800, entryFontSize)
    context.fillText(card.title, textLeft, card.y + 231)
  }

  context.fillStyle = '#5e5a51'
  context.font = font(500, shareTypography.signature, 'mono')
  context.fillText(model.signature, 54, model.height - 58)

  context.textAlign = 'right'
  context.fillStyle = '#858177'
  context.font = font(500, 18, 'mono')
  context.fillText('Made locally in your browser', 1026, model.height - 24)
  context.textAlign = 'left'

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed.'))),
      'image/png',
    )
  })
}

export function shareFileName(selection: ShareSelection) {
  return `fn-sprite-hub-${selection.template}.png`
}
