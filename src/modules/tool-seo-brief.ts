import type { ToolSeoBrief } from '@/lib/tool-seo-brief'

/**
 * Temporary brief for the unchanged ShipLean Tool homepage.
 * Replace this together with the homepage when FN Sprite Hub implementation begins.
 */
export const toolSeoBrief = {
  status: 'ready',
  primaryKeyword: 'text length checker',
  localizedPrimaryKeywords: {
    'zh-CN': '文本长度统计',
  },
  searchIntent: 'tool',
  primaryPage: '/',
  supportingKeywords: ['character counter', 'word counter'],
  firstBatchPages: [
    { keyword: 'text length checker', path: '/', pageType: 'tool', locale: 'en' },
    { keyword: '文本长度统计', path: '/zh', pageType: 'tool', locale: 'zh-CN' },
  ],
  locales: ['en', 'zh-CN'],
  evidence: [
    {
      source: 'Public web search reviewed 2026-09-07',
      note: 'Results consistently expose browser tools for character and word counting.',
    },
  ],
} satisfies ToolSeoBrief
