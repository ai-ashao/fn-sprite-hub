export type TrackerState = {
  query: string
  status: 'all' | 'missing' | 'owned' | 'mastered'
  rarity: 'all' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic'
  finish: 'all' | 'normal' | 'gold' | 'cheat-master' | 'loot-hacker'
  sort: 'name' | 'rarity-high' | 'completion-low'
  view: 'gallery' | 'matrix'
}
export const defaultTrackerState: TrackerState = {
  query: '',
  status: 'all',
  rarity: 'all',
  finish: 'all',
  sort: 'name',
  view: 'gallery',
}
export const trackerContextKey = 'fn-sprite-hub:tracker-context:v1'
export type TrackerContext = {
  state: TrackerState
  scrollY: number
  familyId: string | null
  timestamp: number
}
const member = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback
export function sanitizeTrackerState(raw: unknown): TrackerState {
  if (!raw || typeof raw !== 'object') return { ...defaultTrackerState }
  const value = raw as Partial<TrackerState>
  return {
    query: typeof value.query === 'string' ? value.query.slice(0, 100) : '',
    status: member(value.status, ['all', 'missing', 'owned', 'mastered'], 'all'),
    rarity: member(value.rarity, ['all', 'Rare', 'Epic', 'Legendary', 'Mythic'], 'all'),
    finish: member(value.finish, ['all', 'normal', 'gold', 'cheat-master', 'loot-hacker'], 'all'),
    sort: member(value.sort, ['name', 'rarity-high', 'completion-low'], 'name'),
    view: member(value.view, ['gallery', 'matrix'], 'gallery'),
  }
}
export function readTrackerContext(
  storage: () => Pick<Storage, 'getItem'>,
  familyIds: readonly string[],
): TrackerContext | null {
  try {
    const raw = JSON.parse(
      storage().getItem(trackerContextKey) ?? 'null',
    ) as Partial<TrackerContext> | null
    if (
      !raw ||
      typeof raw.timestamp !== 'number' ||
      raw.timestamp > Date.now() + 60_000 ||
      Date.now() - raw.timestamp > 12 * 60 * 60 * 1000
    )
      return null
    return {
      state: sanitizeTrackerState(raw.state),
      scrollY:
        typeof raw.scrollY === 'number' && Number.isFinite(raw.scrollY)
          ? Math.max(0, Math.min(raw.scrollY, 100_000))
          : 0,
      familyId:
        typeof raw.familyId === 'string' && familyIds.includes(raw.familyId) ? raw.familyId : null,
      timestamp: raw.timestamp,
    }
  } catch {
    return null
  }
}
export function writeTrackerContext(
  storage: () => Pick<Storage, 'setItem'>,
  context: TrackerContext,
): boolean {
  try {
    storage().setItem(
      trackerContextKey,
      JSON.stringify({ ...context, state: sanitizeTrackerState(context.state) }),
    )
    return true
  } catch {
    return false
  }
}
export function trackerIntent(
  search: string,
  familyIds: readonly string[],
): { focus: string | null; resume: boolean; invalid: boolean } {
  const params = new URLSearchParams(search)
  const value = params.get('focus')
  if (value !== null)
    return familyIds.includes(value)
      ? { focus: value, resume: false, invalid: false }
      : { focus: null, resume: false, invalid: true }
  return { focus: null, resume: params.get('resume') === '1', invalid: false }
}
