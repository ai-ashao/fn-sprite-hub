import type { SpriteEntry, SpriteFamily, SpriteFinishKind } from '@/data/sprites'
import { finishLabel } from '@/data/sprites'
import type { EntryState } from '@/lib/sprites/collection'

type SpriteCardProps = {
  family: SpriteFamily
  entries: readonly SpriteEntry[]
  getEntryState: (entryId: string) => EntryState
  onCycleEntry: (entryId: string) => void
}

const statusSymbol: Record<EntryState, string> = {
  missing: '○',
  owned: '✓',
  mastered: '★',
}

const statusLabel: Record<EntryState, string> = {
  missing: 'Missing',
  owned: 'Owned',
  mastered: 'Mastered',
}

export function SpriteCard({
  family,
  entries,
  getEntryState,
  onCycleEntry,
}: Readonly<SpriteCardProps>) {
  const collected = entries.filter((entry) => getEntryState(entry.id) !== 'missing').length
  const mastered = entries.filter((entry) => getEntryState(entry.id) === 'mastered').length
  const detailHref = `/sprites/${family.slug}`

  return (
    <article
      className="sprite-card"
      data-rarity={family.rarity}
      data-sprite-card
      data-tone={toneForRarity(family.rarity)}
    >
      <a
        aria-label={`View ${family.name} Sprite details`}
        className="sprite-card-art-link"
        href={detailHref}
      >
        <div className="sprite-card-art">
          <img
            alt={`${family.name} Sprite in Fortnite`}
            className="sprite-card-image"
            height={256}
            loading="lazy"
            src={family.familyImage}
            width={256}
          />
          <span className={`sprite-rarity rarity-${family.rarity.toLowerCase()}`}>
            {family.rarity}
          </span>
          <span className="sprite-card-view-hint" aria-hidden="true">
            View details <b>→</b>
          </span>
        </div>
      </a>

      <div className="sprite-card-body">
        <div className="sprite-card-title-row">
          <a className="sprite-card-title" href={detailHref}>
            {family.name} Sprite
          </a>
          <span className="sprite-card-count" title={`${collected} of ${entries.length} collected`}>
            {collected}/{entries.length}
          </span>
        </div>

        <p className="sprite-card-ability">{family.ability}</p>

        <div className="sprite-card-submeta">
          <span>{mastered} mastered</span>
          <span>Added {family.patchAdded}</span>
        </div>

        <fieldset className="sprite-entry-chips sprite-variant-grid">
          <legend className="sr-only">{family.name} variants</legend>
          {entries.map((entry) => {
            const state = getEntryState(entry.id)
            return (
              <button
                aria-label={`${finishLabel(entry.finish)} ${family.name}: ${statusLabel[state]}. Click to cycle state.`}
                className="sprite-entry-chip sprite-variant-tile"
                data-entry-id={entry.id}
                data-entry-state={state}
                data-image-mode={entry.imageMode}
                key={entry.id}
                onClick={() => onCycleEntry(entry.id)}
                title={`${finishLabel(entry.finish)} · ${statusLabel[state]}`}
                type="button"
              >
                <span className="sprite-variant-thumb" aria-hidden="true">
                  <img alt="" height={56} loading="lazy" src={entry.image} width={56} />
                </span>
                <span className="sprite-variant-copy">
                  <strong>{shortFinish(entry.finish)}</strong>
                  <small>{statusLabel[state]}</small>
                </span>
                <span className="sprite-variant-state" aria-hidden="true">
                  {statusSymbol[state]}
                </span>
              </button>
            )
          })}
        </fieldset>
      </div>
    </article>
  )
}

function shortFinish(finish: SpriteFinishKind) {
  if (finish === 'normal') return 'Base'
  if (finish === 'cheat-master') return 'CM'
  if (finish === 'loot-hacker') return 'LH'
  return 'Gold'
}

function toneForRarity(rarity: SpriteFamily['rarity']) {
  if (rarity === 'Rare') return 'moss'
  if (rarity === 'Epic') return 'sky'
  if (rarity === 'Legendary') return 'ember'
  return 'star'
}
