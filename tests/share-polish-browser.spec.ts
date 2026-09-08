import { expect, test } from '@playwright/test'

test('Share Studio uses deterministic local fonts and fixed social-card dimensions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  await page.getByRole('button', { name: 'Share Collection' }).click()

  const preview = page.locator('[data-share-preview]')
  await expect(preview).toBeVisible({ timeout: 15_000 })

  expect(
    await page.evaluate(() => ({
      inter: document.fonts.check('800 74px "Inter Variable"'),
      mono: document.fonts.check('500 24px "DM Mono"'),
    })),
  ).toEqual({ inter: true, mono: true })

  expect(
    await preview.evaluate((image: HTMLImageElement) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    })),
  ).toEqual({ width: 1080, height: 1350 })

  await page.getByRole('button', { name: /^My Collection/ }).click()
  await expect(preview).toBeVisible({ timeout: 15_000 })

  // The final card must remain readable at the intended 360px-wide social preview scale.
  await preview.evaluate((image: HTMLImageElement) => {
    image.style.width = '360px'
    image.style.height = '450px'
    image.style.maxWidth = 'none'
  })
  const box = await preview.boundingBox()
  expect(box?.width).toBeCloseTo(360, 0)
  expect(box?.height).toBeCloseTo(450, 0)

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
