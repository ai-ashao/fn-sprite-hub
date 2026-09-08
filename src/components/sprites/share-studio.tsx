import { useEffect, useMemo, useRef, useState } from 'react'
import type { CollectionStateV1 } from '@/lib/sprites/collection'
import { renderSharePng, shareFileName } from '@/lib/sprites/share-renderer'
import {
  buildShareSelections,
  type ShareSelection,
  type ShareTemplate,
  shareTemplateAvailable,
} from '@/lib/sprites/share-selection'

type Props = {
  collection: CollectionStateV1
  buttonClassName?: string
}

type RenderedPage = {
  selection: ShareSelection
  blob: Blob
  url: string
  file: File
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not prepare the PNG preview.'))
    reader.readAsDataURL(blob)
  })
}

const templates: ReadonlyArray<{
  id: ShareTemplate
  label: string
  description: string
}> = [
  { id: 'collection', label: 'My Collection', description: 'A family-level season poster.' },
  { id: 'missing', label: 'Missing Sprites', description: 'Only entries you still need.' },
  { id: 'unmastered', label: 'Need to Master', description: 'Owned entries not yet mastered.' },
  {
    id: 'celebration',
    label: '100% Celebration',
    description: 'Unlocked at 100% collection or mastery.',
  },
]

export function ShareStudio({ collection, buttonClassName }: Readonly<Props>) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const renderRequestRef = useRef(0)
  const [isOpen, setIsOpen] = useState(false)
  const [template, setTemplate] = useState<ShareTemplate>('missing')
  const [rendered, setRendered] = useState<RenderedPage[]>([])
  const [activePage, setActivePage] = useState(0)
  const [status, setStatus] = useState('')
  const [renderMs, setRenderMs] = useState<number>()
  const [busy, setBusy] = useState(false)
  const selections = useMemo(
    () => buildShareSelections(template, collection),
    [collection, template],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!isOpen) {
      if (dialog.open) dialog.close()
      return
    }
    if (!dialog.open) dialog.showModal()
  }, [isOpen])

  async function createPreview(nextSelections = selections) {
    const requestId = ++renderRequestRef.current
    setBusy(true)
    setStatus('Rendering preview…')
    const started = performance.now()
    try {
      const pages: RenderedPage[] = []
      for (const selection of nextSelections) {
        const blob = await renderSharePng(selection, collection)
        if (blob.size > 5 * 1024 * 1024) throw new Error('A rendered PNG exceeded the 5 MB limit.')
        const name = shareFileName(selection)
        pages.push({
          selection,
          blob,
          url: await blobToDataUrl(blob),
          file: new File([blob], name, { type: 'image/png' }),
        })
      }
      if (requestId !== renderRequestRef.current) return
      setRendered(pages)
      setActivePage(0)
      const elapsed = Math.round(performance.now() - started)
      setRenderMs(elapsed)
      setStatus(`Ready · ${pages.length} PNG${pages.length === 1 ? '' : 's'} · ${elapsed} ms`)
    } catch (error) {
      if (requestId !== renderRequestRef.current) return
      setRendered([])
      setStatus(error instanceof Error ? error.message : 'Could not render the preview.')
    } finally {
      if (requestId === renderRequestRef.current) setBusy(false)
    }
  }

  function openStudio() {
    setIsOpen(true)
    window.setTimeout(() => void createPreview(), 0)
  }

  function downloadPages() {
    for (const page of rendered) {
      const link = document.createElement('a')
      const url = URL.createObjectURL(page.blob)
      link.href = url
      link.download = page.file.name
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
    }
    setStatus(`Downloaded ${rendered.length} PNG${rendered.length === 1 ? '' : 's'}.`)
  }

  async function nativeShare() {
    try {
      await navigator.share({
        files: rendered.map(({ file }) => file),
        title: 'FN Sprite Hub collection',
        text: '✦ Track yours at FN Sprite Hub · fnspritehub.com',
      })
      setStatus('Shared successfully.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatus('Native sharing was unavailable. Download the PNG instead.')
    }
  }

  const canNativeShare =
    rendered.length > 0 &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (typeof navigator.canShare !== 'function' ||
      navigator.canShare({ files: rendered.map(({ file }) => file) }))
  const current = rendered[activePage]

  return (
    <>
      <button
        className={buttonClassName}
        data-share-studio-trigger
        onClick={openStudio}
        type="button"
      >
        Share Collection
      </button>
      <dialog
        className="sprite-share-dialog"
        data-share-studio
        onClose={() => setIsOpen(false)}
        ref={dialogRef}
      >
        <div className="sprite-share-shell">
          <header className="sprite-share-header">
            <div>
              <small>FN SPRITE HUB</small>
              <h2>Share Studio</h2>
              <p>Create a 1080 × 1350 PNG locally in your browser.</p>
            </div>
            <button aria-label="Close Share Studio" onClick={() => setIsOpen(false)} type="button">
              ×
            </button>
          </header>

          <div className="sprite-share-body">
            <aside aria-label="Share templates" className="sprite-share-templates">
              {templates.map((item) => {
                const enabled = shareTemplateAvailable(item.id, collection)
                return (
                  <button
                    aria-pressed={template === item.id}
                    disabled={!enabled}
                    key={item.id}
                    onClick={async () => {
                      setTemplate(item.id)
                      await createPreview(buildShareSelections(item.id, collection))
                    }}
                    type="button"
                  >
                    <strong>{item.label}</strong>
                    <span className="sprite-share-template-description">
                      {enabled ? item.description : 'Complete the collection to unlock.'}
                    </span>
                  </button>
                )
              })}
            </aside>

            <section className="sprite-share-preview" aria-label="Share image preview">
              {busy ? <div className="sprite-share-loading">Rendering your collection…</div> : null}
              {!busy && current ? (
                <img
                  alt={`${templates.find(({ id }) => id === template)?.label} share preview, page ${activePage + 1} of ${rendered.length}`}
                  data-share-preview
                  src={current.url}
                />
              ) : null}
              {!busy && !current ? (
                <div className="sprite-share-loading">No preview available.</div>
              ) : null}
              {rendered.length > 1 ? (
                <nav aria-label="Preview pages" className="sprite-share-pages">
                  {rendered.map((page, index) => (
                    <button
                      aria-current={index === activePage ? 'page' : undefined}
                      key={page.file.name}
                      onClick={() => setActivePage(index)}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              ) : null}
            </section>
          </div>

          <footer className="sprite-share-footer">
            <output aria-live="polite" data-render-ms={renderMs}>
              {status}
            </output>
            <div>
              <button disabled={!rendered.length || busy} onClick={downloadPages} type="button">
                Download {rendered.length > 1 ? `${rendered.length} PNGs` : 'PNG'}
              </button>
              {canNativeShare ? (
                <button onClick={nativeShare} type="button">
                  Share
                </button>
              ) : null}
            </div>
          </footer>
        </div>
      </dialog>
    </>
  )
}
