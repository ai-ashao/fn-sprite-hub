export type ShareAnalyticsEvent =
  | 'share_header_click'
  | 'share_collection_click'
  | 'share_image_generated'
  | 'share_native_open'
  | 'share_image_download'

type ShareAnalyticsParams = Readonly<Record<string, string | number | boolean | null | undefined>>

export function trackShareEvent(name: ShareAnalyticsEvent, params: ShareAnalyticsParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
