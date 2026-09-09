import { publicEnv } from './config/env'
import { productConfig } from './product-config'

export const site = {
  name: productConfig.brand.name,
  url: publicEnv.siteUrl,
  description: productConfig.brand.description,
  // Temporary launch hold: keep the public site crawlable so search engines can read noindex.
  indexingEnabled: false,
}

export function absoluteUrl(path = '/') {
  return new URL(path, site.url).toString()
}
