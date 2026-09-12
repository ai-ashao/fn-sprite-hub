import { serializeCollectionBackup, useSpriteCollection } from '@/lib/sprites/collection'
import { requestTextDownload } from '@/lib/sprites/download'

export function CollectionNotice() {
  const collection = useSpriteCollection()
  const hasPreservedOriginal =
    collection.raw !== null && !['valid', 'empty'].includes(collection.loadKind)
  const needsAttention =
    collection.mounted && (collection.dirty || collection.level !== 'info' || hasPreservedOriginal)
  const hasActions =
    collection.mounted &&
    (collection.undo ||
      needsAttention ||
      collection.previousUnsavedRaw !== null ||
      collection.previousRaw !== null)

  return (
    <div
      className="sprite-save-notice"
      data-save-level={collection.mounted ? collection.level : undefined}
      data-save-presentation={needsAttention ? 'expanded' : 'compact'}
      data-collection-save-notice
    >
      <output aria-live="polite" aria-atomic="true">
        {collection.mounted ? collection.message : 'Loading this browser’s collection…'}
      </output>
      {hasActions ? (
        <div className="sprite-safety-actions">
          {collection.undo ? (
            <button type="button" onClick={() => void collection.undoLast()}>
              Undo last change
            </button>
          ) : null}
          {collection.dirty || collection.level !== 'info' ? (
            <button
              type="button"
              onClick={() =>
                requestTextDownload(
                  serializeCollectionBackup(collection.collection),
                  `fn-sprite-hub-${collection.collection.seasonId}-session.json`,
                )
              }
            >
              Export this tab’s collection
            </button>
          ) : null}
          {hasPreservedOriginal ? (
            <button
              type="button"
              onClick={() =>
                requestTextDownload(
                  collection.raw ?? '',
                  'fn-sprite-hub-preserved-original.txt',
                  'text/plain',
                )
              }
            >
              Export preserved original
            </button>
          ) : null}
          {collection.previousUnsavedRaw !== null ? (
            <button
              type="button"
              onClick={() =>
                requestTextDownload(
                  collection.previousUnsavedRaw ?? '',
                  'fn-sprite-hub-unsaved-before-replace.json',
                )
              }
            >
              Download protected unsaved work
            </button>
          ) : null}
          {collection.previousRaw !== null ? (
            <button
              type="button"
              onClick={() =>
                requestTextDownload(
                  collection.previousRaw ?? '',
                  'fn-sprite-hub-previous-snapshot.json',
                )
              }
            >
              Download previous snapshot
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
