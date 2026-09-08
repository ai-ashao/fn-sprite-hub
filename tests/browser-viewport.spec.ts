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

test('Share Studio previews and downloads deterministic multi-page PNGs on mobile', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        ;(window as Window & { __shareCalled?: boolean }).__shareCalled = true
      },
    })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  await page.getByRole('button', { name: 'Share Collection' }).click()

  const studio = page.locator('[data-share-studio]')
  await expect(studio).toBeVisible()
  await expect(page.locator('[data-share-preview]')).toBeVisible()
  await expect
    .poll(() =>
      page
        .locator('[data-share-preview]')
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBe(1080)
  await expect(
    page.getByRole('navigation', { name: 'Preview pages' }).getByRole('button'),
  ).toHaveCount(2)
  expect(
    await page.locator('[data-share-preview]').evaluate((image: HTMLImageElement) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    })),
  ).toEqual({ width: 1080, height: 1350 })
  const firstRenderMs = Number(await studio.locator('output').getAttribute('data-render-ms'))
  expect(firstRenderMs).toBeLessThanOrEqual(2_000)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)

  await page.getByRole('button', { name: /^My Collection/ }).click()
  await expect
    .poll(async () => Number(await studio.locator('output').getAttribute('data-render-ms')))
    .toBeLessThanOrEqual(1_000)
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  expect(
    await page.evaluate(() => (window as Window & { __shareCalled?: boolean }).__shareCalled),
  ).toBe(true)

  await page.getByRole('button', { name: /^Missing Sprites/ }).click()
  await expect(page.getByRole('button', { name: 'Download 2 PNGs' })).toBeEnabled()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download 2 PNGs' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('fn-sprite-hub-missing-1-of-2.png')

  await page.getByRole('button', { name: 'Close Share Studio' }).click()
  await page.goto('/checklist')
  await expect(page.getByRole('button', { name: 'Share Collection' })).toBeVisible()
})

const shareFixtures = [
  { name: 'collection-normal', template: 'My Collection', owned: 20, mastered: 8 },
  { name: 'missing-6', template: 'Missing Sprites', owned: 41, mastered: 8 },
  { name: 'missing-24', template: 'Missing Sprites', owned: 23, mastered: 8 },
  { name: 'missing-47-page-1', template: 'Missing Sprites', owned: 0, mastered: 0 },
  { name: 'unmastered-12', template: 'Need to Master', owned: 12, mastered: 0 },
  { name: 'celebration-complete', template: '100% Celebration', owned: 47, mastered: 8 },
  { name: 'celebration-mastered', template: '100% Celebration', owned: 47, mastered: 47 },
] as const

for (const fixture of shareFixtures) {
  test(`Share Studio visual fixture ${fixture.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
    await page.evaluate(({ owned, mastered }) => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>('[data-entry-id]'))
      const ids = Array.from(
        new Set(buttons.map((button) => button.dataset.entryId).filter(Boolean)),
      )
      window.localStorage.setItem(
        'fn-sprite-hub:collection:v1',
        JSON.stringify({
          schemaVersion: 1,
          seasonId: 'c7s4',
          ownedEntryIds: ids.slice(0, owned),
          masteredEntryIds: ids.slice(0, mastered),
          updatedAt: '2026-09-08T00:00:00.000Z',
        }),
      )
    }, fixture)
    await page.reload()
    await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
    await page.getByRole('button', { name: 'Share Collection' }).click()
    const dialogBox = await page.locator('[data-share-studio]').boundingBox()
    expect(dialogBox).not.toBeNull()
    expect(Math.abs((dialogBox?.x ?? 0) + (dialogBox?.width ?? 0) / 2 - 720)).toBeLessThanOrEqual(1)
    expect(Math.abs((dialogBox?.y ?? 0) + (dialogBox?.height ?? 0) / 2 - 450)).toBeLessThanOrEqual(
      1,
    )
    await page.getByRole('button', { name: new RegExp(`^${fixture.template}`) }).click()
    const preview = page.locator('[data-share-preview]')
    await expect(preview).toBeVisible({ timeout: 15_000 })
    await expect
      .poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBe(1080)
    // Canvas text rasterization is platform-specific. Compare the checked-in macOS baseline
    // locally with a small raster tolerance; Linux CI still renders and verifies every fixture.
    if (process.platform === 'darwin') {
      await expect(preview).toHaveScreenshot(`${fixture.name}.png`, { maxDiffPixelRatio: 0.04 })
    }
  })
}

test('Phase A Chinese starter route does not stay indexable', async ({ page }) => {
  await page.goto('/zh')
  expect(new URL(page.url()).pathname).toBe('/')
})
