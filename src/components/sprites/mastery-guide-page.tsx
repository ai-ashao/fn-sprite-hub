import { currentReleasedEntryCount, currentSeason } from '@/data/sprites'
import { SpriteContentLayout } from './content-layout'

export function MasteryGuidePage() {
  return (
    <SpriteContentLayout
      description="Understand what Mastered means in the Fortnite Sprite collection and how FN Sprite Hub tracks it separately from Owned."
      eyebrow={`CURRENT SEASON · ${currentSeason.patch}`}
      title="How to Master Sprites in Fortnite 2026"
    >
      <section className="sprite-text-section">
        <h2>Owned and Mastered are different states</h2>
        <p>
          Owned means the collectible entry is in your collection. Mastered is a stronger status:
          use it after you have fully leveled and extracted that specific Sprite entry in-game. FN
          Sprite Hub keeps those states separate for all {currentReleasedEntryCount} released
          current-season entries.
        </p>
      </section>

      <section className="sprite-steps">
        <article>
          <span>01</span>
          <div>
            <h2>Collect the entry</h2>
            <p>Find or acquire the Base or special-finish entry you want to track.</p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <h2>Level it in-game</h2>
            <p>Use the Sprite and complete the in-game leveling requirement for that entry.</p>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <h2>Extract it after Level 5</h2>
            <p>
              Once the entry has reached the required level and is extracted, mark it Mastered in
              the tracker.
            </p>
          </div>
        </article>
      </section>

      <a className="sprite-primary-link" href="/">
        Open the Sprite Tracker →
      </a>
    </SpriteContentLayout>
  )
}
