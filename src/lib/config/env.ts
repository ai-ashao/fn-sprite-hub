export type PublicEnv = {
  siteUrl: string
  ga4Id?: string
  googleSiteVerification?: string
}

export const defaultSiteUrl = 'https://fnspritehub.com'

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const rawSiteUrl = source.VITE_SITE_URL?.trim() || defaultSiteUrl
  let siteUrl: string

  try {
    const url = new URL(rawSiteUrl)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('unsupported protocol')
    }
    siteUrl = url.toString().replace(/\/$/, '')
  } catch {
    throw new Error('VITE_SITE_URL must be an absolute http(s) URL.')
  }

  const ga4Id = source.VITE_GA4_ID?.trim() || undefined
  if (ga4Id && !/^G-[A-Z0-9]+$/.test(ga4Id)) {
    throw new Error('VITE_GA4_ID must look like G-XXXXXXXXXX.')
  }

  return {
    siteUrl,
    ga4Id,
    googleSiteVerification: source.VITE_GOOGLE_SITE_VERIFICATION?.trim() || undefined,
  }
}

export function validateProductionSiteUrl(siteUrl: string): string[] {
  const issues: string[] = []
  const url = new URL(siteUrl)

  if (url.protocol !== 'https:') issues.push('Production site URL must use HTTPS.')
  if (['localhost', '127.0.0.1'].includes(url.hostname)) {
    issues.push('Production site URL must not use localhost.')
  }
  if (['shiplean.dev', 'starter.invalid'].includes(url.hostname)) {
    issues.push(`Production site URL must not use starter host: ${url.hostname}`)
  }

  return issues
}

export const publicEnv = parsePublicEnv(import.meta.env)

if (import.meta.env.PROD) {
  const issues = validateProductionSiteUrl(publicEnv.siteUrl)
  if (issues.length > 0) {
    throw new Error(`Invalid FN Sprite Hub production site URL: ${issues.join(' ')}`)
  }
}
