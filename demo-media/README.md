# Milestone 4.1 Demo Media

These six images are replaceable visual prototypes generated for local/test art
direction. They are not approved company photography, CMS records, brand
assets, certifications or a production media fallback.

Runtime metadata lives in `src/content/demo-media.ts`. That manifest mirrors the
public `Media` / `MediaLocale` presentation shape with stable demo IDs, Turkish
and English alt text, decorative semantics and focal points. The repository only
loads it through the existing local/test development-content gate; staging and
production still require published CMS media from the secure public storage
path. Files live outside Next.js `public/` and a whitelist route serves them only
when development content is enabled.

| File | Intended placement | Treatment |
|---|---|---|
| `warehouse-hero.png` | Homepage hero | Meaningful, focal 0.68 / 0.50 |
| `distribution-operations.png` | Capability and corporate | Meaningful, focal 0.58 / 0.50 |
| `parts-detail.png` | Product groups | Meaningful, focal 0.42 / 0.55 |
| `facility-loading.png` | Operations and locations | Meaningful, focal 0.64 / 0.50 |
| `careers-workplace.png` | Careers | Meaningful, focal 0.68 / 0.48 |
| `portfolio-rhythm.png` | Portfolio / brands | Decorative, focal 0.52 / 0.45 |

Generation used the built-in image generation tool with six separate prompts in
one consistent brief: natural premium industrial editorial photography, neutral
steel/concrete/cardboard materials, restrained desaturated petrol accents,
credible warehouse activity, and no visible brands, logos, readable labels,
watermarks or invented company claims.
