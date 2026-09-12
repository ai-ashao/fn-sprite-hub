// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionNotice } from '@/components/sprites/collection-notice'
import { SpriteDetailPage } from '@/components/sprites/sprite-detail-page'
import { guidanceCheckedAt, guidanceSources, spriteGuidance } from '@/data/sprite-guidance'
import {
  currentReleasedEntryCount,
  currentSeason,
  entriesForFamily,
  spriteFamilies,
} from '@/data/sprites'
import type { useSpriteCollection } from '@/lib/sprites/collection'

type CollectionView = ReturnType<typeof useSpriteCollection>
const fixture = vi.hoisted(() => ({
  current: null as CollectionView | null,
  download: vi.fn(),
  undo: vi.fn(async () => ({ ok: true })),
}))

vi.mock('@/lib/sprites/collection', () => ({
  useSpriteCollection: () => {
    if (!fixture.current) throw new Error('Missing collection fixture')
    return fixture.current
  },
  serializeCollectionBackup: (value: unknown) => `${JSON.stringify(value)}\n`,
}))
vi.mock('@/lib/sprites/download', () => ({ requestTextDownload: fixture.download }))

function collectionView(overrides: Partial<CollectionView> = {}): CollectionView {
  const collection = {
    schemaVersion: 1 as const,
    seasonId: currentSeason.id,
    ownedEntryIds: [],
    masteredEntryIds: [],
    updatedAt: '2026-09-12T00:00:00.000Z',
  }
  return {
    collection,
    mounted: true,
    loadKind: 'valid',
    raw: null,
    previousRaw: null,
    previousUnsavedRaw: null,
    dirty: false,
    message: 'Saved in this browser.',
    level: 'info',
    undo: null,
    metrics: {
      total: currentReleasedEntryCount,
      owned: 0,
      mastered: 0,
      missing: currentReleasedEntryCount,
      collectionPercent: 0,
      masteryPercent: 0,
    },
    cycleEntry: vi.fn(),
    confirmation: () => ({ raw: null, memory: JSON.stringify(collection) }),
    restore: vi.fn(async () => ({ ok: true })),
    reset: vi.fn(async () => ({ ok: true })),
    undoLast: fixture.undo,
    getEntryState: () => 'missing',
    ...overrides,
  }
}

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  fixture.current = collectionView()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})
async function renderNotice(overrides: Partial<CollectionView> = {}) {
  fixture.current = collectionView(overrides)
  await act(async () => root.render(createElement(CollectionNotice)))
  const notice = host.querySelector<HTMLElement>('[data-collection-save-notice]')
  if (!notice) throw new Error('Collection notice did not render')
  return notice
}
function button(label: string) {
  const found = [...host.querySelectorAll('button')].find((item) => item.textContent === label)
  if (!found) throw new Error(`Missing button: ${label}`)
  return found
}
function countText(text: string) {
  const visible = (host.textContent ?? '').replace(/\s+/g, ' ')
  return visible.split(text.replace(/\s+/g, ' ')).length - 1
}

describe('Compact collection notice', () => {
  it('renders a compact saved status without an empty actions container', async () => {
    const notice = await renderNotice()
    expect(notice.dataset.savePresentation).toBe('compact')
    expect(notice.dataset.saveLevel).toBe('info')
    expect(notice.querySelector('.sprite-safety-actions')).toBeNull()
    expect(notice.querySelector('output')?.getAttribute('aria-live')).toBe('polite')
    expect(notice.textContent).toContain('Saved in this browser.')
  })
  it('keeps loading compact and never exposes actions before mount', async () => {
    const notice = await renderNotice({ mounted: false, level: 'warning', dirty: true })
    expect(notice.dataset.savePresentation).toBe('compact')
    expect(notice.dataset.saveLevel).toBeUndefined()
    expect(notice.textContent).toContain('Loading this browser’s collection…')
    expect(notice.querySelector('button')).toBeNull()
  })
  it('retains an actionable Undo beside the compact status', async () => {
    const notice = await renderNotice({
      undo: { id: 'crown:normal', before: 'missing', afterVersion: 'test:1' },
    })
    expect(notice.dataset.savePresentation).toBe('compact')
    await act(async () => button('Undo last change').click())
    expect(fixture.undo).toHaveBeenCalledOnce()
  })
  it.each(['warning', 'error'] as const)('expands %s and retains session export', async (level) => {
    const notice = await renderNotice({ level, message: 'Export a backup before leaving.' })
    expect(notice.dataset.savePresentation).toBe('expanded')
    await act(async () => button('Export this tab’s collection').click())
    expect(fixture.download).toHaveBeenCalledWith(
      `${JSON.stringify(fixture.current?.collection)}\n`,
      `fn-sprite-hub-${currentSeason.id}-session.json`,
    )
  })
  it('never collapses dirty work just because the message level is info', async () => {
    const notice = await renderNotice({ dirty: true })
    expect(notice.dataset.savePresentation).toBe('expanded')
    expect(button('Export this tab’s collection')).toBeDefined()
  })
  it('retains the exact preserved original and both protected snapshots', async () => {
    const raw = '{broken original'
    const notice = await renderNotice({
      level: 'warning',
      loadKind: 'damaged',
      raw,
      previousRaw: '{"previous":true}',
      previousUnsavedRaw: '{"unsaved":true}',
    })
    expect(notice.dataset.savePresentation).toBe('expanded')
    await act(async () => button('Export preserved original').click())
    expect(fixture.download).toHaveBeenLastCalledWith(
      raw,
      'fn-sprite-hub-preserved-original.txt',
      'text/plain',
    )
    await act(async () => button('Download previous snapshot').click())
    expect(fixture.download).toHaveBeenLastCalledWith(
      '{"previous":true}',
      'fn-sprite-hub-previous-snapshot.json',
    )
    await act(async () => button('Download protected unsaved work').click())
    expect(fixture.download).toHaveBeenLastCalledWith(
      '{"unsaved":true}',
      'fn-sprite-hub-unsaved-before-replace.json',
    )
  })
  it('does not hide recovery downloads after a successful replacement', async () => {
    const notice = await renderNotice({ previousRaw: '{"previous":true}' })
    expect(notice.dataset.savePresentation).toBe('compact')
    expect(button('Download previous snapshot')).toBeDefined()
  })
})

describe('Single-owner Sprite detail sections', () => {
  it.each(['crown', 'klombo'])(
    'deduplicates %s without removing facts or source links',
    async (id) => {
      const family = spriteFamilies.find((item) => item.id === id)
      const guidance = spriteGuidance[id]
      if (!family || !guidance) throw new Error(`Missing reviewed family: ${id}`)
      await act(async () => root.render(createElement(SpriteDetailPage, { family })))
      expect(host.querySelectorAll('[data-sprite-acquisition]')).toHaveLength(1)
      expect(host.querySelectorAll('.sprite-detail-info-grid')).toHaveLength(0)
      expect(countText(guidance.leveling)).toBe(1)
      expect(countText(guidance.task)).toBe(1)
      if (guidance.unlock) expect(countText(guidance.unlock)).toBe(1)
      expect(countText('We have not verified a permanent coordinate')).toBe(1)
      expect(host.querySelectorAll('.sprite-detail-entries button')).toHaveLength(
        entriesForFamily(id).length,
      )
      expect(host.querySelectorAll('[data-collection-save-notice]')).toHaveLength(1)
      expect(
        host.querySelector('.sprite-detail-variants-section [data-collection-save-notice]'),
      ).not.toBeNull()
      const headings = [...host.querySelectorAll('h2')].map((h) => h.textContent)
      expect(headings).toEqual([
        `${family.name} Sprite variants`,
        `How to get ${family.name}`,
        `Leveling and mastering ${family.name}`,
        'Sources and scope',
        'Related Sprites',
      ])
      expect(
        [...host.querySelectorAll<HTMLAnchorElement>('#sprite-sources a')].map((a) => a.href),
      ).toEqual(Object.values(guidanceSources).map((source) => source.url))
      expect(host.querySelector('#sprite-sources time')?.getAttribute('datetime')).toBe(
        guidanceCheckedAt,
      )
    },
  )
  it('preserves acquisition and location hints for a family without rich guidance', async () => {
    const family = spriteFamilies.find((item) => !spriteGuidance[item.id])
    if (!family) throw new Error('Missing fallback-family fixture')
    await act(async () => root.render(createElement(SpriteDetailPage, { family })))
    expect(countText(family.acquisitionHint)).toBe(1)
    expect(countText(family.locationHint)).toBe(1)
    expect(host.querySelectorAll('[data-sprite-acquisition]')).toHaveLength(1)
    expect(host.querySelector('[data-sprite-practical-guide]')).toBeNull()
    expect(host.querySelector('#sprite-sources')).toBeNull()
    expect(host.querySelector('a[href="/locations"]')).not.toBeNull()
    expect(host.querySelector('.sprite-detail-trust-panel')).not.toBeNull()
  })
})
