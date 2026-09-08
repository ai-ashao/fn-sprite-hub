import { useRef, useState } from 'react'
import {
  buildDiscordCollectionSummary,
  type CollectionStateV1,
  parseCollectionBackup,
  serializeCollectionBackup,
} from '@/lib/sprites/collection'

type Props = {
  collection: CollectionStateV1
  onRestore: (state: CollectionStateV1) => void
}

export function CollectionTools({ collection, onRestore }: Readonly<Props>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

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
      await navigator.clipboard.writeText(buildDiscordCollectionSummary(collection))
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
        <button onClick={exportBackup} type="button">
          Download backup
        </button>
        <button onClick={() => inputRef.current?.click()} type="button">
          Restore backup
        </button>
        <button onClick={copyDiscordSummary} type="button">
          Copy for Discord
        </button>
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
