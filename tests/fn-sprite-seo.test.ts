import { describe, expect, it } from 'vitest'
import { pageHead } from '@/lib/seo'
import { site } from '@/lib/site'
import { validateToolSeoBrief } from '@/lib/tool-seo-brief'
import { toolSeoBrief } from '@/modules/tool-seo-brief'

describe('FN Sprite Hub SEO contracts', () => {
  it('uses a ready English-first SEO brief', () => {
    expect(validateToolSeoBrief(toolSeoBrief)).toEqual([])
    expect(toolSeoBrief.primaryKeyword).toBe('fortnite sprite tracker')
    expect(toolSeoBrief.locales).toEqual(['en'])
  })

  it('appends the brand exactly once', () => {
    const head = pageHead({
      title: 'Fortnite Sprite Tracker 2026',
      description: 'Current Fortnite Sprite Tracker.',
      path: '/',
    })
    const title = head.meta.find((item) => 'title' in item)?.title
    expect(title).toBe(`Fortnite Sprite Tracker 2026 · ${site.name}`)
    expect(title?.match(/FN Sprite Hub/g)?.length).toBe(1)
  })
})
