import {
  collectionMasteryRule,
  generalAcquisitionRule,
  guidanceCheckedAt,
  guidanceSources,
  spriteGuidance,
} from '@/data/sprite-guidance'
import type { SpriteFamily } from '@/data/sprites'

export function SpriteQuickAnswer({ familyId }: Readonly<{ familyId: string }>) {
  const guidance = spriteGuidance[familyId]
  if (!guidance) return null
  return (
    <div className="sprite-quick-answer" data-sprite-quick-answer>
      <strong>Leveling at a glance</strong>
      <p>{guidance.leveling}</p>
      <small>
        In-match rule · {guidanceSources[guidance.levelingSource].patch} ·{' '}
        <a href="#sprite-sources">Source notes</a>
      </small>
    </div>
  )
}

/** One acquisition section per family; do not also render the legacy info cards. */
export function SpriteAcquisitionSection({ family }: Readonly<{ family: SpriteFamily }>) {
  const guidance = spriteGuidance[family.id]
  return (
    <section className="sprite-detail-section sprite-practical-guide" data-sprite-acquisition>
      <p className="sprite-section-eyebrow">ACQUISITION</p>
      <h2>How to get {family.name}</h2>
      <p>{guidance ? generalAcquisitionRule : family.acquisitionHint}</p>
      {guidance?.unlock ? (
        <div className="sprite-rule-note">
          <h3>Known unlock: Cheat Master {family.name}</h3>
          <p>{guidance.unlock}</p>
          {guidance.unlockSource ? (
            <small>
              {guidanceSources[guidance.unlockSource].patch} ·{' '}
              <a href="#sprite-sources">Source notes</a>
            </small>
          ) : null}
        </div>
      ) : null}
      <h3>Where to find {family.name}</h3>
      {guidance ? (
        <p>
          We have not verified a permanent coordinate or a guaranteed Base / Gold drop for{' '}
          {family.name}. Check the finish shown in-game before marking it: owning one finish does
          not fill the other slots.
        </p>
      ) : (
        <p>{family.locationHint}</p>
      )}
      <a href="/locations">See all current Sprite location guidance →</a>
    </section>
  )
}

export function SpriteGuidanceSections({
  familyId,
  name,
}: Readonly<{ familyId: string; name: string }>) {
  const guidance = spriteGuidance[familyId]
  if (!guidance) return null
  return (
    <section className="sprite-detail-section sprite-practical-guide" data-sprite-practical-guide>
      <p className="sprite-section-eyebrow">PLAN YOUR NEXT MATCH</p>
      <h2>Leveling and mastering {name}</h2>
      <p>{guidance.task}</p>
      <div className="sprite-rule-note">
        <h3>Collection XP and the final extraction</h3>
        <p>{collectionMasteryRule}</p>
        <small>
          Collection-level update: v42.10. This is distinct from the in-match rule above; follow the
          current in-game progress indicator for the entry you are using.
        </small>
      </div>
      <h3>Record the result, not the attempt</h3>
      <p>
        Use Owned after the entry is in your collection, and Mastered after you have completed its
        mastery in-game. These buttons record your own progress; they do not unlock Sprites or
        connect to Epic.
      </p>
      <a href="/guides/how-to-master-sprites">Read the shared mastery and extraction guide →</a>
    </section>
  )
}

export function SpriteGuidanceSources({ familyId }: Readonly<{ familyId: string }>) {
  const guidance = spriteGuidance[familyId]
  if (!guidance) return null
  return (
    // biome-ignore lint/correctness/useUniqueElementIds: Stable source-note anchor for same-page guidance links.
    <section
      className="sprite-detail-section sprite-sources"
      id="sprite-sources"
      aria-label="Sources and scope"
    >
      <h2>Sources and scope</h2>
      <p>
        Rule notes checked <time dateTime={guidanceCheckedAt}>{guidanceCheckedAt}</time>. This is a
        review of the cited patch notes, not a new verification of every released finish or game
        mode.
      </p>
      {Object.entries(guidanceSources).map(([id, source]) => (
        <p key={id}>
          <a href={source.url} rel="noreferrer">
            {source.title}
          </a>
          <br />
          <small>{source.section}</small>
        </p>
      ))}
    </section>
  )
}
