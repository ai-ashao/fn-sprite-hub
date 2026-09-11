import { useEffect, useRef, useState } from 'react'
import {
  type CollectionStateV1,
  collectionMetrics,
  parseCollectionBackup,
  serializeCollectionBackup,
  useSpriteCollection,
} from '@/lib/sprites/collection'
import type { Confirmation } from '@/lib/sprites/collection-store'
import { requestTextDownload } from '@/lib/sprites/download'
import {
  buildDiscordShareText,
  buildShareSelections,
  type ShareTemplate,
} from '@/lib/sprites/share-selection'
import { CollectionNotice } from './collection-notice'
import { ShareStudio } from './share-studio'

type Props = {
  collection: CollectionStateV1
  // Retained for call-site compatibility; destructive restore uses the shared controller below.
  onRestore?: unknown
  showNotice?: boolean
}
type Pending = { state: CollectionStateV1; token: Confirmation; filename: string }
const maxBackupBytes = 1024 * 1024

export function CollectionTools({ collection, showNotice = true }: Readonly<Props>) {
  const controller = useSpriteCollection()
  const inputRef = useRef<HTMLInputElement>(null)
  const readId = useRef(0)
  useEffect(
    () => () => {
      ++readId.current
    },
    [],
  )
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const [discordMode, setDiscordMode] =
    useState<Exclude<ShareTemplate, 'celebration'>>('collection')
  const current = collectionMetrics(controller.collection)
  const incoming = pending ? collectionMetrics(pending.state) : null

  async function importBackup(file?: File) {
    const id = ++readId.current
    setPending(null)
    if (!file) return
    setMessage('Reading backup…')
    setIsError(false)
    try {
      if (file.size > maxBackupBytes)
        throw new Error('Backup exceeds the 1 MB import limit. Your collection has not changed.')
      const result = parseCollectionBackup(await file.text())
      if (id !== readId.current) return
      if (!result.ok) throw new Error(result.error)
      setPending({ state: result.state, token: controller.confirmation(), filename: file.name })
      setMessage('Review the backup before replacing this browser’s collection.')
    } catch (error) {
      if (id !== readId.current) return
      setIsError(true)
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not read this file. Your collection has not changed.',
      )
    }
  }

  async function confirmRestore() {
    if (!pending || busy) return
    setBusy(true)
    const result = await controller.restore(pending.state, pending.token)
    setBusy(false)
    setIsError(!result.ok)
    if (result.ok) {
      setPending(null)
      setMessage('Collection restored from backup.')
    } else {
      setMessage(result.error ?? 'Restore was not completed.')
      if (result.conflict) setPending({ ...pending, token: controller.confirmation() })
    }
  }

  async function copyDiscordSummary() {
    try {
      const selections = buildShareSelections(discordMode, collection)
      const first = selections[0]
      if (!first) throw new Error('There are no entries to copy for this selection.')
      const combined = {
        ...first,
        entryIds: selections.flatMap(({ entryIds }) => entryIds),
        familyIds: selections.flatMap(({ familyIds }) => familyIds),
        page: 1,
        pageCount: 1,
      }
      await navigator.clipboard.writeText(buildDiscordShareText(combined, collection))
      setIsError(false)
      setMessage('Discord summary copied.')
    } catch {
      setIsError(true)
      setMessage(
        'Could not access the clipboard. Try again from a secure browser tab, or download a share image.',
      )
    }
  }

  return (
    <>
      {showNotice ? <CollectionNotice /> : null}
      <div className="sprite-collection-tools">
        <div>
          <strong>Collection tools</strong>
          <span className="sprite-collection-tools-description">
            Back up this browser or share your collection.
          </span>
        </div>
        <div className="sprite-collection-tool-buttons">
          <ShareStudio collection={collection} />
          <button
            onClick={() => {
              requestTextDownload(
                serializeCollectionBackup(collection),
                `fn-sprite-hub-${collection.seasonId}-backup.json`,
              )
              setIsError(false)
              setMessage('Backup download requested.')
            }}
            type="button"
          >
            Download backup
          </button>
          <button disabled={busy} onClick={() => inputRef.current?.click()} type="button">
            Restore backup
          </button>
          <label className="sprite-discord-copy">
            <span className="sr-only">Discord summary type</span>
            <select
              aria-label="Discord summary type"
              onChange={(event) =>
                setDiscordMode(event.target.value as Exclude<ShareTemplate, 'celebration'>)
              }
              value={discordMode}
            >
              <option value="collection">Collection Summary</option>
              <option value="missing">Missing List</option>
              <option value="unmastered">Need to Master</option>
            </select>
            <button onClick={copyDiscordSummary} type="button">
              Copy for Discord
            </button>
          </label>
          <input
            accept="application/json,.json"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void importBackup(file)
            }}
            ref={inputRef}
            type="file"
          />
        </div>
        <output aria-live="polite" data-error={isError || undefined}>
          {message}
        </output>
      </div>
      {pending && incoming ? (
        <section
          className="sprite-restore-preview"
          aria-label="Review backup replacement"
          data-restore-preview
        >
          <h3>Replace this browser’s collection?</h3>
          <p>
            <strong>{pending.filename}</strong> · {pending.state.seasonId} ·{' '}
            <time dateTime={pending.state.updatedAt}>
              {new Date(pending.state.updatedAt).toLocaleString('en-US')}
            </time>
          </p>
          <dl>
            <div>
              <dt>This tab now</dt>
              <dd>
                {current.owned} collected · {current.mastered} mastered
              </dd>
            </div>
            <div>
              <dt>Backup</dt>
              <dd>
                {incoming.owned} collected · {incoming.mastered} mastered
              </dd>
            </div>
          </dl>
          <p>
            This replaces, rather than merges, the current collection. The previous saved data is
            protected before replacement.
          </p>
          {controller.dirty ? (
            <p>
              Unsaved changes in this tab will also be protected separately. Exporting them first is
              recommended.
            </p>
          ) : null}
          {!['empty', 'valid'].includes(controller.loadKind) ? (
            <p>
              The unreadable or different-season original will be preserved as the previous
              snapshot.
            </p>
          ) : null}
          <div className="sprite-safety-actions">
            <button type="button" disabled={busy} onClick={() => void confirmRestore()}>
              {busy ? 'Restoring…' : 'Confirm replacement'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                ++readId.current
                setPending(null)
                setIsError(false)
                setMessage('Restore cancelled. Collection unchanged.')
              }}
            >
              Cancel restore
            </button>
          </div>
        </section>
      ) : null}
    </>
  )
}
