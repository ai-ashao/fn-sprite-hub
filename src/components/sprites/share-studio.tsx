import { Share2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { trackShareEvent } from '@/lib/analytics'
import type { CollectionStateV1 } from '@/lib/sprites/collection'
import { canExportShare } from '@/lib/sprites/share-lifecycle'
import { buildShareLayoutModel, renderSharePng, shareFileName } from '@/lib/sprites/share-renderer'
import {
  buildShareSelections,
  type ShareSelection,
  type ShareTemplate,
  shareTemplateAvailable,
} from '@/lib/sprites/share-selection'

type Props = {
  collection: CollectionStateV1
  buttonClassName?: string
  source?: 'header' | 'collection'
  triggerLabel?: string
  triggerIcon?: boolean
}
type RenderedPage = {
  selection: ShareSelection
  blob: Blob
  url: string
  file: File
  width: number
  height: number
}
type Result = { key: string; pages: RenderedPage[] }
const templates: ReadonlyArray<{ id: ShareTemplate; label: string; description: string }> = [
  { id: 'collection', label: 'My Collection', description: 'Every Sprite you have collected.' },
  { id: 'missing', label: 'Missing Sprites', description: 'Only entries you still need.' },
  {
    id: 'unmastered',
    label: 'Unmastered Sprites',
    description: 'Collected entries not yet mastered.',
  },
  { id: 'mastered', label: 'Mastered Sprites', description: 'Only your mastered entries.' },
  {
    id: 'celebration',
    label: '100% Celebration',
    description: 'Unlocked at 100% collection or mastery.',
  },
]

export function ShareStudio({
  collection,
  buttonClassName,
  source = 'collection',
  triggerLabel = 'Share Collection',
  triggerIcon = false,
}: Readonly<Props>) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [template, setTemplate] = useState<ShareTemplate>('missing')
  const [result, setResult] = useState<Result | null>(null)
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
  const current = pages[0]

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
    setStatus(retry ? 'Rendering preview again…' : 'Rendering preview…')
    const started = performance.now()
    async function render() {
      try {
        if (!shareTemplateAvailable(template, collection))
          throw new Error(
            'This template is not available for the current collection. Choose another template.',
          )
        const selection = buildShareSelections(template, collection)[0]
        if (!selection) throw new Error('No entries are available for this template.')
        const dimensions = buildShareLayoutModel(selection, collection)
        const blob = await renderSharePng(selection, collection)
        if (cancelled || request !== requestRef.current) return
        if (blob.size > 10 * 1024 * 1024)
          throw new Error('The rendered PNG exceeded the 10 MB limit.')
        allocated.push({
          selection,
          blob,
          url: URL.createObjectURL(blob),
          file: new File([blob], shareFileName(selection), { type: 'image/png' }),
          width: dimensions.width,
          height: dimensions.height,
        })
        if (cancelled || request !== requestRef.current) return
        setResult({ key, pages: allocated })
        const elapsed = Math.round(performance.now() - started)
        setRenderMs(elapsed)
        setStatus(`Ready · 1 PNG · ${dimensions.width} × ${dimensions.height} · ${elapsed} ms`)
        trackShareEvent('share_image_generated', {
          template,
          format: 'png',
          width: dimensions.width,
          height: dimensions.height,
        })
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

  function downloadPage(page: RenderedPage) {
    const url = URL.createObjectURL(page.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = page.file.name
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    trackShareEvent('share_image_download', {
      template: page.selection.template,
      format: 'png',
      width: page.width,
      height: page.height,
    })
  }

  function requestDownload() {
    if (!live.current.canExport || live.current.key !== result?.key || live.current.sharing) return
    const page = result?.pages[0]
    if (!page) return
    downloadPage(page)
    setStatus('PNG download requested.')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL('/', window.location.origin).toString())
      setStatus('Tracker link copied.')
    } catch {
      setStatus('Could not copy the link. Download the PNG or copy the address from your browser.')
    }
  }

  async function nativeShare() {
    if (
      !live.current.canExport ||
      live.current.key !== result?.key ||
      live.current.sharing ||
      !result
    )
      return
    const page = result.pages[0]
    if (!page) return
    const expectedKey = result.key
    const shareJob = ++shareRef.current
    const request = requestRef.current
    live.current.sharing = true
    setSharing(true)
    try {
      trackShareEvent('share_native_open', {
        template: page.selection.template,
        format: 'png',
      })
      await navigator.share({
        files: [page.file],
        title: 'FN Sprite Hub collection',
        text: '✦ Track yours at FN Sprite Hub · fnspritehub.com',
      })
      if (live.current.open && live.current.key === expectedKey && requestRef.current === request)
        setStatus('Sharing completed by your browser.')
    } catch (error) {
      if (!live.current.open || live.current.key !== expectedKey || requestRef.current !== request)
        return
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('Sharing cancelled.')
      } else {
        downloadPage(page)
        setStatus('Native sharing was unavailable. PNG download requested instead.')
      }
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
        aria-label={triggerIcon ? 'Share collection' : undefined}
        data-share-source={source}
        data-share-studio-trigger
        onClick={() => {
          setStatus('')
          if (!shareTemplateAvailable(template, collection)) {
            const availableTemplate = templates.find(({ id }) =>
              shareTemplateAvailable(id, collection),
            )
            if (availableTemplate) setTemplate(availableTemplate.id)
          }
          trackShareEvent(source === 'header' ? 'share_header_click' : 'share_collection_click', {
            path: window.location.pathname,
          })
          setIsOpen(true)
        }}
        type="button"
      >
        {triggerIcon ? <Share2 aria-hidden="true" size={16} /> : null}
        <span className={triggerIcon ? 'fn-header-share-label' : undefined}>{triggerLabel}</span>
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
              <p>Create one readable 1080px-wide PNG locally in your browser.</p>
            </div>
            <button aria-label="Close Share Studio" onClick={closeStudio} type="button">
              ×
            </button>
          </header>
          <div className="sprite-share-body">
            <aside aria-label="Share templates" className="sprite-share-templates">
              {templates.map((item) => {
                const enabled = shareTemplateAvailable(item.id, collection)
                const selectionCount =
                  item.id === 'celebration'
                    ? undefined
                    : buildShareSelections(item.id, collection)[0]?.entryIds.length
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
                      {enabled
                        ? `${item.description}${selectionCount === undefined ? '' : ` · ${selectionCount}`}`
                        : item.id === 'celebration'
                          ? 'Complete the collection to unlock.'
                          : `No ${item.label.toLowerCase()} yet.`}
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
                  alt={`${templates.find(({ id }) => id === template)?.label} share preview`}
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
            </section>
          </div>
          <footer className="sprite-share-footer">
            <output aria-live="polite" data-render-ms={renderMs}>
              {status}
            </output>
            <div>
              <button disabled={sharing} onClick={() => void copyLink()} type="button">
                Copy Link
              </button>
              <button disabled={!canExport || sharing} onClick={requestDownload} type="button">
                Download PNG
              </button>
              {canNativeShare ? (
                <button
                  className="sprite-share-primary-action"
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
