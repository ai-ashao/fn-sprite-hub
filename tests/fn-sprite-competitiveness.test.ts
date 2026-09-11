import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { releasedFinishesFor } from '../src/data/released-sprite-finishes'
import {
  type CollectionCatalog,
  emptyCollection,
  inspectCollection,
  metrics,
  parseBackup,
  stateOf,
} from '../src/lib/sprites/collection-state'
import {
  CollectionStore,
  type Exclusive,
  collectionStorageKey as key,
  previousCollectionKey,
  previousUnsavedKey,
} from '../src/lib/sprites/collection-store'
import { canExportShare } from '../src/lib/sprites/share-lifecycle'
import {
  defaultTrackerState,
  readTrackerContext,
  sanitizeTrackerState,
  trackerContextKey,
  trackerIntent,
  writeTrackerContext,
} from '../src/lib/sprites/tracker-context'

const catalog: CollectionCatalog = {
  seasonId: 'test-season',
  entryIds: ['crown:normal', 'crown:gold', 'klombo:normal'],
}
const empty = () => emptyCollection(catalog)
const backup = () => ({
  ...empty(),
  ownedEntryIds: ['klombo:normal'],
  updatedAt: '2026-09-11T00:00:00.000Z',
})
class MemoryStorage {
  values = new Map<string, string>()
  writes: string[] = []
  failKey: string | null = null
  getItem = (name: string) => this.values.get(name) ?? null
  setItem = (name: string, value: string) => {
    if (name === this.failKey) throw new Error('Simulated quota / storage failure')
    this.writes.push(name)
    this.values.set(name, value)
  }
}
function lock(): Exclusive {
  let queue: Promise<unknown> = Promise.resolve()
  return <T>(work: () => T | Promise<T>): Promise<T> => {
    const result = queue.then(work, work)
    queue = result.catch(() => undefined)
    return result
  }
}
function setup(raw?: string, coordinated = true) {
  const port = new MemoryStorage()
  if (raw !== undefined) port.values.set(key, raw)
  const exclusive = coordinated ? lock() : undefined
  const a = new CollectionStore(catalog, () => port, exclusive)
  const b = new CollectionStore(catalog, () => port, exclusive)
  a.initialize()
  b.initialize()
  return { port, a, b }
}

test('CollectionStore construction does not generate random values in module scope', () => {
  const randomUUID = vi.spyOn(globalThis.crypto, 'randomUUID')
  try {
    new CollectionStore(catalog, () => new MemoryStorage(), lock())
    assert.equal(randomUUID.mock.calls.length, 0)
  } finally {
    randomUUID.mockRestore()
  }
})

test('QA01: opening a new collection performs no storage writes', () => {
  const { port, a } = setup()
  assert.equal(a.getSnapshot().loadKind, 'empty')
  assert.equal(a.getSnapshot().mounted, true)
  assert.equal(port.writes.length, 0)
})
test('QA02: old v1 data loads without optional coordination fields and without rewriting', () => {
  const raw = JSON.stringify(backup(), null, 2)
  const { port, a } = setup(raw)
  assert.equal(stateOf(a.getSnapshot().collection, 'klombo:normal'), 'owned')
  assert.equal(port.getItem(key), raw)
  assert.equal(port.writes.length, 0)
})
for (const [kind, raw] of [
  ['damaged', '{broken'],
  ['season', JSON.stringify({ ...empty(), seasonId: 'older-season' })],
  ['schema', JSON.stringify({ ...empty(), schemaVersion: 9 })],
  ['invalid', JSON.stringify({ ...empty(), ownedEntryIds: ['future:normal'] })],
  ['invalid', JSON.stringify({ ...empty(), futureData: { keep: true } })],
] as const) {
  test(`QA03-05: ${kind} original survives opening, synchronization and edits (${raw.slice(0, 20)})`, async () => {
    const { port, a } = setup(raw)
    assert.equal(a.getSnapshot().loadKind, kind)
    a.synchronize()
    await a.cycleEntry('crown:normal')
    assert.equal(a.getSnapshot().dirty, true)
    assert.equal(port.getItem(key), raw)
    assert.equal(port.writes.length, 0)
  })
}
test('QA06: even obtaining storage can throw without breaking the store', async () => {
  const a = new CollectionStore(
    catalog,
    () => {
      throw new Error('SecurityError')
    },
    lock(),
  )
  a.initialize()
  await a.cycleEntry('crown:normal')
  assert.equal(a.getSnapshot().loadKind, 'unavailable')
  assert.equal(a.getSnapshot().dirty, true)
  assert.equal(stateOf(a.getSnapshot().collection, 'crown:normal'), 'owned')
})
test('QA07: setItem failure preserves the disk and leaves an exportable in-memory result', async () => {
  const raw = JSON.stringify(backup())
  const { port, a } = setup(raw)
  port.failKey = key
  const result = await a.cycleEntry('crown:normal')
  assert.equal(result.ok, false)
  assert.equal(port.getItem(key), raw)
  assert.match(a.getSnapshot().message, /Could not save/)
  assert.equal(parseBackup(JSON.stringify(a.getSnapshot().collection), catalog).ok, true)
})
test('QA08-09: sequential and stale-tab updates use the newest saved collection', async () => {
  const { a, b } = setup()
  await a.cycleEntry('crown:normal')
  // Deliberately no synchronization on B before its edit.
  await b.cycleEntry('klombo:normal')
  a.synchronize()
  assert.deepEqual(
    new Set(a.getSnapshot().collection.ownedEntryIds),
    new Set(['crown:normal', 'klombo:normal']),
  )
})
test('QA10: external synchronization does not write back or loop', async () => {
  const { port, a, b } = setup()
  await a.cycleEntry('crown:normal')
  const writes = port.writes.length
  for (let i = 0; i < 10; i++) {
    b.synchronize()
    a.synchronize()
  }
  assert.equal(port.writes.length, writes)
})
test('QA11: cooperating clients serialize near-simultaneous edits', async () => {
  const { a, b } = setup()
  for (let i = 0; i < 20; i++)
    await Promise.all([a.cycleEntry('crown:normal'), b.cycleEntry('klombo:normal')])
  a.synchronize()
  b.synchronize()
  assert.equal(stateOf(a.getSnapshot().collection, 'crown:normal'), 'mastered')
  assert.equal(stateOf(a.getSnapshot().collection, 'klombo:normal'), 'mastered')
  assert.deepEqual(a.getSnapshot().collection, b.getSnapshot().collection)
})
test('QA11 fallback: no coordination support means temporary edits, not unsafe persistent writes', async () => {
  const { port, a } = setup(undefined, false)
  await a.cycleEntry('crown:normal')
  assert.equal(port.getItem(key), null)
  assert.equal(a.getSnapshot().dirty, true)
  assert.equal((await a.replace(backup(), a.confirmation())).ok, false)
})
test('QA11 timeout: lock failure preserves temporary work without touching disk', async () => {
  const port = new MemoryStorage()
  const a = new CollectionStore(
    catalog,
    () => port,
    async () => {
      throw new Error('Lock timeout')
    },
  )
  a.initialize()
  await a.cycleEntry('crown:normal')
  assert.equal(a.getSnapshot().dirty, true)
  assert.equal(port.getItem(key), null)
})
test('QA12: undo changes only its own entry, preserving another client’s entry', async () => {
  const { a, b } = setup()
  await a.cycleEntry('crown:normal')
  await b.cycleEntry('klombo:normal')
  assert.equal((await a.undoLast()).ok, true)
  assert.equal(stateOf(a.getSnapshot().collection, 'crown:normal'), 'missing')
  assert.equal(stateOf(a.getSnapshot().collection, 'klombo:normal'), 'owned')
})
test('QA13: a newer change to the same entry blocks undo and retains the warning', async () => {
  const { a, b } = setup()
  await a.cycleEntry('crown:normal')
  await b.cycleEntry('crown:normal')
  assert.equal((await a.undoLast()).conflict, true)
  assert.equal(stateOf(a.getSnapshot().collection, 'crown:normal'), 'mastered')
  assert.match(a.getSnapshot().message, /Undo was cancelled/)
})
test('QA13 ABA: same visible state after three external edits is still a different revision', async () => {
  const { a, b } = setup()
  await a.cycleEntry('crown:normal')
  for (let i = 0; i < 3; i++) await b.cycleEntry('crown:normal')
  assert.equal((await a.undoLast()).conflict, true)
})
test('QA14: obtaining a restore preview and cancelling does not change storage', () => {
  const { a, port } = setup(JSON.stringify(backup()))
  const before = port.getItem(key)
  a.confirmation()
  assert.equal(port.getItem(key), before)
  assert.equal(port.writes.length, 0)
})
test('QA15: backup validation rejects unsupported input and empty/unknown IDs', () => {
  for (const raw of [
    '{broken',
    '[]',
    JSON.stringify({ ...empty(), seasonId: 'wrong' }),
    JSON.stringify({ ...empty(), ownedEntryIds: [''] }),
    JSON.stringify({ ...empty(), ownedEntryIds: ['unknown:normal'] }),
    JSON.stringify({ ...empty(), masteredEntryIds: ['crown:normal'] }),
  ]) {
    assert.equal(parseBackup(raw, catalog).ok, false)
  }
})
test('QA16: stale restore requires another preview; it cannot erase a new external edit', async () => {
  const { a, b, port } = setup()
  const token = a.confirmation()
  await b.cycleEntry('crown:normal')
  assert.equal((await a.replace(backup(), token)).conflict, true)
  assert.equal(JSON.parse(port.getItem(key) ?? '').ownedEntryIds[0], 'crown:normal')
  assert.equal((await a.replace(backup(), a.confirmation())).ok, true)
})
test('QA17: archive failure prevents replacement', async () => {
  const raw = JSON.stringify(backup())
  const { a, port } = setup(raw)
  port.failKey = previousCollectionKey
  assert.equal((await a.replace(empty(), a.confirmation())).ok, false)
  assert.equal(port.getItem(key), raw)
})
test('QA17: write failure after protection keeps the old current bytes and no false success', async () => {
  const raw = JSON.stringify(backup())
  const { a, port } = setup(raw)
  port.failKey = key
  assert.equal((await a.replace(empty(), a.confirmation())).ok, false)
  assert.equal(port.getItem(key), raw)
  assert.equal(port.getItem(previousCollectionKey), raw)
  assert.equal(a.getSnapshot().level, 'error')
})
test('QA18: normal replacement is readable after reopening and protects exact previous bytes', async () => {
  const raw = JSON.stringify(empty(), null, 2)
  const { a, port } = setup(raw)
  assert.equal((await a.replace(backup(), a.confirmation())).ok, true)
  assert.equal(port.getItem(previousCollectionKey), raw)
  const reopened = new CollectionStore(catalog, () => port, lock())
  reopened.initialize()
  assert.equal(stateOf(reopened.getSnapshot().collection, 'klombo:normal'), 'owned')
})
test('QA18 damaged replacement protects raw bytes instead of a normalized empty object', async () => {
  const raw = '{damaged-but-recoverable'
  const { a, port } = setup(raw)
  assert.equal((await a.replace(backup(), a.confirmation())).ok, true)
  assert.equal(port.getItem(previousCollectionKey), raw)
})
test('QA18 unsaved work is protected separately before destructive replacement', async () => {
  const raw = JSON.stringify(empty())
  const { a, port } = setup(raw)
  port.failKey = key
  await a.cycleEntry('crown:normal')
  port.failKey = null
  assert.equal((await a.replace(backup(), a.confirmation())).ok, true)
  assert.equal(port.getItem(previousCollectionKey), raw)
  assert.equal(stateOf(JSON.parse(port.getItem(previousUnsavedKey) ?? ''), 'crown:normal'), 'owned')
})
test('reset preview is stale if the same tab changes while confirmation is open', async () => {
  const { a } = setup(JSON.stringify(backup()))
  const token = a.confirmation()
  await a.cycleEntry('crown:normal')
  assert.equal((await a.reset(token)).conflict, true)
  assert.equal(stateOf(a.getSnapshot().collection, 'klombo:normal'), 'owned')
})
test('same-tab subscribers observe a single shared source of truth', async () => {
  const { a } = setup()
  let called = 0
  const off = a.subscribe(() => {
    called++
  })
  await a.cycleEntry('crown:normal')
  off()
  await a.cycleEntry('klombo:normal')
  assert.equal(called, 1)
})
test('external corrupt data is not accepted as successful synchronization', () => {
  const { a, port } = setup(JSON.stringify(backup()))
  port.values.set(key, '{broken')
  a.synchronize()
  assert.equal(a.getSnapshot().loadKind, 'damaged')
  assert.equal(a.getSnapshot().level, 'warning')
  assert.equal(port.getItem(key), '{broken')
})
test('external removal never writes the stale collection back', () => {
  const { a, port } = setup(JSON.stringify(backup()))
  port.values.delete(key)
  a.synchronize()
  assert.equal(a.getSnapshot().loadKind, 'empty')
  assert.equal(port.writes.length, 0)
})
test('QA19-22: valid workspace roundtrips while unsafe filters and focus values are rejected', () => {
  const port = new MemoryStorage()
  const state = {
    ...defaultTrackerState,
    status: 'missing' as const,
    view: 'matrix' as const,
    query: 'Crown',
  }
  assert.equal(
    writeTrackerContext(() => port, {
      state,
      familyId: 'crown',
      scrollY: 650,
      timestamp: Date.now(),
    }),
    true,
  )
  assert.deepEqual(readTrackerContext(() => port, ['crown'])?.state, state)
  assert.equal(
    trackerIntent('?focus=https://evil.example&returnTo=https://evil.example', ['crown']).invalid,
    true,
  )
  assert.deepEqual(trackerIntent('?focus=crown&resume=1', ['crown']), {
    focus: 'crown',
    resume: false,
    invalid: false,
  })
  assert.equal(
    sanitizeTrackerState({ status: 'DELETE', sort: 'bad', query: 'x'.repeat(500) }).query.length,
    100,
  )
  assert.equal(sanitizeTrackerState({ view: 'unknown' }).view, 'gallery')
})
test('QA22: corrupted, expired or blocked session state falls back cleanly', () => {
  const port = new MemoryStorage()
  port.values.set(trackerContextKey, '{bad')
  assert.equal(
    readTrackerContext(() => port, ['crown']),
    null,
  )
  port.values.set(trackerContextKey, JSON.stringify({ timestamp: 0, state: defaultTrackerState }))
  assert.equal(
    readTrackerContext(() => port, ['crown']),
    null,
  )
  assert.equal(
    readTrackerContext(() => {
      throw new Error('blocked')
    }, ['crown']),
    null,
  )
  assert.equal(
    writeTrackerContext(
      () => {
        throw new Error('blocked')
      },
      { state: defaultTrackerState, familyId: null, timestamp: Date.now(), scrollY: 0 },
    ),
    false,
  )
})
test('QA23-24: export gate rejects busy, old-template, old-collection, closed and empty results', () => {
  const ready = { open: true, busy: false, expectedKey: 'new', resultKey: 'new', pageCount: 2 }
  assert.equal(canExportShare(ready), true)
  for (const change of [
    { busy: true },
    { open: false },
    { resultKey: 'old' },
    { resultKey: undefined },
    { pageCount: 0 },
  ])
    assert.equal(canExportShare({ ...ready, ...change }), false)
})
test('QA28: unreviewed families and prototype names get no automatic released finishes', () => {
  assert.deepEqual(releasedFinishesFor('new-unconfirmed-family'), [])
  assert.deepEqual(releasedFinishesFor('__proto__'), [])
  assert.deepEqual(releasedFinishesFor('crown'), ['normal', 'gold', 'cheat-master', 'loot-hacker'])
})
test('QA33: completion denominator follows the supplied catalog, not a permanent 47', () => {
  assert.equal(metrics(backup(), catalog).total, 3)
  assert.equal(
    metrics(backup(), { ...catalog, entryIds: [...catalog.entryIds, 'new:released'] }).total,
    4,
  )
  assert.equal(metrics(backup(), { ...catalog, entryIds: [] }).collectionPercent, 0)
})
test('unsupported metadata remains protected rather than silently normalized on disk', () => {
  const raw = JSON.stringify({ ...empty(), entryVersions: { 'new:unknown': 'r' } })
  assert.equal(inspectCollection(raw, catalog).kind, 'invalid')
})
