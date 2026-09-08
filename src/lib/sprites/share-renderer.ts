import { currentReleasedEntries, currentSeason, familyById, finishLabel } from '@/data/sprites'
import { type CollectionStateV1, collectionMetrics, entryState } from './collection'
import type { ShareSelection } from './share-selection'

export const shareCanvasSize = { width: 1080, height: 1350 } as const

type ShareCard = {
  id: string
  image: string
  title: string
  badge: string
  status?: string
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

export function buildShareLayoutModel(
  selection: ShareSelection,
  collection: CollectionStateV1,
): ShareLayoutModel {
  const metrics = collectionMetrics(collection)
  const entries = currentReleasedEntries().filter(({ id }) => selection.entryIds.includes(id))
  const isEntries = selection.template === 'missing' || selection.template === 'unmastered'
  const columns = isEntries ? (entries.length <= 6 ? 2 : entries.length <= 12 ? 3 : 4) : 4
  const gap = 20
  const areaX = 70
  const areaWidth = 940
  const cardWidth = (areaWidth - gap * (columns - 1)) / columns
  const cardHeight = isEntries
    ? entries.length <= 6
      ? 240
      : entries.length <= 12
        ? 205
        : 132
    : 196
  const startY = isEntries ? 330 : 350
  const sourceCards = isEntries
    ? entries.map((entry) => ({
        id: entry.id,
        image: entry.image,
        title: familyById(entry.familyId)?.name ?? entry.displayName,
        badge: finishLabel(entry.finish),
      }))
    : selection.familyIds.map((id) => {
        const family = familyById(id)
        const states = currentReleasedEntries().filter((entry) => entry.familyId === id)
        const mastered = states.filter(
          (entry) => entryState(collection, entry.id) === 'mastered',
        ).length
        const owned = states.filter(
          (entry) => entryState(collection, entry.id) !== 'missing',
        ).length
        return {
          id,
          image: family?.familyImage ?? '',
          title: family?.name ?? id,
          badge: `${owned}/${states.length} owned`,
          status: `${mastered} mastered`,
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
          ? `${celebration === 'mastered' ? metrics.masteryPercent : metrics.collectionPercent}%`
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

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load share artwork: ${src}`))
    image.src = src
  })
}

export async function renderSharePng(
  selection: ShareSelection,
  collection: CollectionStateV1,
): Promise<Blob> {
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
  context.font = '800 24px system-ui, sans-serif'
  context.fillText(`${currentSeason.patch} · CURRENT SEASON`, 70, 78)
  context.fillStyle = '#25251f'
  context.font = '700 74px Georgia, serif'
  context.fillText(model.title, 70, 170)
  context.fillStyle = '#706f67'
  context.font = '500 28px system-ui, sans-serif'
  context.fillText(model.subtitle, 70, 218)
  context.fillStyle = '#4f6d48'
  context.font = '800 34px system-ui, sans-serif'
  context.fillText(model.summary, 70, 278)
  if (model.pageLabel) {
    context.textAlign = 'right'
    context.fillText(model.pageLabel, 1010, 278)
    context.textAlign = 'left'
  }

  if (model.celebration) {
    context.textAlign = 'center'
    context.fillStyle = '#25251f'
    context.font = '700 210px Georgia, serif'
    context.fillText(`${model.completionPercent}%`, 540, 650)
    context.fillStyle = '#7e9b6a'
    context.font = '900 34px system-ui, sans-serif'
    context.fillText(
      model.celebration === 'mastered' ? 'MASTERED' : 'COLLECTION COMPLETE',
      540,
      715,
    )
    context.textAlign = 'left'
  }

  const images = await Promise.all(model.cards.map((card) => loadImage(card.image)))
  for (const [index, card] of model.cards.entries()) {
    const image = images[index]
    const y = model.celebration ? 790 : card.y
    const height = model.celebration ? 230 : card.height
    const width = model.celebration ? 172 : card.width
    const x = model.celebration ? 70 + index * 190 : card.x
    context.fillStyle = 'rgba(255,253,248,.88)'
    roundedRect(context, x, y, width, height, 26)
    context.fill()
    const imageHeight = model.celebration ? 160 : Math.min(height - 62, 140)
    context.drawImage(image, x + 18, y + 10, width - 36, imageHeight)
    context.fillStyle = '#25251f'
    context.font = `800 ${model.celebration ? 20 : 22}px system-ui, sans-serif`
    context.fillText(card.title, x + 16, y + height - 36, width - 32)
    if (!model.celebration) {
      context.fillStyle = '#706f67'
      context.font = '700 16px system-ui, sans-serif'
      context.fillText(card.badge, x + 16, y + height - 12, width - 32)
    }
  }

  context.fillStyle = '#5e5a51'
  context.font = '700 22px system-ui, sans-serif'
  context.fillText(model.signature, 70, 1295)
  context.textAlign = 'right'
  context.fillStyle = '#858177'
  context.font = '700 18px system-ui, sans-serif'
  context.fillText('Made locally in your browser', 1010, 1295)

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
