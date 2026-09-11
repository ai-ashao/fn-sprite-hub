import { useEffect, useId, useRef, useState } from 'react'
import type { CollectionStateV1 } from '@/lib/sprites/collection'
import { canExportShare } from '@/lib/sprites/share-lifecycle'
import { renderSharePng, shareFileName } from '@/lib/sprites/share-renderer'
import {
  buildShareSelections,
  type ShareSelection,
  type ShareTemplate,
  shareTemplateAvailable,
} from '@/lib/sprites/share-selection'

type Props = { collection: CollectionStateV1; buttonClassName?: string }
type RenderedPage = { selection: ShareSelection; blob: Blob; url: string; file: File }
type Result = { key: string; pages: RenderedPage[] }
const templates: ReadonlyArray<{ id: ShareTemplate; label: string; description: string }> = [
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
  const titleId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [template, setTemplate] = useState<ShareTemplate>('missing')
  const [result, setResult] = useState<Result | null>(null)
  const [activePage, setActivePage] = useState(0)
  const [status, setStatus] = useState('')
  const [renderMs, setRenderMs] = useState<number>()
  const [busy, setBusy] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [retry, setRetry] = useState(0)
  const requestRef = useRef(0)
  const shareRef = useRef(0)
  const key = JSON.stringify({ template, collection })
  const canExport = canExportShare({
    open: isOpen,
    busy,
    expectedKey: key,
    resultKey: result?.key,
    pageCount: result?.pages.length ?? 0,
  })
  const live = useRef({ open: isOpen, key, canExport, sharing })
  live.current = { open: isOpen, key, canExport, sharing }
  const pages = canExport ? (result?.pages ?? []) : []
  const current = pages[activePage]

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    else if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    // An explicit retry discards old results before creating any new export files.
    const request = ++requestRef.current
    let cancelled = false
    const allocated: RenderedPage[] = []
    setBusy(true)
    setResult(null)
    setActivePage(0)
    setStatus(retry ? 'Rendering preview again…' : 'Rendering preview…')
    const started = performance.now()
    async function render() {
      try {
        if (!shareTemplateAvailable(template, collection))
          throw new Error(
            'This template is not available for the current collection. Choose another template.',
          )
        const selections = buildShareSelections(template, collection)
        for (const selection of selections) {
          const blob = await renderSharePng(selection, collection)
          if (cancelled || request !== requestRef.current) return
          if (blob.size > 5 * 1024 * 1024)
            throw new Error('A rendered PNG exceeded the 5 MB limit.')
          allocated.push({
            selection,
            blob,
            url: URL.createObjectURL(blob),
            file: new File([blob], shareFileName(selection), { type: 'image/png' }),
          })
        }
        if (cancelled || request !== requestRef.current) return
        setResult({ key, pages: allocated })
        const elapsed = Math.round(performance.now() - started)
        setRenderMs(elapsed)
        setStatus(
          allocated.length
            ? `Ready · ${allocated.length} PNG${allocated.length === 1 ? '' : 's'} · ${elapsed} ms`
            : 'No entries for this template. Choose another template.',
        )
      } catch (error) {
        for (const page of allocated) URL.revokeObjectURL(page.url)
        allocated.length = 0
        if (cancelled || request !== requestRef.current) return
        setResult(null)
        setStatus(
          error instanceof Error ? error.message : 'Could not render the preview. Try again.',
        )
      } finally {
        if (!cancelled && request === requestRef.current) setBusy(false)
      }
    }
    void render()
    return () => {
      cancelled = true
      for (const page of allocated) URL.revokeObjectURL(page.url)
    }
  }, [collection, isOpen, key, retry, template])

  function closeStudio() {
    ++requestRef.current
    ++shareRef.current
    live.current = { ...live.current, open: false, canExport: false }
    setIsOpen(false)
    setResult(null)
    setStatus('')
    setSharing(false)
  }

  function requestDownloads(selected: readonly RenderedPage[]) {
    if (!live.current.canExport || live.current.key !== result?.key || live.current.sharing) return
    for (const page of selected) {
      const url = URL.createObjectURL(page.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = page.file.name
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    }
    setStatus(
      `Download requested for ${selected.length} PNG${selected.length === 1 ? '' : 's'}. If multiple downloads are blocked, download each preview page separately.`,
    )
  }

  async function nativeShare() {
    if (
      !live.current.canExport ||
      live.current.key !== result?.key ||
      live.current.sharing ||
      !result
    )
      return
    const expectedKey = result.key
    const shareJob = ++shareRef.current
    const request = requestRef.current
    live.current.sharing = true
    setSharing(true)
    try {
      await navigator.share({
        files: result.pages.map(({ file }) => file),
        title: 'FN Sprite Hub collection',
        text: '✦ Track yours at FN Sprite Hub · fnspritehub.com',
      })
      if (live.current.open && live.current.key === expectedKey && requestRef.current === request)
        setStatus('Sharing completed by your browser.')
    } catch (error) {
      if (!live.current.open || live.current.key !== expectedKey || requestRef.current !== request)
        return
      setStatus(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Sharing cancelled.'
          : 'Native sharing was unavailable. Download the PNG instead.',
      )
    } finally {
      if (shareRef.current === shareJob) {
        live.current.sharing = false
        setSharing(false)
      }
    }
  }

  let canNativeShare = false
  try {
    canNativeShare =
      canExport &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      (typeof navigator.canShare !== 'function' ||
        navigator.canShare({ files: pages.map(({ file }) => file) }))
  } catch {
    /* Download remains available when native capability checks fail. */
  }

  return (
    <>
      <button
        className={buttonClassName}
        data-share-studio-trigger
        onClick={() => {
          setStatus('')
          setIsOpen(true)
        }}
        type="button"
      >
        Share Collection
      </button>
      <dialog
        className="sprite-share-dialog"
        data-share-studio
        aria-labelledby={titleId}
        onClose={closeStudio}
        ref={dialogRef}
      >
        <div className="sprite-share-shell">
          <header className="sprite-share-header">
            <div>
              <small>FN SPRITE HUB</small>
              <h2 id={titleId}>Share Studio</h2>
              <p>Create a 1080 × 1350 PNG locally in your browser.</p>
            </div>
            <button aria-label="Close Share Studio" onClick={closeStudio} type="button">
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
                    disabled={!enabled || sharing}
                    key={item.id}
                    onClick={() => {
                      setTemplate(item.id)
                      setSharing(false)
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
            <section
              className="sprite-share-preview"
              aria-label="Share image preview"
              aria-busy={busy}
            >
              {busy ? <div className="sprite-share-loading">Rendering your collection…</div> : null}
              {current ? (
                <img
                  alt={`${templates.find(({ id }) => id === template)?.label} share preview, page ${activePage + 1} of ${pages.length}`}
                  data-share-preview
                  src={current.url}
                />
              ) : null}
              {!busy && !current ? (
                <div className="sprite-share-loading">
                  No preview available.{' '}
                  <button type="button" onClick={() => setRetry((value) => value + 1)}>
                    Retry preview
                  </button>
                </div>
              ) : null}
              {pages.length > 1 ? (
                <nav aria-label="Preview pages" className="sprite-share-pages">
                  {pages.map((page, index) => (
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
              <button
                disabled={!canExport || sharing}
                onClick={() => requestDownloads(pages)}
                type="button"
              >
                Download {pages.length > 1 ? `${pages.length} PNGs` : 'PNG'}
              </button>
              {pages.length > 1 ? (
                <button
                  disabled={!canExport || sharing}
                  onClick={() => current && requestDownloads([current])}
                  type="button"
                >
                  Download page {activePage + 1}
                </button>
              ) : null}
              {canNativeShare ? (
                <button
                  disabled={!canExport || sharing}
                  onClick={() => void nativeShare()}
                  type="button"
                >
                  {sharing ? 'Sharing…' : 'Share'}
                </button>
              ) : null}
            </div>
          </footer>
        </div>
      </dialog>
    </>
  )
}
