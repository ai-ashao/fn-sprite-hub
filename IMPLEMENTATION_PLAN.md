# FN Sprite Hub implementation plan

The implementation source of truth is `docs/FN-SPRITE-HUB-V1.3.md`.

## Implemented in this V1 bundle

- Phase 0: product identity, canonical site config, worker identity, English-only SEO registry, starter homepage replacement.
- Phase 1: `SpriteFamily` + `SpriteEntry` current-season data foundation.
- Phase 2: browser-local collection engine with migration-safe normalization.
- Phase 3/4: Soft Fantasy tracker homepage, filters, entry state, progress, drawer and mobile layout.
- Phase 5: nine SEO owner pages plus gated dynamic Sprite detail route.
- Dynamic sitemap with `lastmod`.

## Deferred by design

- Matrix
- Export image
- Discord copy
- Backup/restore UI
- Encoded share URL
- Past seasons
- PT-BR / ES / DE / FR
- Ads / CMP
- Backend persistence

## Release blockers intentionally not auto-resolved

- Production asset/IP review
- Legal profile human review
- AdSense/CMP implementation if ads are enabled
