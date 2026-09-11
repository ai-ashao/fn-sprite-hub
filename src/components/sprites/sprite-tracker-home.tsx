import { useMemo } from 'react'
import { currentFamilyCount, currentReleasedEntryCount, currentSeason } from '@/data/sprites'
import { useSpriteCollection } from '@/lib/sprites/collection'
import { useTrackerWorkspace } from '@/lib/sprites/tracker-workspace'
import { CollectionNotice } from './collection-notice'
import { CollectionProgress } from './collection-progress'
import { CollectionTools } from './collection-tools'
import { HeroSpriteCluster } from './hero-sprite-cluster'
import { SpriteFilters } from './sprite-filters'
import { SpriteGallery } from './sprite-gallery'
import { SpriteMatrix } from './sprite-matrix'

const faqItems = [
  [
    'Is this Fortnite Sprite Tracker free?',
    'Yes. FN Sprite Hub is free to use and your collection is saved in your browser without requiring an account.',
  ],
  [
    'What counts toward the Season 4 total?',
    'Only released collectible entries count toward the current completion denominator. Unreleased entries stay out until verified live.',
  ],
  [
    'What does Mastered mean?',
    'Use Mastered for a Sprite entry you have fully leveled and extracted in-game. The tracker records your own status and does not connect to your Epic account.',
  ],
] as const

export function SpriteTrackerHome() {
  const collection = useSpriteCollection()
  const {
    query,
    setQuery,
    status,
    setStatus,
    rarity,
    setRarity,
    finish,
    setFinish,
    sort,
    setSort,
    view,
    setView,
    returnMessage,
    rememberNavigation,
  } = useTrackerWorkspace()

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${currentSeason.lastVerifiedAt}T00:00:00Z`)),
    [],
  )

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'FN Sprite Hub',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    url: 'https://fnspritehub.com/',
    description:
      'Free Fortnite Sprite Tracker for tracking Owned, Missing and Mastered Sprite entries in your browser.',
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
    dateModified: currentSeason.lastVerifiedAt,
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }

  return (
    <div className="sprite-site" data-product-mode-home="tool" data-sprite-tracker-home>
      <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      <section className="sprite-hero" data-sprite-hero>
        <div className="sprite-container sprite-hero-grid">
          <div className="sprite-hero-copy">
            <p className="sprite-kicker">Chapter 7 Season 4 · Current</p>
            <h1 data-sprite-title>
              Fortnite Sprite Tracker <span>2026</span>
            </h1>
            <p className="sprite-hero-description">
              Track every Fortnite Sprite and released entry. Mark what you own, find what you are
              missing, and save your collection locally in your browser.
            </p>
            {collection.mounted && collection.metrics.owned > 0 ? (
              <a className="sprite-continue-link" href="#collection">
                Continue tracking your collection ↓
              </a>
            ) : null}
            <div className="sprite-meta-row">
              <span className="current">✓ Updated {dateLabel}</span>
              <span>Patch {currentSeason.patch}</span>
              <span>
                {currentFamilyCount} Sprite families · {currentReleasedEntryCount} entries
              </span>
            </div>
          </div>
          <HeroSpriteCluster />
        </div>
      </section>

      {/* biome-ignore lint/correctness/useUniqueElementIds: Stable deep-link target shared by tracker links. */}
      <section
        className="sprite-container sprite-collection-shell"
        id="collection"
        onClickCapture={rememberNavigation}
      >
        <header className="sprite-collection-head">
          <div>
            <h2>Your Sprite Collection</h2>
            <p>
              Tap a variant to cycle Missing → Owned → Mastered. Open a Sprite image or name for its
              full page.
            </p>
          </div>
          <CollectionProgress
            collectionPercent={collection.metrics.collectionPercent}
            mastered={collection.metrics.mastered}
            masteryPercent={collection.metrics.masteryPercent}
            mounted={collection.mounted}
            owned={collection.metrics.owned}
            total={collection.metrics.total}
          />
        </header>

        <CollectionNotice />
        {returnMessage ? <output className="sprite-return-message">{returnMessage}</output> : null}
        <SpriteFilters
          finish={finish}
          onFinishChange={setFinish}
          onQueryChange={setQuery}
          onRarityChange={setRarity}
          onSortChange={setSort}
          onStatusChange={setStatus}
          query={query}
          rarity={rarity}
          sort={sort}
          status={status}
        />

        <fieldset className="sprite-view-switch">
          <legend className="sr-only">Collection view</legend>
          <button
            aria-pressed={view === 'gallery'}
            onClick={() => setView('gallery')}
            type="button"
          >
            Gallery
          </button>
          <button aria-pressed={view === 'matrix'} onClick={() => setView('matrix')} type="button">
            Matrix
          </button>
        </fieldset>

        {view === 'gallery' ? (
          <SpriteGallery
            finish={finish}
            getEntryState={collection.getEntryState}
            onCycleEntry={collection.cycleEntry}
            query={query}
            rarity={rarity}
            sort={sort}
            status={status}
          />
        ) : (
          <SpriteMatrix
            finish={finish}
            getEntryState={collection.getEntryState}
            onCycleEntry={collection.cycleEntry}
            query={query}
            rarity={rarity}
            sort={sort}
            status={status}
          />
        )}

        <CollectionTools collection={collection.collection} showNotice={false} />

        <div className="sprite-collection-actions">
          <span>Progress is stored only in this browser.</span>
          <button
            onClick={async () => {
              const token = collection.confirmation()
              if (
                window.confirm(
                  'Reset your current-season Sprite collection? A previous snapshot will be protected.',
                )
              ) {
                await collection.reset(token)
              }
            }}
            type="button"
          >
            Reset collection
          </button>
        </div>
      </section>

      <section className="sprite-container sprite-supporting-grid">
        <a href="/checklist">
          <small>FAST VIEW</small>
          <h2>Fortnite Sprite Checklist</h2>
          <p>
            Use a compact list when you want to mark the current {currentReleasedEntryCount}{' '}
            released entries quickly.
          </p>
        </a>
        <a href="/sprites">
          <small>DATABASE</small>
          <h2>All Current Sprites</h2>
          <p>Browse every Season 4 Sprite family, rarity, ability and verified release status.</p>
        </a>
        <a href="/variants">
          <small>VARIANTS</small>
          <h2>Gold, Cheat Master & Loot Hacker</h2>
          <p>Understand what each finish means and which current entries are actually released.</p>
        </a>
        <a href="/locations">
          <small>GUIDE</small>
          <h2>Sprite Locations & How to Find Them</h2>
          <p>
            Use current-season acquisition guidance instead of outdated fixed-location assumptions.
          </p>
        </a>
        <a href="/rarity">
          <small>RARITY</small>
          <h2>Sprite Rarity Guide</h2>
          <p>
            Compare Rare, Epic, Legendary and Mythic Sprite families in one current-season view.
          </p>
        </a>
        <a href="/rarest-sprites">
          <small>RANKING</small>
          <h2>Rarest Current Sprites</h2>
          <p>See the current rarity ranking without mixing in unreleased or past-season entries.</p>
        </a>
        <a href="/new-sprites">
          <small>FRESHNESS</small>
          <h2>New Fortnite Sprites</h2>
          <p>Review recently added families and the patch snapshot used by the tracker.</p>
        </a>
        <a href="/guides/how-to-master-sprites">
          <small>MASTERY</small>
          <h2>How to Master Sprites</h2>
          <p>Learn when an entry should move from Owned to Mastered in your local checklist.</p>
        </a>
      </section>

      <section className="sprite-container sprite-faq">
        <p className="sprite-section-eyebrow">TRACKER FAQ</p>
        <h2>How the Fortnite Sprite Tracker works</h2>
        <div>
          {faqItems.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
