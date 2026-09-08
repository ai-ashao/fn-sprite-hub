# FN Sprite Hub — Artwork Review Gate

`src/data/sprite-artwork-manifest.ts` is an internal review registry.

The fields `displayUseReview` and `exportUseReview` are project review states, not legal conclusions.

## Review states

- `pending`: not reviewed for that use
- `approved`: project review completed for that use
- `blocked`: do not use for that purpose

## Production rule

Before production release:

- every displayed artwork must have `displayUseReview = approved`
- every artwork used in a downloadable Share Card must have `exportUseReview = approved`
- all runtime artwork paths must be same-origin/local
- runtime hotlinks are prohibited

## Evidence to record for an approval

- entry ID
- source URL
- source type
- relevant policy / terms reference
- review date
- display-use decision
- share-export decision
- notes

Do not mark a record approved just because the image is publicly reachable or appears in another tracker.
