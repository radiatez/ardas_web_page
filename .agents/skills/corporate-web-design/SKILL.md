---
name: corporate-web-design
description: Enforce the Ardaş Yedek Parça corporate website visual language. Use for any public-facing page, component, layout, navigation, imagery, typography, animation, responsive design, or visual review.
---

# Corporate Web Design — Ardaş

## Mission

Create a premium public corporate website for **Ardaş Yedek Parça**, an automotive aftermarket parts distributor.

The site must look like a serious global distribution/industrial company — not a repair shop, online parts store, B2B portal, car brand or generic startup.

## Required Reference

Before designing or modifying public UI, read:

`references/DESIGN_LANGUAGE.md`

That file is the visual source of truth.

## Company Context

Use these verified project facts:

- 3 locations: İstanbul, Ankara, Diyarbakır
- 30+ years
- 150+ brands
- 50,000+ products
- Nationwide distribution/cargo
- Turkish + English
- Corporate public website
- Separate dealer automation destination
- Separate management panel

Never invent extra business metrics.

## Design Decision Order

When deciding between alternatives, prioritize:

1. Corporate trust
2. Information hierarchy
3. Legibility
4. Brand consistency
5. Responsive usability
6. Accessibility
7. Subtle motion
8. Decoration

Decoration always comes last.

## Before Designing

1. Identify the page's single main communication goal.
2. Inspect the existing layout and design tokens.
3. Read the relevant content/requirements document.
4. Decide which content deserves full-width treatment.
5. Keep the number of competing visual elements low.
6. Use whitespace deliberately.
7. Ensure the result still looks excellent with animation disabled.

## Visual Direction

Target qualities:

- Swiss-inspired discipline
- white/light neutral surfaces
- near-black typography
- one replaceable corporate accent
- strong left alignment
- large headings
- generous whitespace
- authentic industrial/warehouse imagery
- restrained motion
- architectural composition
- editorial storytelling

## Homepage Behaviour

The homepage should communicate conceptually:

```text
Impact
→ Scale
→ Capability
→ Portfolio / Brands
→ Distribution / Operations
→ Trust
→ People / Careers
→ Contact
```

This order is a design narrative, not permission to create unnecessary sections.

## Imagery

Prefer:

- warehouses,
- shelves and inventory systems,
- scanning/fulfilment,
- logistics,
- employees,
- packaging,
- macro product/component details,
- real operational environments,
- architecture,
- distribution activity.

Vehicles may appear contextually but must not dominate.

Avoid:

- random sports cars,
- glamour vehicle shots,
- mechanics under cars,
- repair-shop clichés,
- fake-looking AI industrial scenes.

## Typography

Typography carries the design.

Use:

- concise headlines,
- clear hierarchy,
- restrained body widths,
- strong numeric typography for company stats.

Do not use long marketing paragraphs as hero headlines.

## Cards

Cards are not the default layout.

Use cards only for genuinely repeatable content such as news, categories or positions.

Avoid turning every section into a rounded rectangle.

## Motion

Motion must be controlled and premium.

Allowed:

- opacity/translate reveals,
- subtle image crop/scale,
- restrained mask reveals,
- deliberate hover transitions,
- low-amplitude parallax where useful.

Avoid:

- bounce,
- elastic motion,
- spinning,
- dramatic zooms,
- scroll hijacking,
- decorative animation on every element.

Respect `prefers-reduced-motion`.

## Navigation

Navigation must be clean and corporate.

The final item is a distinct action:

- TR: `Bayi Otomasyonu`
- EN: `Dealer Portal`

It must be visually differentiated without looking like a sales pop-up.

## Responsive Review

For each public page verify:

- hero remains readable,
- spacing remains premium,
- typography scales intentionally,
- navigation remains usable,
- no horizontal overflow,
- interactive targets are touch-friendly,
- media crops remain meaningful,
- key hierarchy is not lost.

## Forbidden Drift

Reject the design and revise if it starts to look like:

- an e-commerce store,
- a B2B dashboard,
- a mechanic website,
- a car manufacturer,
- a generic SaaS template,
- an Awwwards experiment that sacrifices usability.

## Self Review

Before declaring a UI task finished, ask:

- Does Ardaş look like a large established company?
- Is the company more visually important than individual products?
- Is the page predominantly calm and neutral?
- Is the accent color restrained?
- Is there enough whitespace?
- Is there one clear primary message?
- Are vehicle images supporting rather than dominating?
- Is motion helping attention rather than showing off?
- Does mobile preserve the same corporate quality?
- Could this page plausibly belong to a global industrial/distribution group?

If multiple answers are "no", revise before finishing.


## v0.2 Implementation Note

Public design work must support localized 404/500 states, bilingual navigation, media focal-point control and WCAG 2.2 AA without weakening the established corporate visual language.
