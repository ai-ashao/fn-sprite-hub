import { readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

const publicPath = (...parts: string[]) => path.join(process.cwd(), 'public', ...parts)

describe('FN Sprite Hub favicon assets', () => {
  it('registers the browser, Apple and PWA icons in the shared document head', () => {
    const rootRoute = readFileSync(path.join(process.cwd(), 'src/routes/__root.tsx'), 'utf8')

    for (const href of [
      '/favicon.ico',
      '/favicon.svg',
      '/favicon-32x32.png',
      '/favicon-16x16.png',
      '/apple-touch-icon.png',
      '/site.webmanifest',
    ]) {
      expect(rootRoute).toContain(`href: '${href}'`)
    }
  })

  it.each([
    ['favicon-16x16.png', 16, 16],
    ['favicon-32x32.png', 32, 32],
    ['favicon-48x48.png', 48, 48],
    ['apple-touch-icon.png', 180, 180],
    ['android-chrome-192x192.png', 192, 192],
    ['android-chrome-512x512.png', 512, 512],
  ])('keeps %s at its declared dimensions', async (file, width, height) => {
    const metadata = await sharp(publicPath(file)).metadata()
    expect(metadata).toMatchObject({ format: 'png', width, height })
  })

  it('keeps the web manifest aligned with the shipped Android icons', () => {
    const manifest = JSON.parse(readFileSync(publicPath('site.webmanifest'), 'utf8')) as {
      name: string
      short_name: string
      icons: Array<{ src: string; sizes: string; type: string }>
    }

    expect(manifest.name).toBe('FN Sprite Hub')
    expect(manifest.short_name).toBe('FN Sprite Hub')
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        }),
        expect.objectContaining({
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        }),
      ]),
    )
  })
})
