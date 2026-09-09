# FN Sprite Hub — Final RC Checklist

Reviewed engineering baseline: `1e058e1bad31a65379ead8948d971bff1aa5b290`

## Already green

- Tracker / checklist
- Gallery / Matrix
- 47-entry runtime model
- 31 independent variant artworks
- Share Studio
- deterministic Canvas renderer
- same-origin artwork guard
- artwork single source of truth
- GitHub Actions `verify`
- dynamic Sprite details remain noindex by default
- exact Epic Fan Content disclaimer in the root site footer
- Fan Content disclaimer release gate

## Do not add before launch

- Season 3
- translations
- auth / cloud sync
- trading/community
- more Share templates
- advertising

## Remaining human gates

### 1. Artwork use review

Review `src/data/sprite-artworks.json`.

Do not infer approval merely from a public Download button.

For each record decide:

```text
displayUseReview
exportUseReview
policyOrTermsRef
reviewNote
```

Then:

```bash
pnpm artwork:check
```

### 2. Final Share visual review

Review the seven release fixtures:

1. My Collection
2. Missing 6
3. Missing 24
4. Missing All — Page 1
5. Need to Master 12
6. Celebration Collection
7. Celebration Mastered

Review at 1080×1350 and 360×450.

### 3. Legal review

Review Privacy / Terms / operator information and only then move the legal profile out of `starter`.

Then:

```bash
pnpm legal:check
```

## SEO launch decision

Keep all 16 dynamic `/sprites/[slug]` pages noindex for initial launch.

Let the owner pages carry the first SEO cycle:

```text
/
 /checklist
 /sprites
 /variants
 /rarity
 /locations
 /rarest-sprites
 /new-sprites
 /guides/how-to-master-sprites
```

Promote detail pages only after GSC/SERP evidence justifies richer family-specific content.

## Final commands

```bash
pnpm verify
pnpm fan-content:check
pnpm artwork:check
pnpm legal:check
node scripts/rc-status.mjs
```

All production gates must pass before:

```bash
pnpm deploy
```
