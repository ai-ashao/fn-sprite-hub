import type { SpriteEntry, SpriteFamily, SpriteFinishKind } from '@/data/sprites'
import { finishLabel } from '@/data/sprites'
import type { EntryState } from '@/lib/sprites/collection'

type SpriteCardProps = {
  family: SpriteFamily
  entries: readonly SpriteEntry[]
  getEntryState: (entryId: string) => EntryState
  onCycleEntry: (entryId: string) => void
  onOpen: (familyId: string) => void
}

const statusSymbol: Record<EntryState, string> = {
  missing: '○',
  owned: '✓',
  mastered: '★',
}

export function SpriteCard({
  family,
  entries,
  getEntryState,
  onCycleEntry,
  onOpen,
}: Readonly<SpriteCardProps>) {
  const collected = entries.filter((entry) => getEntryState(entry.id) !== 'missing').length

  return (
    <article
      className="sprite-card"
      data-rarity={family.rarity}
      data-sprite-card
      data-tone={toneForRarity(family.rarity)}
    >
      <button
        aria-label={`Open ${family.name} Sprite details`}
        className="sprite-card-art-button"
        onClick={() => onOpen(family.id)}
        type="button"
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
        </div>
      </button>

      <div className="sprite-card-body">
        <div className="sprite-card-title-row">
          <button className="sprite-card-title" onClick={() => onOpen(family.id)} type="button">
            {family.name} Sprite
          </button>
          <span className="sprite-card-count">
            {collected}/{entries.length}
          </span>
        </div>
        <p className="sprite-card-ability">{family.ability}</p>

        <fieldset className="sprite-entry-chips">
          <legend className="sr-only">{family.name} variants</legend>
          {entries.map((entry) => {
            const state = getEntryState(entry.id)
            return (
              <button
                aria-label={`${finishLabel(entry.finish)} ${family.name}: ${state}. Click to cycle state.`}
                className="sprite-entry-chip"
                data-entry-state={state}
                data-image-mode={entry.imageMode}
                key={entry.id}
                onClick={() => onCycleEntry(entry.id)}
                title={`${finishLabel(entry.finish)} · ${state}`}
                type="button"
              >
                <span aria-hidden="true">{statusSymbol[state]}</span>
                <span>{shortFinish(entry.finish)}</span>
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
