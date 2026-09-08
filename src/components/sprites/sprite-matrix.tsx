import { entriesForFamily, finishLabel, type SpriteFinishKind } from '@/data/sprites'
import type { EntryState } from '@/lib/sprites/collection'
import { type SpriteSelectionProps, selectSpriteFamilies } from './sprite-gallery'

type Props = SpriteSelectionProps & {
  onCycleEntry: (entryId: string) => void
}

const finishes: readonly SpriteFinishKind[] = ['normal', 'gold', 'cheat-master', 'loot-hacker']

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

export function SpriteMatrix(props: Readonly<Props>) {
  const families = selectSpriteFamilies(props)

  return (
    <div className="sprite-matrix-scroll" data-sprite-matrix>
      <table className="sprite-matrix">
        <caption className="sr-only">
          Current-season Sprite collection matrix. Activate an available entry to cycle Missing,
          Owned and Mastered.
        </caption>
        <thead>
          <tr>
            <th scope="col">Sprite</th>
            {finishes.map((finish) => (
              <th key={finish} scope="col">
                {finishLabel(finish)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {families.map((family) => {
            const entries = entriesForFamily(family.id)
            return (
              <tr key={family.id}>
                <th scope="row">
                  <a href={`/sprites/${family.slug}`}>
                    <img
                      alt=""
                      className="sprite-matrix-image"
                      height={44}
                      src={family.familyImage}
                      width={44}
                    />
                    <span>{family.name}</span>
                  </a>
                </th>
                {finishes.map((finish) => {
                  const entry = entries.find((candidate) => candidate.finish === finish)
                  if (!entry) {
                    return (
                      <td className="sprite-matrix-na" key={finish}>
                        <span>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">
                            {finishLabel(finish)} {family.name}: not available
                          </span>
                        </span>
                      </td>
                    )
                  }

                  const state = props.getEntryState(entry.id)
                  return (
                    <td key={finish}>
                      <button
                        aria-label={`${entry.displayName}: ${statusLabel[state]}. Click to cycle state.`}
                        data-entry-id={entry.id}
                        data-entry-state={state}
                        onClick={() => props.onCycleEntry(entry.id)}
                        type="button"
                      >
                        <span aria-hidden="true">{statusSymbol[state]}</span>
                        <small>{statusLabel[state]}</small>
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {!families.length ? (
        <div className="sprite-empty-state">
          <strong>No Sprites match these filters.</strong>
          <span>Clear a filter or try another search.</span>
        </div>
      ) : null}
    </div>
  )
}
