import type { ToolSeoBrief } from '@/lib/tool-seo-brief'

export const toolSeoBrief = {
  status: 'ready',
  primaryKeyword: 'fortnite sprite tracker',
  searchIntent: 'tool',
  primaryPage: '/',
  supportingKeywords: [
    'fortnite sprite checklist',
    'all fortnite sprites',
    'fortnite sprite variants',
    'fortnite sprite rarity',
    'fortnite sprite locations',
    'rarest sprite in fortnite',
    'new fortnite sprites',
  ],
  firstBatchPages: [
    { keyword: 'fortnite sprite tracker', path: '/', pageType: 'tool', locale: 'en' },
    { keyword: 'fortnite sprite checklist', path: '/checklist', pageType: 'tool', locale: 'en' },
    { keyword: 'all fortnite sprites', path: '/sprites', pageType: 'category', locale: 'en' },
    { keyword: 'fortnite sprite variants', path: '/variants', pageType: 'category', locale: 'en' },
    { keyword: 'fortnite sprite rarity', path: '/rarity', pageType: 'category', locale: 'en' },
    { keyword: 'fortnite sprite locations', path: '/locations', pageType: 'guide', locale: 'en' },
    {
      keyword: 'rarest sprite in fortnite',
      path: '/rarest-sprites',
      pageType: 'guide',
      locale: 'en',
    },
    { keyword: 'new fortnite sprites', path: '/new-sprites', pageType: 'guide', locale: 'en' },
    {
      keyword: 'how to master sprites fortnite',
      path: '/guides/how-to-master-sprites',
      pageType: 'guide',
      locale: 'en',
    },
  ],
  locales: ['en'],
  evidence: [
    {
      source: 'Manual SERP and competitor review, 2026-09-08',
      note: 'Tracker, checklist, database, variants, rarity, locations and freshness intents are represented by dedicated current pages in the SERP.',
    },
    {
      source: 'Fortnite.GG Sprite tracker, reviewed 2026-09-08',
      note: 'Current tracker displays 47 released current-season entries with separate Owned and Mastered state.',
    },
  ],
} satisfies ToolSeoBrief
