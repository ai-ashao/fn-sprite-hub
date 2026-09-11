import { useEffect, useState } from 'react'
import { spriteFamilies } from '@/data/sprites'
import { readTrackerContext } from '@/lib/sprites/tracker-context'

export function TrackerLinks({ familyId }: Readonly<{ familyId: string }>) {
  const [hasReturn, setHasReturn] = useState(false)
  const known = spriteFamilies.some(({ id }) => id === familyId)
  useEffect(() => {
    const context = readTrackerContext(
      () => window.sessionStorage,
      spriteFamilies.map(({ id }) => id),
    )
    setHasReturn(context?.familyId === familyId)
  }, [familyId])
  return (
    <div className="sprite-detail-actions">
      <a
        className="sprite-primary-link"
        href={known ? `/?focus=${encodeURIComponent(familyId)}#collection` : '/'}
      >
        Open tracker
      </a>
      {hasReturn ? (
        <a className="sprite-secondary-link" href="/?resume=1#collection">
          Return to my filtered list
        </a>
      ) : null}
      <a className="sprite-secondary-link" href="/sprites">
        Browse all Sprites
      </a>
    </div>
  )
}
