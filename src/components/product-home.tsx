import type { Locale } from '@/i18n/config'
import { localizedPageHead } from '@/lib/seo'
import { ToolStarterHome, toolStarterConfig } from './tool-starter-home'

export function ProductHome({ locale }: Readonly<{ locale: Locale }>) {
  return <ToolStarterHome locale={locale} />
}

export function productHomeHead(locale: Locale) {
  const config = toolStarterConfig(locale)
  return localizedPageHead({
    pageId: 'home',
    locale,
    title: config.seo.title,
    description: config.seo.description,
    socialImage: config.seo.socialImage,
  })
}
