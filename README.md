# FN Sprite Hub

FN Sprite Hub is a free, account-free Fortnite Sprite Tracker and checklist built on the ShipLean Tool-mode foundation.

## V1 scope

- Fortnite Sprite Tracker 2026
- Current Chapter 7 Season 4 data model
- 16 current Sprite families / 47 verified released entries (2026-09-08 snapshot)
- Explicit per-entry artwork provenance (`entry` or `family-fallback`)
- Entry-level Owned / Missing / Mastered tracking
- Browser-local persistence
- Search, rarity, variant and status filtering
- Current Sprite database and detail pages
- Checklist, variants, rarity, locations, rarest and new-Sprite SEO owner pages
- Cloudflare-first SSR / edge deployment
- No auth, billing, trading, community or database

## Development

```bash
pnpm install
pnpm dev
```

## Verify

```bash
pnpm verify
```

## Production configuration

Set:

```text
VITE_SITE_URL=https://fnspritehub.com
VITE_GA4_ID=
VITE_GOOGLE_SITE_VERIFICATION=
```

The production environment rejects ShipLean starter canonical hosts.

## Asset note

The checked-in Sprite images were collected for prototype/testing from the source manifest already present in this repository. Before monetized public release, complete the asset/IP review gate documented in `docs/FN-SPRITE-HUB-V1.3.md`.

## Legal pages

Privacy Policy and Terms of Service are ordinary public pages generated from the factual product profile in `src/modules/legal-profile.ts`. `pnpm legal:check` rejects missing, malformed, or placeholder product and data-processing facts; it does not maintain a legal-review state or certify legal compliance.

## Product source of truth

See:

`docs/FN-SPRITE-HUB-V1.3.md`

## ShipLean foundation

FN Sprite Hub stays on the **TanStack Start only** runtime contract. If this repository is used as a handoff example, start with [Build your first ShipLean MVP](./docs/getting-started.md); the bundled workflow creates an independent private GitHub repository so product work never pushes back to the ShipLean template.
