import {
  currentReleasedEntryCount,
  currentSeason,
  entriesForFamily,
  finishLabel,
  spriteFamilies,
} from '@/data/sprites'
import { useSpriteCollection } from '@/lib/sprites/collection'
import { CollectionProgress } from './collection-progress'

export function SpriteChecklistPage() {
  const collection = useSpriteCollection()

  return (
    <div className="sprite-content-page">
      <section className="sprite-container sprite-page-hero">
        <p className="sprite-kicker">Chapter 7 Season 4 · {currentSeason.patch}</p>
        <h1>Fortnite Sprite Checklist 2026</h1>
        <p>
          Mark all {currentReleasedEntryCount} released Sprite entries in a compact checklist. Click
          once for Owned, again for Mastered, and again to clear.
        </p>
        <CollectionProgress
          collectionPercent={collection.metrics.collectionPercent}
          mastered={collection.metrics.mastered}
          masteryPercent={collection.metrics.masteryPercent}
          mounted={collection.mounted}
          owned={collection.metrics.owned}
          total={collection.metrics.total}
        />
      </section>

      <section className="sprite-container sprite-checklist" aria-label="Fortnite Sprite Checklist">
        {spriteFamilies.map((family) => (
          <article className="sprite-checklist-row" key={family.id}>
            <a className="sprite-checklist-family" href={`/sprites/${family.slug}`}>
              <img alt="" height={54} src={family.familyImage} width={54} />
              <span>
                <strong>{family.name}</strong>
                <small>{family.rarity}</small>
              </span>
            </a>
            <div className="sprite-checklist-entries">
              {entriesForFamily(family.id).map((entry) => {
                const state = collection.getEntryState(entry.id)
                return (
                  <button
                    data-entry-state={state}
                    key={entry.id}
                    onClick={() => collection.cycleEntry(entry.id)}
                    type="button"
                  >
                    <span>{state === 'missing' ? '○' : state === 'owned' ? '✓' : '★'}</span>
                    {finishLabel(entry.finish)}
                  </button>
                )
              })}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
