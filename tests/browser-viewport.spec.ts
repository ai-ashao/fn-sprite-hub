import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const

for (const viewport of viewports) {
  test(`FN Sprite Hub homepage at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/')

    await expect(page.locator('[data-sprite-tracker-home]')).toBeVisible()
    await expect(page.locator('[data-sprite-hero]')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Fortnite Sprite Tracker 2026',
    )
    await expect(page.locator('[data-sprite-progress]')).toBeVisible()
    await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
    await expect(page.locator('[data-sprite-search]')).toBeVisible()
    await expect(page.locator('[data-sprite-status-filter]')).toBeVisible()
    await expect(page.locator('[data-sprite-gallery]')).toBeVisible()
    await expect(page.locator('[data-sprite-card]')).toHaveCount(16)

    const galleryBox = await page.locator('[data-sprite-gallery]').boundingBox()
    expect(galleryBox).not.toBeNull()
    if (viewport.name === 'desktop') {
      expect(galleryBox?.y ?? Infinity).toBeLessThanOrEqual(viewport.height)
    }

    await page.locator('input[type="search"]').fill('Sonic')
    await expect(page.locator('[data-sprite-card]')).toHaveCount(1)
    await expect(page.getByText('Sonic Sprite', { exact: true }).first()).toBeVisible()

    await page.locator('input[type="search"]').fill('')
    const firstEntry = page
      .locator('[data-sprite-card]')
      .first()
      .locator('.sprite-entry-chip')
      .first()
    await firstEntry.click()
    await expect(firstEntry).toHaveAttribute('data-entry-state', 'owned')
    await firstEntry.click()
    await expect(firstEntry).toHaveAttribute('data-entry-state', 'mastered')

    await page.reload()
    const restoredFirstEntry = page
      .locator('[data-sprite-card]')
      .first()
      .locator('.sprite-entry-chip')
      .first()
    await expect(restoredFirstEntry).toHaveAttribute('data-entry-state', 'mastered')

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    )
  })
}

test('canonical trailing slash redirects', async ({ page }) => {
  const response = await page.goto('/checklist/')
  expect(response?.status()).toBe(200)
  expect(new URL(page.url()).pathname).toBe('/checklist')
})

test('Phase A Chinese starter route does not stay indexable', async ({ page }) => {
  await page.goto('/zh')
  expect(new URL(page.url()).pathname).toBe('/')
})
