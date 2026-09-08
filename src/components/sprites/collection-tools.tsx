import { useRef, useState } from 'react'
import {
  type CollectionStateV1,
  parseCollectionBackup,
  serializeCollectionBackup,
} from '@/lib/sprites/collection'
import {
  buildDiscordShareText,
  buildShareSelections,
  type ShareTemplate,
} from '@/lib/sprites/share-selection'
import { ShareStudio } from './share-studio'

type Props = {
  collection: CollectionStateV1
  onRestore: (state: CollectionStateV1) => void
}

export function CollectionTools({ collection, onRestore }: Readonly<Props>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [discordMode, setDiscordMode] =
    useState<Exclude<ShareTemplate, 'celebration'>>('collection')

  function exportBackup() {
    const blob = new Blob([serializeCollectionBackup(collection)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fn-sprite-hub-${collection.seasonId}-backup.json`
    link.click()
    URL.revokeObjectURL(url)
    setIsError(false)
    setMessage('Backup downloaded.')
  }

  async function importBackup(file?: File) {
    if (!file) return
    const result = parseCollectionBackup(await file.text())
    if (!result.ok) {
      setIsError(true)
      setMessage(result.error)
      return
    }
    onRestore(result.state)
    setIsError(false)
    setMessage('Collection restored from backup.')
  }

  async function copyDiscordSummary() {
    try {
      const selections = buildShareSelections(discordMode, collection)
      const combined = {
        ...selections[0],
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
      setMessage('Could not access the clipboard. Try again from a secure browser tab.')
    }
  }

  return (
    <div className="sprite-collection-tools">
      <div>
        <strong>Collection tools</strong>
        <span className="sprite-collection-tools-description">
          Back up this browser or copy a shareable summary.
        </span>
      </div>
      <div className="sprite-collection-tool-buttons">
        <ShareStudio collection={collection} />
        <button onClick={exportBackup} type="button">
          Download backup
        </button>
        <button onClick={() => inputRef.current?.click()} type="button">
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
          onChange={async (event) => {
            await importBackup(event.target.files?.[0])
            event.target.value = ''
          }}
          ref={inputRef}
          type="file"
        />
      </div>
      <output aria-live="polite" data-error={isError || undefined}>
        {message}
      </output>
    </div>
  )
}
