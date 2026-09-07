import { entriesForFamily, rarityRank, type SpriteFamily, spriteFamilies } from '@/data/sprites'
import type { EntryState } from '@/lib/sprites/collection'
import { SpriteCard } from './sprite-card'
import type { SortMode, StatusFilter } from './sprite-filters'

type Props = {
  query: string
  status: StatusFilter
  rarity: string
  finish: string
  sort: SortMode
  getEntryState: (entryId: string) => EntryState
  onCycleEntry: (entryId: string) => void
  onOpen: (familyId: string) => void
}

function familyMatchesStatus(
  family: SpriteFamily,
  status: StatusFilter,
  getEntryState: Props['getEntryState'],
) {
  if (status === 'all') return true
  const states = entriesForFamily(family.id).map((entry) => getEntryState(entry.id))
  if (status === 'missing') return states.some((state) => state === 'missing')
  if (status === 'owned') return states.some((state) => state === 'owned' || state === 'mastered')
  return states.some((state) => state === 'mastered')
}

export function SpriteGallery(props: Readonly<Props>) {
  const query = props.query.trim().toLowerCase()

  const families = [...spriteFamilies]
    .filter((family) => !query || family.name.toLowerCase().includes(query))
    .filter((family) => props.rarity === 'all' || family.rarity === props.rarity)
    .filter((family) => {
      if (props.finish === 'all') return true
      return entriesForFamily(family.id).some((entry) => entry.finish === props.finish)
    })
    .filter((family) => familyMatchesStatus(family, props.status, props.getEntryState))
    .sort((left, right) => {
      if (props.sort === 'rarity-high') {
        return (
          rarityRank[right.rarity] - rarityRank[left.rarity] || left.name.localeCompare(right.name)
        )
      }
      if (props.sort === 'completion-low') {
        const completion = (family: SpriteFamily) => {
          const entries = entriesForFamily(family.id)
          const owned = entries.filter(
            (entry) => props.getEntryState(entry.id) !== 'missing',
          ).length
          return entries.length ? owned / entries.length : 0
        }
        return completion(left) - completion(right) || left.name.localeCompare(right.name)
      }
      return left.name.localeCompare(right.name)
    })

  return (
    <>
      <div className="sprite-viewbar">
        <div>
          <strong>{families.length} Sprite families</strong>
          <span> · current season</span>
        </div>
      </div>

      {families.length ? (
        <div className="sprite-gallery" data-sprite-gallery>
          {families.map((family) => (
            <SpriteCard
              entries={entriesForFamily(family.id)}
              family={family}
              getEntryState={props.getEntryState}
              key={family.id}
              onCycleEntry={props.onCycleEntry}
              onOpen={props.onOpen}
            />
          ))}
        </div>
      ) : (
        <div className="sprite-empty-state">
          <strong>No Sprites match these filters.</strong>
          <span>Clear a filter or try another search.</span>
        </div>
      )}
    </>
  )
}
