# Free local tool legal page template

ShipLean currently provides one legal template for a free, account-free tool whose primary inputs are processed locally in the browser. It renders Privacy Policy and Terms of Service from one typed product profile. Product routes must stay thin wrappers around the shared renderer instead of becoming independent prose pages.

This is truthful legal boilerplate for shipping a browser-local web tool, not legal advice or a compliance certification. The product operator remains responsible for the accuracy of every published fact.

## Configure one source of truth

Edit `src/modules/legal-profile.ts` when starting a product. The profile controls:

- product, operator, effective date, and update date; the public URL comes from the same `VITE_SITE_URL` used by canonical metadata;
- the default `support@domain` contact address;
- processing activities that bind each data category to its purpose, legal basis, retention rule, and recipients;
- browser storage, infrastructure providers, international processing language, and optional consent-gated analytics.

The Privacy and Terms routes both consume this profile through `LegalDocumentPage`. Do not duplicate their section JSX or write unrelated legal prose directly in route files.

## Validation

The legal module has no `starter`, `reviewed`, or `launchReady` state. Privacy and Terms are ordinary public pages. Search indexability is controlled separately from legal-page validation.

`validateLegalProfile(profile)` checks required product facts, dates, placeholders, processing activities, browser storage, and provider declarations. `pnpm legal:check` runs this factual check, and `pnpm deploy` runs it before building or contacting Cloudflare.

The check prevents obviously false or incomplete boilerplate; it does not decide whether the product is legally entitled to launch.

## Supported product boundary

This template assumes the product is free, has no production accounts, does not accept payment, does not publish user content, and does not upload or persist the primary tool inputs. Optional consent-gated analytics is the only conditional integration currently represented.

Accounts, subscriptions, refunds, user content, cloud storage, AI-provider processing, and SaaS-specific consumer terms require a separate legal template that is intentionally deferred to a later phase.

## Localization

The product currently ships one real English legal version. Do not publish `hreflang` or a language switch for untranslated legal pages. When a real translation is added, register it under the existing stable `privacy` or `terms` page identity and render the same shared legal component with a structurally complete locale dictionary.
