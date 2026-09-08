import {
  currentReleasedEntries,
  currentSeason,
  familyById,
  finishLabel,
  type SpriteFinishKind,
} from '@/data/sprites'
import {
  type CollectionStateV1,
  collectionMetrics,
  type EntryState,
  entryState,
} from './collection'
import type { ShareSelection } from './share-selection'

export const shareCanvasSize = { width: 1080, height: 1350 } as const

export const shareFontFamilies = {
  display: 'Inter Variable',
  ui: 'Inter Variable',
  mono: 'DM Mono',
} as const

export const shareTypography = {
  mainTitle: 74,
  summary: 34,
  entryName: 28,
  finishBadge: 24,
  signature: 24,
  pageLabel: 24,
} as const

const finishOrder: readonly SpriteFinishKind[] = ['normal', 'gold', 'cheat-master', 'loot-hacker']

const finishShortLabel: Record<SpriteFinishKind, string> = {
  normal: 'B',
  gold: 'G',
  'cheat-master': 'CM',
  'loot-hacker': 'LH',
}

type ShareMarkerState = EntryState | 'na'

type ShareMarker = {
  label: string
  state: ShareMarkerState
}

type ShareCard = {
  id: string
  image: string
  title: string
  badge: string
  status?: string
  markers?: ShareMarker[]
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
  const entries = currentReleasedEntries().filter(({ id }) => selection.entryIds.includes(id))
  const isEntries = selection.template === 'missing' || selection.template === 'unmastered'
  const denseEntries = isEntries && entries.length > 12
  const columns = isEntries ? (entries.length <= 6 ? 2 : entries.length <= 12 ? 3 : 4) : 4
  const gap = denseEntries ? 14 : 20
  const areaX = 70
  const areaWidth = 940
  const cardWidth = (areaWidth - gap * (columns - 1)) / columns
  const cardHeight = isEntries
    ? entries.length <= 6
      ? 250
      : entries.length <= 12
        ? 205
        : 138
    : 198
  const startY = denseEntries ? 320 : isEntries ? 330 : 334

  const sourceCards = isEntries
    ? entries.map((entry) => ({
        id: entry.id,
        image: entry.image,
        title: familyById(entry.familyId)?.name ?? entry.displayName,
        badge: finishLabel(entry.finish),
      }))
    : selection.familyIds.map((id) => {
        const family = familyById(id)
        const familyEntries = currentReleasedEntries().filter((entry) => entry.familyId === id)
        const mastered = familyEntries.filter(
          (entry) => entryState(collection, entry.id) === 'mastered',
        ).length
        const owned = familyEntries.filter(
          (entry) => entryState(collection, entry.id) !== 'missing',
        ).length
        const markers = finishOrder.map((finish): ShareMarker => {
          const entry = familyEntries.find((candidate) => candidate.finish === finish)
          return {
            label: finishShortLabel[finish],
            state: entry ? entryState(collection, entry.id) : 'na',
          }
        })

        return {
          id,
          image: family?.familyImage ?? '',
          title: family?.name ?? id,
          badge: `${owned}/${familyEntries.length} owned`,
          status: `${mastered} mastered`,
          markers,
        }
      })

  const cards = sourceCards.map((card, index) => ({
    ...card,
    x: areaX + (index % columns) * (cardWidth + gap),
    y: startY + Math.floor(index / columns) * (cardHeight + gap),
    width: cardWidth,
    height: cardHeight,
  }))

  const celebration =
    selection.template === 'celebration'
      ? metrics.mastered === metrics.total
        ? 'mastered'
        : 'collection'
      : null

  const title =
    selection.template === 'collection'
      ? 'My Collection'
      : selection.template === 'missing'
        ? 'Missing Sprites'
        : selection.template === 'unmastered'
          ? 'Need to Master'
          : celebration === 'mastered'
            ? 'Mastery Complete'
            : 'Collection Complete'

  const count =
    selection.template === 'missing' ? metrics.missing : metrics.owned - metrics.mastered

  return {
    ...shareCanvasSize,
    title,
    subtitle: `Chapter ${currentSeason.chapter} · Season ${currentSeason.season} ${currentSeason.name}`,
    summary:
      selection.template === 'collection'
        ? `${metrics.owned}/${metrics.total} owned · ${metrics.mastered}/${metrics.total} mastered`
        : selection.template === 'celebration'
          ? `${metrics.total}/${metrics.total} · 100%`
          : `${count} ${selection.template === 'missing' ? 'missing' : 'to master'} · ${metrics.owned}/${metrics.total} collected`,
    pageLabel: selection.pageCount > 1 ? `${selection.page}/${selection.pageCount}` : undefined,
    signature: '✦ Track yours at FN Sprite Hub · fnspritehub.com',
    cards,
    celebration,
    completionPercent:
      celebration === 'mastered' ? metrics.masteryPercent : metrics.collectionPercent,
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

function drawCollectionMarkers(
  context: CanvasRenderingContext2D,
  card: ShareCard,
  x: number,
  y: number,
  width: number,
) {
  if (!card.markers?.length) return

  const markerGap = 5
  const markerWidth = (width - markerGap * 3) / 4
  const markerHeight = 27

  card.markers.forEach((marker, index) => {
    const markerX = x + index * (markerWidth + markerGap)
    const stateStyle: Record<ShareMarkerState, { fill: string; ink: string; symbol: string }> = {
      missing: { fill: '#f2eee6', ink: '#847d72', symbol: '○' },
      owned: { fill: '#e9f2e4', ink: '#55734d', symbol: '✓' },
      mastered: { fill: '#eee9f8', ink: '#66568d', symbol: '★' },
      na: { fill: '#efede7', ink: '#aaa398', symbol: '—' },
    }
    const style = stateStyle[marker.state]

    context.fillStyle = style.fill
    roundedRect(context, markerX, y, markerWidth, markerHeight, 10)
    context.fill()

    context.fillStyle = style.ink
    context.font = font(500, 15, 'mono')
    context.textAlign = 'center'
    context.fillText(`${marker.label}${style.symbol}`, markerX + markerWidth / 2, y + 19)
  })

  context.textAlign = 'left'
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
  context.arc(1010, 1190, 310, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#5f6d58'
  context.font = font(500, 24, 'mono')
  context.fillText(`${currentSeason.patch} · CURRENT SEASON`, 70, 78)

  context.fillStyle = '#25251f'
  context.font = font(800, shareTypography.mainTitle, 'display')
  context.fillText(model.title, 70, 170)

  context.fillStyle = '#706f67'
  context.font = font(500, 28)
  context.fillText(model.subtitle, 70, 218)

  context.fillStyle = '#4f6d48'
  context.font = font(800, shareTypography.summary)
  context.fillText(model.summary, 70, 278)

  if (model.pageLabel) {
    context.textAlign = 'right'
    context.font = font(500, shareTypography.pageLabel, 'mono')
    context.fillText(model.pageLabel, 1010, 278)
    context.textAlign = 'left'
  }

  if (model.celebration) {
    context.textAlign = 'center'
    context.fillStyle = '#25251f'
    context.font = font(800, 200, 'display')
    context.fillText(`${model.completionPercent}%`, 540, 610)

    context.fillStyle = '#5f6d58'
    context.font = font(800, 38)
    context.fillText(
      model.celebration === 'mastered' ? 'MASTERED' : 'COLLECTION COMPLETE',
      540,
      680,
    )

    context.fillStyle = '#706f67'
    context.font = font(700, 30)
    context.fillText(model.summary, 540, 728)
    context.textAlign = 'left'
  }

  const images = await Promise.all(model.cards.map((card) => loadImage(card.image)))

  for (const [index, card] of model.cards.entries()) {
    const image = images[index]

    if (model.celebration) {
      const x = 70 + index * 190
      const y = 790
      const width = 172
      const height = 236

      context.fillStyle = 'rgba(255,253,248,.9)'
      roundedRect(context, x, y, width, height, 26)
      context.fill()

      drawImageContain(context, image, x + 16, y + 12, width - 32, 166)

      context.fillStyle = '#25251f'
      context.font = font(800, 24)
      context.textAlign = 'center'
      context.fillText(card.title, x + width / 2, y + 215)
      context.textAlign = 'left'
      continue
    }

    context.fillStyle = 'rgba(255,253,248,.9)'
    roundedRect(context, card.x, card.y, card.width, card.height, 24)
    context.fill()

    const isCollection = Boolean(card.markers)
    const textLeft = card.x + 14

    if (isCollection) {
      drawImageContain(context, image, card.x + 18, card.y + 8, card.width - 36, 92)

      context.fillStyle = '#25251f'
      context.font = font(800, shareTypography.entryName)
      context.fillText(card.title, textLeft, card.y + 127)

      drawCollectionMarkers(context, card, textLeft, card.y + 137, card.width - 28)

      context.fillStyle = '#5d5a52'
      context.font = font(700, 18)
      const statusText = card.status ? `${card.badge} · ${card.status}` : card.badge
      context.fillText(statusText, textLeft, card.y + card.height - 12)
      continue
    }

    const imageBottomReserve = 72
    drawImageContain(
      context,
      image,
      card.x + 14,
      card.y + 8,
      card.width - 28,
      Math.max(48, card.height - imageBottomReserve),
    )

    context.fillStyle = '#25251f'
    context.font = font(800, shareTypography.entryName)
    context.fillText(card.title, textLeft, card.y + card.height - 39)

    context.fillStyle = '#706f67'
    context.font = font(500, shareTypography.finishBadge, 'mono')
    context.fillText(card.badge, textLeft, card.y + card.height - 10)
  }

  context.fillStyle = '#5e5a51'
  context.font = font(500, shareTypography.signature, 'mono')
  context.fillText(model.signature, 70, 1306)

  context.textAlign = 'right'
  context.fillStyle = '#858177'
  context.font = font(500, 18, 'mono')
  context.fillText('Made locally in your browser', 1010, 1332)
  context.textAlign = 'left'

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed.'))),
      'image/png',
    )
  })
}

export function shareFileName(selection: ShareSelection) {
  const page = selection.pageCount > 1 ? `-${selection.page}-of-${selection.pageCount}` : ''
  return `fn-sprite-hub-${selection.template}${page}.png`
}
