type ProgressProps = {
  mounted: boolean
  owned: number
  mastered: number
  total: number
  collectionPercent: number
  masteryPercent: number
}

function ProgressCard({
  label,
  current,
  total,
  percent,
  tone,
  mounted,
}: Readonly<{
  label: string
  current: number
  total: number
  percent: number
  tone: 'moss' | 'sky'
  mounted: boolean
}>) {
  return (
    <article className="sprite-progress-card" data-tone={tone}>
      <div className="sprite-progress-label">{label}</div>
      <div className="sprite-progress-value" aria-live="polite">
        {mounted ? (
          <>
            {current} / {total} <small>{percent}%</small>
          </>
        ) : (
          <span aria-hidden="true" className="sprite-progress-skeleton" />
        )}
      </div>
      <div
        aria-label={mounted ? `${label} ${percent}%` : `${label} loading`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={mounted ? percent : 0}
        className="sprite-progress-bar"
        role="progressbar"
      >
        <span style={{ width: mounted ? `${percent}%` : '0%' }} />
      </div>
    </article>
  )
}

export function CollectionProgress({
  mounted,
  owned,
  mastered,
  total,
  collectionPercent,
  masteryPercent,
}: Readonly<ProgressProps>) {
  return (
    <div className="sprite-progress-row" data-mounted={mounted} data-sprite-progress>
      <ProgressCard
        current={owned}
        label="Collection"
        mounted={mounted}
        percent={collectionPercent}
        tone="moss"
        total={total}
      />
      <ProgressCard
        current={mastered}
        label="Mastery"
        mounted={mounted}
        percent={masteryPercent}
        tone="sky"
        total={total}
      />
    </div>
  )
}
