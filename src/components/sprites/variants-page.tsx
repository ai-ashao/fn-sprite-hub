import { currentSeason, finishLabel, type SpriteFinishKind, spriteEntries } from '@/data/sprites'
import { SpriteContentLayout } from './content-layout'

const finishes: readonly {
  kind: SpriteFinishKind
  description: string
}[] = [
  { kind: 'normal', description: 'The standard collectible form for a Sprite family.' },
  {
    kind: 'gold',
    description: 'A special current-season finish tracked separately from the Base entry.',
  },
  {
    kind: 'cheat-master',
    description: 'A special finish associated with the current Cheat Code system.',
  },
  {
    kind: 'loot-hacker',
    description: 'A newer finish. Only released entries count toward completion.',
  },
]

export function VariantsPage() {
  return (
    <SpriteContentLayout
      description="See the current Fortnite Sprite finishes and which collectible entries are actually released. Unreleased entries never inflate the tracker denominator."
      eyebrow={`Verified ${currentSeason.lastVerifiedAt} · ${currentSeason.patch}`}
      title="Fortnite Sprite Variants 2026"
    >
      <div className="sprite-info-cards">
        {finishes.map((finish) => {
          const count = spriteEntries.filter(
            (entry) => entry.finish === finish.kind && entry.released,
          ).length
          return (
            <section id={finish.kind} key={finish.kind}>
              <small>{count} released</small>
              <h2>{finishLabel(finish.kind)}</h2>
              <p>{finish.description}</p>
            </section>
          )
        })}
      </div>
      <section className="sprite-text-section">
        <h2>Why released status matters</h2>
        <p>
          Live-service Sprite data changes during a season. FN Sprite Hub only counts entries that
          are verified released in the current patch. Datamined or visible-but-unreleased finishes
          stay outside your completion total until they go live.
        </p>
      </section>
    </SpriteContentLayout>
  )
}
