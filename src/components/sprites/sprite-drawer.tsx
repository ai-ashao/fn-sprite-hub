import { useEffect, useRef } from 'react'
import { entriesForFamily, familyById, finishLabel } from '@/data/sprites'
import type { EntryState } from '@/lib/sprites/collection'

type SpriteDrawerProps = {
  familyId?: string
  getEntryState: (entryId: string) => EntryState
  onCycleEntry: (entryId: string) => void
  onClose: () => void
}

const stateText: Record<EntryState, string> = {
  missing: 'Missing',
  owned: 'Owned',
  mastered: 'Mastered',
}

export function SpriteDrawer({
  familyId,
  getEntryState,
  onCycleEntry,
  onClose,
}: Readonly<SpriteDrawerProps>) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const family = familyId ? familyById(familyId) : undefined
  const entries = family ? entriesForFamily(family.id) : []

  useEffect(() => {
    if (!family) return
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [family, onClose])

  if (!family) return null

  return (
    <div className="sprite-drawer-backdrop">
      <button
        aria-label="Close Sprite details"
        className="sprite-drawer-dismiss"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label={`${family.name} Sprite details`}
        aria-modal="true"
        className="sprite-drawer"
        role="dialog"
      >
        <button
          aria-label="Close Sprite details"
          className="sprite-drawer-close"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          ×
        </button>

        <div className="sprite-drawer-art">
          <img
            alt={`${family.name} Sprite in Fortnite`}
            height={384}
            src={family.familyImage}
            width={384}
          />
        </div>

        <div className="sprite-drawer-heading">
          <span className={`sprite-rarity rarity-${family.rarity.toLowerCase()}`}>
            {family.rarity}
          </span>
          <h2>{family.name} Sprite</h2>
          <p>{family.ability}</p>
        </div>

        <section>
          <h3>Collection entries</h3>
          <div className="sprite-drawer-entries">
            {entries.map((entry) => {
              const state = getEntryState(entry.id)
              return (
                <button
                  className="sprite-drawer-entry"
                  data-entry-state={state}
                  key={entry.id}
                  onClick={() => onCycleEntry(entry.id)}
                  type="button"
                >
                  <strong>{finishLabel(entry.finish)}</strong>
                  <span>{stateText[state]}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h3>Where to find it</h3>
          <p>{family.locationHint}</p>
          <p>{family.acquisitionHint}</p>
        </section>

        <a className="sprite-primary-link" href={`/sprites/${family.slug}`}>
          View full Sprite guide →
        </a>
      </aside>
    </div>
  )
}
