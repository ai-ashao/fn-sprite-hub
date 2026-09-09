# Epic Fan Content release gate

FN Sprite Hub uses Fortnite-related material, so the production release process must account for Epic's current Fan Content Policy.

## Before production

Open the current official policy:

```text
https://legal.epicgames.com/epicgames/fan-art-policy
```

Compare the **exact current disclaimer from Section 1.10** with:

```text
src/data/epic-fan-content-disclaimer.txt
```

Do not paraphrase it for the production requirement.

The checked-in wording was reviewed on 2026-09-09. Before production, confirm that the policy has not changed. This gate must pass:

```bash
pnpm fan-content:check
```

It fails if the checked-in wording drifts from the reviewed value.

## Footer behavior

The root site footer renders the configured disclaimer on every public route.

## Commercial-use note

The public Epic Fan Content Policy currently describes fan websites/apps as non-commercial Fan Content and states that Fan Content must have no monetary objective, with an explicit advertising exception for individual web videos.

For the interim RC, do not enable advertising on the assumption that ordinary Fan Content permission covers an ad-supported Fortnite website. Resolve that question separately before monetization.

## Release chain

```text
legal:check
→ artwork:check
→ fan-content:check
→ build
→ deploy
```
