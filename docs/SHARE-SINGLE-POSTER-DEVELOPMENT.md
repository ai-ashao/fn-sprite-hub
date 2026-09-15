# FN Sprite Hub single-poster sharing development plan

Status: approved implementation scope
Target: post-launch FN Sprite Hub
Date: 2026-09-14

## Goal and boundaries

Make collection sharing a global, low-friction action and replace multi-file exports with one
portable portrait poster. Keep the existing Tracker, information architecture, local-first
collection model, legal controls, and SEO architecture intact.

In scope:

- Add a persistent Share control immediately before the language control in the desktop header.
- Keep a directly accessible icon-sized Share control in the mobile header, outside the menu.
- Keep the existing Share Collection call to action below the Tracker/checklist collection UI.
- Keep My Collection, Missing Sprites, Unmastered Sprites, Mastered Sprites, and the separate 100%
  Celebration template.
- Render exactly one 1080px-wide, dynamically sized PNG for every available template and collection
  state.
- Prefer file-based Web Share API sharing. Always expose Download PNG; automatically request the
  PNG download after a genuine native-share failure. A user cancellation does not download.
- Add Copy Link for the canonical Tracker URL. The link contains no collection payload.
- Add consent-gated GA4 share events without collection contents or entry identifiers.
- Preserve and test the server-rendered Related Sprites links on Sprite detail pages.

Out of scope:

- Homepage redesign, navigation restructuring, public collection profiles, short-link storage,
  server-side image generation, collection uploads, and broad SEO changes.
- Changing Sprite catalog, artwork approvals, indexability policy, canonical URLs, or sitemap rules.

## Current-state finding

The production header has no Share entry. Tracker and Checklist already open the same Share Studio.
The current renderer emits 1080 x 1350 pages with at most 24 entries, so an empty collection creates
three Missing Sprites PNGs. Production HTML for `/sprites/jonesy` already contains the Related
Sprites heading and four real `/sprites/...` anchors; this is SSR/SSG-safe and needs a regression
test, not an implementation rewrite.

## Component and file changes

| File | Change |
| --- | --- |
| `src/routes/__root.tsx` | Mount the shared Share Studio in the header before the language pill. |
| `src/components/sprites/share-studio.tsx` | Add trigger source/label/icon options, single-result lifecycle, Copy Link, native-share fallback, and analytics hooks. |
| `src/lib/sprites/share-selection.ts` | Filter the current collection state into four deterministic image types and disable empty results. |
| `src/lib/sprites/share-renderer.ts` | Use a fixed 1080px width, dynamic row-based height, readable entry cards, and the separate celebration layout. |
| `src/lib/analytics.ts` | Define narrow GA4 share event names and a guarded browser dispatch helper. |
| `src/sprite-theme.css` | Style desktop/mobile header Share control and portrait preview/action layout. |
| `tests/fn-sprite-share.test.ts` | Assert one-image selection and dynamic 1080px-wide layout containment. |
| `tests/browser-viewport.spec.ts` | Verify both header entry points, single PNG, mobile access, Copy Link, and native sharing. |
| `tests/share-polish-browser.spec.ts` | Update portrait preview and local-font assertions. |
| `tests/competitiveness-browser.spec.ts` | Verify native failure download fallback and raw SSR Related Sprites anchors. |
| `tests/platform-contracts.test.ts` | Verify guarded analytics event dispatch. |
| `docs/SHARE-VISUAL-REVIEW.md`, `docs/FINAL-RC-CHECKLIST.md` | Replace obsolete 1080 x 1350 review guidance. |

## State flow

1. Header or contextual CTA records its matching click event and opens Share Studio.
2. The selected template plus the current local collection snapshot forms the render key.
3. The previous object URL is revoked, fonts and same-origin artwork are checked, and one selection
   is rendered into one PNG.
4. A successful render creates one Blob, object URL, and File, then records
   `share_image_generated`.
5. Copy Link writes the canonical Tracker URL. Download PNG creates one temporary download URL and
   records `share_image_download`.
6. When file sharing is supported, Share records `share_native_open` immediately before invoking
   `navigator.share`. Abort/cancel returns to the ready state. Other failures request the same PNG
   through the download path.
7. Template or collection changes invalidate the old render key; stale async work cannot become
   exportable.

## Poster layout

- Canvas: fixed 1080px width and dynamic height, PNG.
- Header zone: patch, template title, season, collected/mastered summary, and separate collection and
  mastery progress bars.
- My Collection: every entry currently marked Owned or Mastered.
- Missing Sprites: every entry currently marked Missing.
- Unmastered Sprites: every entry marked Owned but not Mastered.
- Mastered Sprites: every entry currently marked Mastered.
- Regular image types use a consistent five-column entry-card grid. Height grows by complete rows so
  all selected entries remain in one PNG. A type with no matching entries is disabled and cannot
  produce an empty image.
- Celebration: large 100% statement plus a curated five-family artwork row.
- Footer: FN Sprite Hub signature and local-rendering note. No page number is needed.

## Failure and fallback behavior

- Font, artwork, canvas, image-size, or Blob failure leaves export actions disabled and exposes a
  retry action.
- Native share unsupported or `canShare({ files })` false: Share is hidden; Download PNG remains.
- Native share throws AbortError: show “Sharing cancelled”; do not download.
- Native share throws another error: request one PNG download and explain the fallback.
- Clipboard denial: keep the PNG actions usable and show a non-destructive Copy Link error.
- Closing or changing templates cancels stale render/share jobs and revokes allocated object URLs.

## Mobile behavior

- The header order is Brand, Share icon, EN, Menu. Share never moves into the menu.
- The icon button has a 42 px minimum target and an accessible “Share collection” name.
- Share Studio remains a full-viewport dialog. Its template grid, portrait preview, status, and
  actions must fit without page-level horizontal overflow.

## Analytics

Events: `share_header_click`, `share_collection_click`, `share_image_generated`,
`share_native_open`, and `share_image_download`.

Allowed parameters are template, trigger location/path, output format, and canvas dimensions. Never
send collection contents, Sprite entry IDs, clipboard values, or locally stored identifiers. The
helper only uses the existing consent-managed `gtag` queue and does nothing when that queue is not
initialized (which includes an unconfigured GA4 deployment).

## Acceptance criteria

- Desktop Share is directly before EN; mobile Share is visible while the navigation menu is closed.
- Tracker/checklist Share Collection remains present.
- Each available template produces one 1080px-wide PNG with a content-derived height, all selected
  entries inside the safe area, and a stable filename without page suffixes.
- Web Share receives exactly one PNG File. Unsupported share keeps Download PNG visible. A real
  native-share failure starts one PNG download; cancellation does not.
- Copy Link copies the Tracker URL without collection data.
- All five required GA4 events are emitted at the intended transition when analytics is configured.
- The raw HTML response for a Sprite detail contains Related Sprites and real internal anchors.
- Header/dialog interactions work at 1440 x 900, 390 x 844, and 430 x 932 without horizontal page
  overflow.
- Existing lint, unit tests, production client/SSR build, strict typecheck, HTTP smoke, and browser
  suites pass.

## Regression checklist

- Collection state still cycles, persists, restores, resets, and exports a JSON backup.
- All four collection image types retain correct eligibility and entry semantics; Celebration stays
  separately gated behind 100% completion.
- Same-origin artwork and approved-export gates remain unchanged.
- Dialog close, template switching, retry, URL revocation, and stale-render guards still work.
- Checklist CTA, Discord copy, canonical redirects, 404 behavior, indexability hold, sitemap, and
  mobile menu remain unchanged.
- Related Sprites stay present in both raw SSR HTML and the hydrated page.
