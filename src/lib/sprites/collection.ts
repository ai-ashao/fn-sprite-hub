import { useEffect, useSyncExternalStore } from 'react'
import { currentReleasedEntries, currentSeason } from '@/data/sprites'
import {
  type CollectionStateV1,
  emptyCollection,
  metrics,
  nextState,
  normalize,
  parseBackup,
  setEntry,
  stateOf,
} from './collection-state'
import {
  CollectionStore,
  collectionLockName,
  collectionStorageKey,
  type Exclusive,
} from './collection-store'

export type {
  CollectionStateV1,
  EntryState,
  ImportResult as CollectionImportResult,
} from './collection-state'
export { collectionStorageKey } from './collection-store'

const catalog = () => ({
  seasonId: currentSeason.id,
  entryIds: currentReleasedEntries().map(({ id }) => id),
})
export function normalizeCollectionState(value: unknown): CollectionStateV1 {
  return normalize(value, catalog())
}
export function loadCollectionState(storage: Pick<Storage, 'getItem'>): CollectionStateV1 {
  try {
    return normalizeCollectionState(JSON.parse(storage.getItem(collectionStorageKey) ?? 'null'))
  } catch {
    return emptyCollection(catalog())
  }
}
/** Explicit legacy helper. The production hook uses the protective store, never automatic writes. */
export function saveCollectionState(storage: Pick<Storage, 'setItem'>, state: CollectionStateV1) {
  const parsed = parseCollectionBackup(JSON.stringify(state))
  if (!parsed.ok) throw new Error(parsed.error)
  storage.setItem(collectionStorageKey, JSON.stringify(parsed.state))
}
export function serializeCollectionBackup(state: CollectionStateV1): string {
  return `${JSON.stringify(normalizeCollectionState(state), null, 2)}\n`
}
export function parseCollectionBackup(text: string) {
  return parseBackup(text, catalog())
}
export const entryState = stateOf
export function cycleEntryState(state: CollectionStateV1, id: string) {
  return setEntry(
    state,
    id,
    nextState(stateOf(state, id)),
    catalog(),
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  )
}
export function collectionMetrics(state: CollectionStateV1) {
  return metrics(state, catalog())
}
export function buildDiscordCollectionSummary(state: CollectionStateV1): string {
  const counts = collectionMetrics(state)
  const lines = (status: 'missing' | 'owned') =>
    currentReleasedEntries()
      .filter((entry) => entryState(state, entry.id) === status)
      .map((entry) => `• ${entry.displayName}`)
      .join('\n')
  return [
    'My Fortnite Sprite Collection',
    '',
    `Collected: ${counts.owned}/${counts.total}`,
    `Mastered: ${counts.mastered}/${counts.total}`,
    '',
    'Missing:',
    lines('missing') || '• None — collection complete!',
    '',
    'Need to Master:',
    lines('owned') || '• None',
    '',
    '✦ Track yours at FN Sprite Hub · fnspritehub.com',
  ].join('\n')
}

let browserStore: CollectionStore | undefined
const serverStore = new CollectionStore(catalog(), () => {
  throw new Error('No browser storage during SSR')
})
function storeForBrowser() {
  if (typeof window === 'undefined') return serverStore
  if (!browserStore) {
    let exclusive: Exclusive | undefined
    try {
      if (typeof window.navigator.locks?.request === 'function') {
        exclusive = async <T>(work: () => T | Promise<T>) => {
          const controller = new AbortController()
          const timer = window.setTimeout(() => controller.abort(), 3_000)
          try {
            return await window.navigator.locks.request(
              collectionLockName,
              { signal: controller.signal },
              work,
            )
          } finally {
            window.clearTimeout(timer)
          }
        }
      }
    } catch {
      /* Storage stays read-only; edits remain exportable in memory. */
    }
    browserStore = new CollectionStore(catalog(), () => window.localStorage, exclusive)
  }
  return browserStore
}

export function useSpriteCollection() {
  const store = storeForBrowser()
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, serverStore.getSnapshot)
  useEffect(() => {
    store.initialize()
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== collectionStorageKey) return
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) return
      } catch {
        /* Read handles blocked storage. */
      }
      store.synchronize()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') store.synchronize()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', store.synchronize)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', store.synchronize)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [store])
  useEffect(() => {
    if (!snapshot.dirty) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [snapshot.dirty])
  return {
    ...snapshot,
    metrics: collectionMetrics(snapshot.collection),
    cycleEntry: (id: string) => {
      void store.cycleEntry(id)
    },
    // Confirmation must be captured BEFORE a destructive-action dialog opens.
    confirmation: store.confirmation,
    restore: store.replace,
    reset: store.reset,
    undoLast: store.undoLast,
    getEntryState: (id: string) => entryState(snapshot.collection, id),
  }
}
