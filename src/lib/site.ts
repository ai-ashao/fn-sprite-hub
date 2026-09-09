import { publicEnv } from './config/env'
import { productConfig } from './product-config'

export const site = {
  name: productConfig.brand.name,
  url: publicEnv.siteUrl,
  description: productConfig.brand.description,
}

export const epicFanContentDisclaimer =
  'Portions of the materials used are trademarks and/or copyrighted works of Epic Games, Inc. All rights reserved by Epic. This material is not official and is not endorsed by Epic.'

export function absoluteUrl(path = '/') {
  return new URL(path, site.url).toString()
}
