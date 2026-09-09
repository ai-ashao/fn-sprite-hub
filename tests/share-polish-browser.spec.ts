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

test('Gallery artwork opens the full Sprite page while variant controls stay inline', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')

  const firstCard = page.locator('[data-sprite-card]').first()
  const detailLink = firstCard.getByRole('link', { name: /View .* Sprite details/ })
  await expect(detailLink).toHaveAttribute('href', /^\/sprites\/.+/)

  const variantTiles = firstCard.locator('.sprite-variant-tile')
  await expect(variantTiles).toHaveCount(3)
  await expect(variantTiles.locator('img')).toHaveCount(3)

  const firstVariant = variantTiles.first()
  await firstVariant.click()
  await expect(firstVariant).toHaveAttribute('data-entry-state', 'owned')

  const href = await detailLink.getAttribute('href')
  await detailLink.click()
  expect(new URL(page.url()).pathname).toBe(href)
  await expect(page.locator('.sprite-detail-stats')).toBeVisible()
  await expect(page.locator('.sprite-detail-entries [data-entry-id]')).toHaveCount(3)
})

test('Tracker filters can be reset without reloading the page', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')

  await page.getByRole('searchbox', { name: 'Search Sprites' }).fill('Sonic')
  await expect(page.locator('[data-sprite-card]')).toHaveCount(1)

  await page.getByRole('combobox', { name: 'Filter by rarity' }).selectOption('Epic')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()

  await expect(page.getByRole('searchbox', { name: 'Search Sprites' })).toHaveValue('')
  await expect(page.getByRole('combobox', { name: 'Filter by rarity' })).toHaveValue('all')
  await expect(page.locator('[data-sprite-card]')).toHaveCount(16)
})

test('Polished Sprite detail keeps collection state interactive on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/sprites/jonesy')
  await expect(page.locator('[data-collection-mounted]')).toHaveAttribute(
    'data-collection-mounted',
    'true',
  )

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jonesy Sprite in Fortnite')
  await expect(page.locator('.sprite-detail-stats')).toBeVisible()

  const firstVariant = page.locator('.sprite-detail-entries [data-entry-id]').first()
  await expect(firstVariant).toHaveAttribute('data-entry-state', 'missing')
  await firstVariant.click()
  await expect(firstVariant).toHaveAttribute('data-entry-state', 'owned')

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
