# Next.js Baseline for Ardaş v0.3

## Selected Baseline

```text
Next.js
TypeScript
pnpm
PostgreSQL
```

Exact versions are selected during Milestone 0.

## Public Route Policy

Authoritative policy:

`../../../../docs/requirements/I18N.md`

Stable route keys map to localized paths.

Do not leave localized-vs-common slug strategy open.

## Rendering

Prefer server rendering/static generation for public corporate content where practical.

Use client components only when interactivity requires them.

## Admin

Admin is structurally separate from the public corporate layout.

Production admin requires MFA and server-side permission checks.

## Locale Variant

Unpublished locale direct request:

```text
404
```

Language switch:

```text
equivalent published route
otherwise target locale homepage
```

## Preview

Draft preview is authenticated/secure and non-indexable.

## Caching

Do not cache authoritative mutations/auth/protected downloads as static content.

## Metadata

Localized published pages support:

- title
- description
- canonical
- hreflang
- Open Graph
- sitemap

## Error States

Localized safe 404/500; no public stack traces.
