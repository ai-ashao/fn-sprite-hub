import {
  collectionMasteryRule,
  guidanceCheckedAt,
  guidanceSources,
  spriteGuidance,
} from '@/data/sprite-guidance'
import { currentReleasedEntryCount, currentSeason, familyById } from '@/data/sprites'
import { SpriteContentLayout } from './content-layout'

export function MasteryGuidePage() {
  return (
    <SpriteContentLayout
      description="Understand collection XP, the final extraction, and Crown / Klombo’s different in-match leveling rules. Keep Owned and Mastered separate in your tracker."
      eyebrow={`SEASON 4 · RULE NOTES REVIEWED ${guidanceCheckedAt}`}
      title="How to Master Sprites in Fortnite 2026"
    >
      <section className="sprite-quick-answer">
        <h2>The mastery step that matters</h2>
        <p>{collectionMasteryRule}</p>
        <small>
          Source: <a href={guidanceSources.override421.url}>Epic’s v42.10 update notes</a>
        </small>
      </section>
      <section className="sprite-text-section">
        <h2>Owned and Mastered are different states</h2>
        <p>
          Owned records an entry already in your collection. Mastered records a completed in-game
          mastery, not an attempt or a partially filled level bar. All {currentReleasedEntryCount}{' '}
          released entries in this catalog snapshot are tracked separately. The tracker is manual
          and does not connect to your Epic account.
        </p>
      </section>
      <section className="sprite-steps" aria-label="Mastery checklist">
        {[
          [
            'Check the entry',
            'Identify the exact family and finish in your in-game collection before choosing what to work on.',
          ],
          [
            'Follow the right leveling rule',
            'Read the family-specific rule below and check your current progress in-game. Do not assume every Sprite levels through the same actions.',
          ],
          [
            'Complete the extraction',
            'After the collection copy has reached maximum level, complete the extraction described in the v42.10 rule above. Confirm the in-game result before marking Mastered here.',
          ],
        ].map(([title, text], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="sprite-text-section">
        <h2>Two in-match leveling exceptions</h2>
        {(['crown', 'klombo'] as const).map((id) => {
          const family = familyById(id)
          const guidance = spriteGuidance[id]
          if (!family || !guidance) return null
          return (
            <article className="sprite-rule-note" key={id}>
              <h3>
                <a href={`/sprites/${family.slug}`}>{family.name} Sprite</a>
              </h3>
              <p>{guidance.leveling}</p>
              {guidance.unlock ? <p>{guidance.unlock}</p> : null}
            </article>
          )
        })}
        <p>
          <small>
            In-match rules: <a href={guidanceSources.override42.url}>v42.00</a>. Collection XP and
            Crown’s unlock fix: <a href={guidanceSources.override421.url}>v42.10</a>. These are
            different progression contexts; this guide does not assume an exact universal level
            number or a fixed number of wins.
          </small>
        </p>
      </section>
      <section className="sprite-text-section">
        <h2>Before you mark an entry Mastered</h2>
        <p>
          Check that you have selected the right finish, that its in-game progress is complete, and
          that you have completed the extraction. A different color or a partial progress bar is not
          enough. An accidental tracker click can be undone; it does not change the game.
        </p>
      </section>
      <p className="sprite-source-scope">
        Catalog: {currentSeason.patch}, dated {currentSeason.lastVerifiedAt}. Rule notes checked{' '}
        {guidanceCheckedAt}; live availability and event schedules are separate.
      </p>
      <a className="sprite-primary-link" href="/#collection">
        Open the Sprite Tracker →
      </a>
    </SpriteContentLayout>
  )
}
