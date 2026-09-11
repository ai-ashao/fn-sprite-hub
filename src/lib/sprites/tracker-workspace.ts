import { type MouseEvent, useEffect, useRef, useState } from 'react'
import { spriteFamilies } from '@/data/sprites'
import {
  defaultTrackerState,
  readTrackerContext,
  type TrackerState,
  trackerIntent,
  writeTrackerContext,
} from './tracker-context'

const familyIds = spriteFamilies.map(({ id }) => id)

/** Personal view state is restored after hydration, never placed in the public page registry. */
export function useTrackerWorkspace() {
  const [state, setState] = useState<TrackerState>({ ...defaultTrackerState })
  const [ready, setReady] = useState(false)
  const [returnMessage, setReturnMessage] = useState('')
  const latest = useRef(state)
  latest.current = state

  useEffect(() => {
    const intent = trackerIntent(window.location.search, familyIds)
    const context = readTrackerContext(() => window.sessionStorage, familyIds)
    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    const isReturn = intent.resume || navigation?.type === 'back_forward'
    let next = { ...defaultTrackerState }
    if (intent.focus) {
      next.query = spriteFamilies.find(({ id }) => id === intent.focus)?.name ?? ''
    } else if (!intent.invalid && context) {
      // Explicit return context wins. A regular visit restores only the preferred view.
      next = isReturn ? context.state : { ...next, view: context.state.view }
      if (isReturn)
        setReturnMessage(
          context.state.status === 'missing'
            ? 'Your Missing filters are restored. Entries updated on a detail page may no longer match.'
            : 'Your previous filters and view are restored.',
        )
    }
    setState(next)
    setReady(true)
    let secondFrame = 0
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (intent.focus)
          document
            .getElementById('collection')
            ?.scrollIntoView({ behavior: 'instant', block: 'start' })
        else if (isReturn && context && !intent.invalid)
          window.scrollTo({ top: context.scrollY, behavior: 'instant' })
      })
    })
    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    writeTrackerContext(() => window.sessionStorage, {
      state,
      scrollY: window.scrollY,
      familyId: null,
      timestamp: Date.now(),
    })
  }, [ready, state])

  const change =
    <K extends keyof TrackerState>(key: K) =>
    (value: TrackerState[K]) => {
      setState((current) => ({ ...current, [key]: value }))
      setReturnMessage('')
    }

  function rememberNavigation(event: MouseEvent<HTMLElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const link =
      event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
    if (!link) return
    const url = new URL(link.href, window.location.href)
    if (url.origin !== window.location.origin) return
    const family = spriteFamilies.find(({ slug }) => url.pathname === `/sprites/${slug}`)
    if (!family) return
    writeTrackerContext(() => window.sessionStorage, {
      state: latest.current,
      scrollY: window.scrollY,
      familyId: family.id,
      timestamp: Date.now(),
    })
  }

  return {
    ...state,
    returnMessage,
    rememberNavigation,
    setQuery: change('query'),
    setStatus: change('status'),
    setRarity: change('rarity'),
    setFinish: change('finish'),
    setSort: change('sort'),
    setView: change('view'),
  }
}
