---
name: frontend-design
description: Design and implement distinctive, production-grade public frontend UI for Ardaş while obeying the project's corporate design language. Use for pages, sections, components, responsive layouts, interactions, styling and visual polish.
---

# Frontend Design — Ardaş Adaptation

## Origin

This project skill is inspired by the `creative-design/frontend-design` skill from `davila7/claude-code-templates`, but is rewritten for Ardaş.

The upstream skill strongly encourages intentional visual direction, polished production UI and avoidance of generic AI-generated aesthetics.

For this project, creativity is bounded by the Ardaş corporate design system.

## Required Precedence

Before using creative freedom, read:

1. `../corporate-web-design/SKILL.md`
2. `../corporate-web-design/references/DESIGN_LANGUAGE.md`
3. `../../../docs/PROJECT_BRIEF.md`

If this skill conflicts with the corporate design language, **corporate-web-design wins**.

## Aesthetic Direction Is Already Chosen

Do not choose a random visual style per page.

The project direction is:

> refined, Swiss-inspired, corporate-industrial minimalism with strong typography, generous negative space, authentic operational imagery and controlled motion.

Do not pivot to:

- maximalism,
- retro-futurism,
- playful/toy UI,
- neon cyberpunk,
- glassmorphism,
- brutalist gimmicks,
- trendy SaaS,
- random decorative grain/noise,
- custom cursor experiences.

## Distinctiveness

Ardaş should be memorable through:

- confident typography,
- composition,
- authentic distribution imagery,
- the scale of operations,
- disciplined whitespace,
- strong brand moments,
- precise micro-interactions.

It should NOT try to be memorable through gimmicks.

## Typography

Do not default thoughtlessly to a generic font.

However, font choice must remain:

- corporate,
- legible,
- Turkish-compatible,
- web-performant,
- licensed for intended use.

A distinctive display face may be paired with a highly readable body face, but the result must remain serious.

Until the final brand font is approved, keep typography tokenized and replaceable.

## Color

Use CSS variables/tokens.

The final brand color is not approved yet.

Do not hard-code ABB's red as Ardaş's identity.

Use one primary accent with neutral surfaces once the brand palette is finalized.

## Spatial Composition

Creative layout is encouraged through:

- asymmetrical but grid-disciplined editorial sections,
- large image/text relationships,
- full-bleed moments,
- intentional offsets,
- strong section pacing.

Do not break the grid simply to appear creative.

## Motion

Use fewer, better motion moments.

Preferred:

- coordinated page/section reveal,
- subtle text and image sequencing,
- restrained hover feedback,
- smooth state transitions.

Do not scatter independent animations across every element.

## Production Requirement

Every designed UI must be real and implementable.

No static mockup-only tricks that:

- fail responsively,
- require impossible image crops,
- hide content behind animation,
- break keyboard access,
- tank performance,
- depend on a desktop pointer.

## Public-Site Context

Remember:

- no cart,
- no public pricing,
- no product-stock dashboard,
- no dealer login UI inside the corporate layout,
- no dense filtering unless a future approved product catalogue specifically requires it.

## Quality Gate

A design is accepted only if it is:

- distinctive but not theatrical,
- corporate but not boring,
- modern but not trendy for trend's sake,
- responsive,
- accessible,
- technically realistic,
- consistent with the design tokens,
- clearly Ardaş.
