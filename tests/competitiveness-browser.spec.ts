import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  reviewedReleasedEntryCount as currentReleasedEntryCount,
  releasedFinishesFor,
} from '../src/data/released-sprite-finishes'

const key = 'fn-sprite-hub:collection:v1'
const base = () => ({
  schemaVersion: 1,
  seasonId: 'c7s4',
  ownedEntryIds: [] as string[],
  masteredEntryIds: [] as string[],
  updatedAt: '2026-09-11T00:00:00.000Z',
})
const backup = () => ({ ...base(), ownedEntryIds: ['crown:normal'] })

for (const [name, raw] of [
  ['damaged JSON', '{damaged'],
  ['foreign season', JSON.stringify({ ...base(), seasonId: 'older-season' })],
  ['unknown schema', JSON.stringify({ ...base(), schemaVersion: 99 })],
  ['unknown entry', JSON.stringify({ ...base(), ownedEntryIds: ['future:unknown'] })],
]) {
  test(`protect ${name} on navigation and user edits`, async ({ page }) => {
    await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key, raw })
    await page.goto('/')
    await expect(page.locator('[data-collection-save-notice]')).toHaveAttribute(
      'data-save-level',
      'warning',
    )
    await page.locator('[data-entry-id="crown:normal"]').first().click()
    await expect(page.getByRole('button', { name: 'Export preserved original' })).toBeVisible()
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw)
  })
}

test('first navigation does not write an empty collection', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull()
})

test('blocked storage and failed writes keep the page usable', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Blocked for test', 'SecurityError')
      },
    }),
  )
  await page.goto('/?focus=crown')
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  const entry = page.locator('[data-entry-id="crown:normal"]').first()
  await entry.click()
  await expect(entry).toHaveAttribute('data-entry-state', 'owned')
  await expect(page.getByRole('button', { name: 'Export this tab’s collection' })).toBeVisible()
})

test('native Web Locks preserve two near-simultaneous tab edits', async ({ context, page }) => {
  const second = await context.newPage()
  await Promise.all([page.goto('/?focus=crown'), second.goto('/?focus=klombo')])
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  await expect(second.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  await Promise.all([
    page.locator('[data-entry-id="crown:normal"]').first().click(),
    second.locator('[data-entry-id="klombo:normal"]').first().click(),
  ])
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').ownedEntryIds ?? [],
        key,
      ),
    )
    .toEqual(expect.arrayContaining(['crown:normal', 'klombo:normal']))
  await page.getByRole('button', { name: 'Undo last change' }).click()
  await expect
    .poll(() =>
      second.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').ownedEntryIds ?? [],
        key,
      ),
    )
    .toEqual(['klombo:normal'])
})

test('restore previews, cancels, confirms and survives reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  const input = page.locator('input[type="file"]')
  const file = {
    name: 'review.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup())),
  }
  await input.setInputFiles(file)
  await expect(page.locator('[data-restore-preview]')).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull()
  await page.getByRole('button', { name: 'Cancel restore' }).click()
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull()
  await input.setInputFiles(file)
  await page.getByRole('button', { name: 'Confirm replacement', exact: true }).click()
  await expect(page.getByText('Collection restored from backup.').first()).toBeVisible()
  await page.reload()
  await expect(page.locator('[data-entry-id="crown:normal"]').first()).toHaveAttribute(
    'data-entry-state',
    'owned',
  )
})

test('restore detects an edit in another tab after the preview', async ({ context, page }) => {
  await page.goto('/')
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'replace.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup())),
  })
  const second = await context.newPage()
  await second.goto('/?focus=klombo')
  await expect(second.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  await second.locator('[data-entry-id="klombo:normal"]').first().click()
  await expect(second.locator('[data-entry-id="klombo:normal"]').first()).toHaveAttribute(
    'data-entry-state',
    'owned',
  )
  await page.getByRole('button', { name: 'Confirm replacement', exact: true }).click()
  await expect(page.getByText('Collection changed. Please review and confirm again.')).toBeVisible()
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').ownedEntryIds, key),
  ).toEqual(['klombo:normal'])
})

for (const view of ['Gallery', 'Matrix']) {
  test(`Missing → detail → return preserves ${view} and filters`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
    await page.locator('input[type="search"]').fill('Crown')
    await page
      .locator('[data-sprite-status-filter]')
      .getByRole('button', { name: 'Missing', exact: true })
      .click()
    await page.getByRole('button', { name: view, exact: true }).click()
    await page.locator('#collection a[href="/sprites/crown"]').first().click()
    await expect(page).toHaveURL(/\/sprites\/crown$/)
    await expect(page.locator('[data-collection-save-notice]')).toHaveAttribute(
      'data-save-level',
      'info',
    )
    // Make every entry in this family leave the Missing family filter.
    for (const finish of releasedFinishesFor('crown')) {
      const entryId = `crown:${finish}`
      await page.locator(`[data-entry-id="${entryId}"]`).click()
      await expect(page.locator(`[data-entry-id="${entryId}"]`)).toHaveAttribute(
        'data-entry-state',
        'owned',
      )
    }
    await page.getByRole('link', { name: 'Return to my filtered list' }).click()
    await expect(page.locator('input[type="search"]')).toHaveValue('Crown')
    await expect(page.getByRole('button', { name: view, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(
      page
        .locator('[data-sprite-status-filter]')
        .getByRole('button', { name: 'Missing', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText(/Your Missing filters are restored/)).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('direct detail entry focuses a known Sprite; malicious focus falls back safely', async ({
  page,
}) => {
  await page.goto('/sprites/klombo')
  await page.getByRole('link', { name: 'Open tracker', exact: true }).click()
  await expect(page.locator('input[type="search"]')).toHaveValue('Klombo')
  await page.goto('/?focus=https%3A%2F%2Fevil.example&returnTo=https%3A%2F%2Fevil.example')
  await expect(page.locator('input[type="search"]')).toHaveValue('')
  expect(new URL(page.url()).hostname).toBe('127.0.0.1')
})

test('share template switching, cancelled native sharing and every PNG download', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        throw new DOMException('Cancelled', 'AbortError')
      },
    })
  })
  await page.goto('/')
  await expect(page.locator('[data-sprite-progress]')).toHaveAttribute('data-mounted', 'true')
  await page.getByRole('button', { name: 'Share Collection' }).click()
  const studio = page.locator('[data-share-studio]')
  await studio.getByRole('button', { name: /^My Collection/ }).click()
  await studio.getByRole('button', { name: /^Missing Sprites/ }).click()
  const downloadButton = studio.getByRole('button', { name: /^Download (\d+ PNGs|PNG)$/ })
  await expect(downloadButton).toBeEnabled()
  await studio.getByRole('button', { name: 'Share', exact: true }).click()
  await expect(studio.getByText('Sharing cancelled.')).toBeVisible()
  const pageCount =
    (await studio.getByRole('navigation', { name: 'Preview pages' }).getByRole('button').count()) ||
    1
  const downloads: Array<import('@playwright/test').Download> = []
  page.on('download', (download) => downloads.push(download))
  await downloadButton.click()
  await expect.poll(() => downloads.length).toBe(pageCount)
  for (let i = 0; i < downloads.length; i++) {
    const path = testInfo.outputPath(`share-${i + 1}.png`)
    await downloads[i].saveAs(path)
    const png = await readFile(path)
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1080, 1350])
  }
  if (pageCount > 1)
    await expect(studio.getByRole('button', { name: 'Download page 1' })).toBeEnabled()
  await studio.getByRole('button', { name: 'Close Share Studio' }).click()
  await expect(studio).not.toBeVisible()
})

test('Crown and Klombo expose specific rules and sources without removing the indexing hold', async ({
  page,
}) => {
  for (const slug of ['crown', 'klombo']) {
    await page.goto(`/sprites/${slug}`)
    await expect(page.locator('[data-sprite-quick-answer]')).toBeVisible()
    await expect(page.locator('#sprite-sources a')).toHaveCount(2)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow')
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/sprites/${slug}$`),
    )
  }
  await page.goto('/guides/how-to-master-sprites')
  await expect(
    page.getByRole('heading', { name: 'Two in-match leveling exceptions' }),
  ).toBeVisible()
})

test('SSR, empty sitemap, real 404 and dynamic catalog count remain consistent', async ({
  request,
}) => {
  const home = await request.get('/')
  expect(home.status()).toBe(200)
  const html = await home.text()
  expect(html).toContain('Fortnite Sprite Tracker')
  expect(html).toContain('noindex,nofollow')
  const sitemap = await request.get('/sitemap.xml')
  expect(await sitemap.text()).not.toContain('<loc>')
  const missing = await request.get('/sprites/does-not-exist-for-qa')
  expect(missing.status()).toBe(404)
  expect(currentReleasedEntryCount).toBe(47)
})
