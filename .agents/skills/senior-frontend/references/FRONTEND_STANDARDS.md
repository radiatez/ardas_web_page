# Ardaş Frontend Standards

## Component Philosophy

Prefer semantic, focused components with explicit props.

Good:

```text
HeroSection
CompanyStats
BrandShowcase
DistributionLocations
CareerCTA
DealerPortalLink
```

Avoid ambiguous abstractions such as:

```text
Thing
Box
SuperCard
ContentBlock2
```

## Data vs Presentation

Public content should be provided by:

- CMS/admin content,
- typed configuration,
- localized dictionaries,
- server data sources.

Do not bury editable marketing copy inside JSX.

## State

Prefer local state.

Introduce shared/global state only for genuinely shared interactive state.

Public corporate pages should require very little global client state.

## Error Handling

Public content:

- fail gracefully,
- show useful fallback,
- never expose stack traces.

Admin:

- give actionable error feedback,
- log correlation identifiers where available,
- do not expose secrets or raw infrastructure errors.

## Environment Configuration

Examples of configuration that should not be duplicated in code:

```text
SITE_URL
DEALER_PORTAL_URL
DEFAULT_LOCALE
SUPPORTED_LOCALES
UPLOAD_MAX_SIZE
```

Secrets must remain server-only.

## Media

Every content image should define:

- alt policy,
- focal/crop behavior,
- width/height or aspect ratio,
- responsive sizes.

## Completion Checks

Recommended commands once the project exists:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Use the project's real commands if they differ.
