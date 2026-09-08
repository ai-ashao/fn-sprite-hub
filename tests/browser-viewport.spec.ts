import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
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
    if (viewport.name.startsWith('desktop')) {
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

    await page.getByRole('button', { name: 'Matrix' }).click()
    const matrixEntry = page.locator('[data-sprite-matrix] [data-entry-id="8-bit:normal"]')
    await expect(matrixEntry).toHaveAttribute('data-entry-state', 'mastered')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    )
    await matrixEntry.click()
    await expect(matrixEntry).toHaveAttribute('data-entry-state', 'missing')

    await page.getByRole('button', { name: 'Gallery' }).click()
    await expect(
      page.locator('[data-sprite-card]').first().locator('.sprite-entry-chip').first(),
    ).toHaveAttribute('data-entry-state', 'missing')

    await expect(page.getByRole('button', { name: 'Download backup' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Restore backup' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy for Discord' })).toBeVisible()

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

test('Sprite detail exposes honest per-entry artwork state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/sprites/jonesy')

  const entries = page.locator('.sprite-detail-entries button')
  await expect(entries).toHaveCount(3)
  await expect(
    page.locator('.sprite-detail-entries button[data-image-mode="family-fallback"]'),
  ).toHaveCount(3)
  await expect(entries.getByRole('img')).toHaveCount(3)
  await expect(entries).toContainText(['Base', 'Gold', 'Cheat Master'])

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  )
})

test('backup, restore and Discord copy work without login', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')

  const fileInput = page.locator('input[type="file"]')
  const validBackup = {
    schemaVersion: 1,
    seasonId: 'c7s4',
    ownedEntryIds: ['8-bit:normal'],
    masteredEntryIds: [],
    updatedAt: '2026-09-08T00:00:00.000Z',
  }
  await fileInput.setInputFiles({
    name: 'collection.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(validBackup)),
  })
  await expect(page.getByText('Collection restored from backup.')).toBeVisible()
  await expect(
    page.locator('[data-sprite-card]').first().locator('.sprite-entry-chip').first(),
  ).toHaveAttribute('data-entry-state', 'owned')

  await fileInput.setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...validBackup, ownedEntryIds: ['unknown:normal'] })),
  })
  await expect(page.getByText('Unknown Sprite entry ID: unknown:normal')).toBeVisible()
  await expect(
    page.locator('[data-sprite-card]').first().locator('.sprite-entry-chip').first(),
  ).toHaveAttribute('data-entry-state', 'owned')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download backup' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('fn-sprite-hub-c7s4-backup.json')

  await page.getByRole('button', { name: 'Copy for Discord' }).click()
  await expect(page.getByText('Discord summary copied.')).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Collected: 1/47')
})

test('Phase A Chinese starter route does not stay indexable', async ({ page }) => {
  await page.goto('/zh')
  expect(new URL(page.url()).pathname).toBe('/')
})
