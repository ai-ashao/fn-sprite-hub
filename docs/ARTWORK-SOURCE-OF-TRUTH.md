# Artwork single source of truth

`src/data/sprite-artworks.json` is the canonical artwork registry for the current released Sprite entries.

It owns:

- runtime local path
- `imageMode`
- source URLs
- Fortnite.GG asset ID/page when applicable
- CDN source used by the downloader
- display-use review state
- share-export review state

Consumers:

```text
sprite-artworks.json
├─ src/data/sprites.ts
├─ src/data/sprite-artwork-manifest.ts
├─ scripts/download-sprite-variants.mjs
└─ scripts/check-artwork-review.mjs
```

`scripts/sprite-variant-download-report.json` is generated output and is not a source of truth.

## Release behavior

`pnpm artwork:check` intentionally fails while any displayed/exported artwork remains `pending` or `blocked`.

The production deploy chain becomes:

```text
legal:check
↓
artwork:check
↓
build
↓
wrangler deploy
```

Do not mark records `approved` to silence the gate. Approval must follow the human policy/source review described in `docs/ARTWORK-REVIEW.md`.
