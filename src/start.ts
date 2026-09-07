import { createMiddleware, createStart } from '@tanstack/react-start'

const canonicalPath = createMiddleware({ type: 'request' }).server(async ({ next, request }) => {
  const url = new URL(request.url)
  const pathname = url.pathname
  const lastSegment = pathname.split('/').filter(Boolean).at(-1) || ''
  const looksLikeFile = lastSegment.includes('.')
  const isApi = pathname.startsWith('/api/')

  if (
    ['GET', 'HEAD'].includes(request.method) &&
    pathname.length > 1 &&
    pathname.endsWith('/') &&
    !looksLikeFile &&
    !isApi
  ) {
    url.pathname = pathname.replace(/\/+$/, '')
    return new Response(null, {
      status: 308,
      headers: { location: url.toString() },
    })
  }

  return next()
})

const securityHeaders = createMiddleware({ type: 'request' }).server(async ({ next }) => {
  const result = await next()
  const headers = new Headers(result.response.headers)
  headers.set(
    'content-security-policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
      "connect-src 'self' https://www.google-analytics.com",
    ].join('; '),
  )
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()')
  headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  headers.set('x-content-type-options', 'nosniff')
  headers.set('x-frame-options', 'DENY')

  return {
    ...result,
    response: new Response(result.response.body, {
      status: result.response.status,
      statusText: result.response.statusText,
      headers,
    }),
  }
})

export const startInstance = createStart(() => ({
  requestMiddleware: [canonicalPath, securityHeaders],
}))
