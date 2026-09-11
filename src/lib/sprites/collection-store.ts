import {
  type CollectionCatalog,
  type CollectionStateV1,
  type EntryState,
  emptyCollection,
  inspectCollection,
  type LoadResult,
  nextState,
  parseBackup,
  setEntry,
  stateOf,
  versionOf,
} from './collection-state'

export const collectionStorageKey = 'fn-sprite-hub:collection:v1'
export const previousCollectionKey = `${collectionStorageKey}:previous`
export const previousUnsavedKey = `${collectionStorageKey}:unsaved-before-replace`
export const collectionLockName = `${collectionStorageKey}:write`
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>
export type Exclusive = <T>(work: () => T | Promise<T>) => Promise<T>
type Undo = { id: string; before: EntryState; afterVersion: string }
export type CollectionSnapshot = {
  collection: CollectionStateV1
  mounted: boolean
  loadKind: LoadResult['kind']
  raw: string | null
  previousRaw: string | null
  previousUnsavedRaw: string | null
  dirty: boolean
  message: string
  level: 'info' | 'warning' | 'error'
  undo: Undo | null
}
export type Confirmation = { raw: string | null; memory: string }
export type MutationResult = { ok: boolean; conflict?: boolean; error?: string }

/** Local-only state. No writes at initialization, subscription, or external synchronization. */
export class CollectionStore {
  private snapshot: CollectionSnapshot
  private listeners = new Set<() => void>()
  private queue: Promise<unknown> = Promise.resolve()
  private started = false
  private counter = 0
  private clientId: string | undefined
  constructor(
    readonly catalog: CollectionCatalog,
    private readonly storage: () => StoragePort,
    private readonly exclusive?: Exclusive,
  ) {
    this.snapshot = {
      collection: emptyCollection(catalog),
      mounted: false,
      loadKind: 'empty',
      raw: null,
      previousRaw: null,
      previousUnsavedRaw: null,
      dirty: false,
      message: '',
      level: 'info',
      undo: null,
    }
  }
  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private update(patch: Partial<CollectionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    for (const listener of this.listeners) listener()
  }
  private revision() {
    this.clientId ??= globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    return `${this.clientId}:${++this.counter}`
  }
  private read(): LoadResult {
    try {
      return inspectCollection(this.storage().getItem(collectionStorageKey), this.catalog)
    } catch {
      return {
        kind: 'unavailable',
        raw: this.snapshot.raw,
        state: this.snapshot.collection,
        message:
          'Browser storage is unavailable. Changes stay in this tab; export a backup before leaving.',
      }
    }
  }
  private previous(key = previousCollectionKey): string | null {
    try {
      return this.storage().getItem(key)
    } catch {
      return null
    }
  }
  initialize = () => {
    if (this.started) return
    this.started = true
    const read = this.read()
    this.update({
      mounted: true,
      loadKind: read.kind,
      raw: read.raw,
      collection: read.state,
      previousRaw: this.previous(),
      previousUnsavedRaw: this.previous(previousUnsavedKey),
      message: this.exclusive
        ? read.message
        : 'Saved data is viewable. This browser cannot coordinate persistent edits; new changes stay in this tab. Export a backup before leaving.',
      level: !this.exclusive || !['empty', 'valid'].includes(read.kind) ? 'warning' : 'info',
    })
  }
  synchronize = () => {
    if (!this.started) return
    const read = this.read()
    if (read.kind === 'unavailable') {
      this.update({ message: read.message, level: 'warning' })
      return
    }
    if (read.raw === this.snapshot.raw) return
    if (this.snapshot.dirty) {
      this.update({
        message:
          'Another tab changed saved data. Your unsaved work is still here. Export it before reloading or replacing saved data.',
        level: 'warning',
      })
      return
    }
    // Never write received data back. Validate the actual current key, not stale event.newValue.
    this.update({
      collection: read.state,
      raw: read.raw,
      loadKind: read.kind,
      previousRaw: this.previous(),
      previousUnsavedRaw: this.previous(previousUnsavedKey),
      message:
        read.kind === 'valid'
          ? 'Collection updated from another tab.'
          : read.kind === 'empty'
            ? 'Saved collection was removed in another tab. No previous data was written back.'
            : read.message,
      level: read.kind === 'valid' ? 'info' : 'warning',
    })
  }
  confirmation = (): Confirmation => ({
    raw: this.snapshot.raw,
    memory: JSON.stringify(this.snapshot.collection),
  })
  private matches(token: Confirmation, read: LoadResult) {
    return token.raw === read.raw && token.memory === JSON.stringify(this.snapshot.collection)
  }
  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work, work)
    this.queue = result.catch(() => undefined)
    return result
  }
  private async coordinated<T>(work: () => T | Promise<T>): Promise<T> {
    if (!this.exclusive) return work()
    return this.exclusive(work)
  }
  private temporary(state: CollectionStateV1, undo: Undo | null, message: string): MutationResult {
    this.update({ collection: state, dirty: true, undo, message, level: 'warning' })
    return { ok: false, error: message }
  }
  private persist(state: CollectionStateV1, base: LoadResult, undo: Undo | null): MutationResult {
    if (!this.exclusive || this.snapshot.dirty || !['valid', 'empty'].includes(base.kind)) {
      return this.temporary(
        state,
        undo,
        'Not saved to this browser. Your changes stay in this tab; export a backup before leaving. The original stored data is untouched.',
      )
    }
    try {
      const port = this.storage()
      if (port.getItem(collectionStorageKey) !== base.raw) {
        return this.temporary(
          state,
          undo,
          'Saved data changed during this edit. Your work is kept in this tab; export it before restoring. Nothing was overwritten.',
        )
      }
      const raw = JSON.stringify(state)
      port.setItem(collectionStorageKey, raw)
      this.update({
        collection: state,
        raw,
        dirty: false,
        loadKind: 'valid',
        undo,
        message: 'Saved in this browser.',
        level: 'info',
      })
      return { ok: true }
    } catch {
      return this.temporary(
        state,
        undo,
        'Could not save — export a backup before leaving. Your changes are still available in this tab.',
      )
    }
  }
  cycleEntry = (id: string): Promise<MutationResult> =>
    this.enqueue(async () => {
      this.initialize()
      if (!this.catalog.entryIds.includes(id)) return { ok: false, error: 'Unknown Sprite entry.' }
      try {
        return await this.coordinated(() => {
          const read = this.read()
          const base =
            this.snapshot.dirty || !['valid', 'empty'].includes(read.kind)
              ? this.snapshot.collection
              : read.state
          const before = stateOf(base, id)
          const next = setEntry(base, id, nextState(before), this.catalog, this.revision())
          return this.persist(next, read, { id, before, afterVersion: versionOf(next, id) })
        })
      } catch {
        const before = stateOf(this.snapshot.collection, id)
        const next = setEntry(
          this.snapshot.collection,
          id,
          nextState(before),
          this.catalog,
          this.revision(),
        )
        return this.temporary(
          next,
          { id, before, afterVersion: versionOf(next, id) },
          'Could not coordinate saving. Changes stay in this tab; export a backup before leaving.',
        )
      }
    })
  undoLast = (): Promise<MutationResult> =>
    this.enqueue(async () => {
      const undo = this.snapshot.undo
      if (!undo) return { ok: false, error: 'There is no recent entry change to undo.' }
      try {
        return await this.coordinated(() => {
          const read = this.read()
          const base = this.snapshot.dirty ? this.snapshot.collection : read.state
          if (
            (!this.snapshot.dirty && !['valid', 'empty'].includes(read.kind)) ||
            versionOf(base, undo.id) !== undo.afterVersion
          ) {
            this.synchronize()
            this.update({
              undo: null,
              message:
                'This entry changed after your edit. Undo was cancelled to protect the newer change.',
              level: 'warning',
            })
            return { ok: false, conflict: true }
          }
          return this.persist(
            setEntry(base, undo.id, undo.before, this.catalog, this.revision()),
            read,
            null,
          )
        })
      } catch {
        this.update({ message: 'Undo could not be saved. Nothing was replaced.', level: 'error' })
        return { ok: false }
      }
    })
  replace = (
    state: CollectionStateV1,
    token: Confirmation,
    action: 'restore' | 'reset' = 'restore',
  ): Promise<MutationResult> =>
    this.enqueue(async () => {
      const checked = parseBackup(JSON.stringify(state), this.catalog)
      if (!checked.ok) {
        this.update({ message: checked.error, level: 'error' })
        return { ok: false, error: checked.error }
      }
      if (!this.exclusive) {
        const error =
          'Replacing saved data requires coordinated browser storage. Export your work and use a supported HTTPS browser.'
        this.update({ message: error, level: 'warning' })
        return { ok: false, error }
      }
      try {
        return await this.coordinated(() => {
          const read = this.read()
          if (read.kind === 'unavailable') {
            this.update({ message: read.message, level: 'warning' })
            return { ok: false, error: read.message }
          }
          if (!this.matches(token, read)) {
            if (!this.snapshot.dirty) this.synchronize()
            else this.update({ raw: read.raw, loadKind: read.kind })
            this.update({
              message:
                'Collection changed since the preview. Review the updated comparison and confirm again.',
              level: 'warning',
            })
            return {
              ok: false,
              conflict: true,
              error: 'Collection changed. Please review and confirm again.',
            }
          }
          const port = this.storage()
          // Keep unsaved in-memory work separately from the original on-disk bytes.
          if (this.snapshot.dirty) {
            const unsaved = JSON.stringify(this.snapshot.collection)
            port.setItem(previousUnsavedKey, unsaved)
            if (port.getItem(previousUnsavedKey) !== unsaved)
              throw new Error('Could not protect unsaved work.')
          }
          // Preserve original bytes (even damaged or from another season) BEFORE replacing.
          if (read.raw !== null) {
            port.setItem(previousCollectionKey, read.raw)
            if (port.getItem(previousCollectionKey) !== read.raw)
              throw new Error('Could not protect the previous collection.')
          }
          if (port.getItem(collectionStorageKey) !== read.raw) {
            this.update({
              message: 'Saved data changed. Review the comparison again.',
              level: 'warning',
            })
            return {
              ok: false,
              conflict: true,
              error: 'Saved data changed. Review the comparison again.',
            }
          }
          const revision = this.revision()
          const next: CollectionStateV1 = {
            ...checked.state,
            updatedAt: new Date().toISOString(),
            revision,
            entryVersions: Object.fromEntries(this.catalog.entryIds.map((id) => [id, revision])),
          }
          const raw = JSON.stringify(next)
          port.setItem(collectionStorageKey, raw)
          this.update({
            collection: next,
            raw,
            dirty: false,
            loadKind: 'valid',
            previousRaw: this.previous(),
            previousUnsavedRaw: this.previous(previousUnsavedKey),
            undo: null,
            message:
              action === 'reset'
                ? 'Collection reset. The previous snapshot is available below.'
                : 'Collection restored from backup.',
            level: 'info',
          })
          return { ok: true }
        })
      } catch {
        this.update({
          previousRaw: this.previous(),
          previousUnsavedRaw: this.previous(previousUnsavedKey),
          message:
            'Restore was not completed. Could not protect or save the collection; the current collection was not replaced.',
          level: 'error',
        })
        return {
          ok: false,
          error:
            'Restore was not completed. Keep your backup and try again when browser storage is available.',
        }
      }
    })
  reset = (token: Confirmation) => this.replace(emptyCollection(this.catalog), token, 'reset')
}
