import type { SpriteFinishKind, SpriteRarity } from '@/data/sprites'

export type StatusFilter = 'all' | 'missing' | 'owned' | 'mastered'
export type SortMode = 'name' | 'rarity-high' | 'completion-low'

type Props = {
  query: string
  status: StatusFilter
  rarity: 'all' | SpriteRarity
  finish: 'all' | SpriteFinishKind
  sort: SortMode
  onQueryChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
  onRarityChange: (value: 'all' | SpriteRarity) => void
  onFinishChange: (value: 'all' | SpriteFinishKind) => void
  onSortChange: (value: SortMode) => void
}

const statuses: StatusFilter[] = ['all', 'missing', 'owned', 'mastered']

export function SpriteFilters(props: Readonly<Props>) {
  return (
    <div className="sprite-toolbar" data-sprite-search>
      <label className="sprite-search">
        <span className="sr-only">Search Sprites</span>
        <span aria-hidden="true">⌕</span>
        <input
          onChange={(event) => props.onQueryChange(event.target.value)}
          placeholder="Search sprites..."
          type="search"
          value={props.query}
        />
      </label>

      <fieldset className="sprite-status-segment" data-sprite-status-filter>
        <legend className="sr-only">Collection status</legend>
        {statuses.map((status) => (
          <button
            aria-pressed={props.status === status}
            className={props.status === status ? 'active' : undefined}
            key={status}
            onClick={() => props.onStatusChange(status)}
            type="button"
          >
            {status[0]?.toUpperCase()}
            {status.slice(1)}
          </button>
        ))}
      </fieldset>

      <div className="sprite-filter-selects">
        <label>
          <span className="sr-only">Rarity</span>
          <select
            onChange={(event) => props.onRarityChange(event.target.value as Props['rarity'])}
            value={props.rarity}
          >
            <option value="all">All rarities</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
            <option value="Mythic">Mythic</option>
          </select>
        </label>

        <label>
          <span className="sr-only">Variant</span>
          <select
            onChange={(event) => props.onFinishChange(event.target.value as Props['finish'])}
            value={props.finish}
          >
            <option value="all">All variants</option>
            <option value="normal">Base</option>
            <option value="gold">Gold</option>
            <option value="cheat-master">Cheat Master</option>
            <option value="loot-hacker">Loot Hacker</option>
          </select>
        </label>

        <label>
          <span className="sr-only">Sort</span>
          <select
            onChange={(event) => props.onSortChange(event.target.value as SortMode)}
            value={props.sort}
          >
            <option value="name">Name A–Z</option>
            <option value="rarity-high">Rarity high → low</option>
            <option value="completion-low">Least complete</option>
          </select>
        </label>
      </div>
    </div>
  )
}
