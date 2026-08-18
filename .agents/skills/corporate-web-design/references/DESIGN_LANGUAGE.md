# Ardaş Project Overlay

This document is the visual source of truth for the **Ardaş Yedek Parça** public corporate website.

Project-specific overrides take priority over generic reference examples in this file:

- Company: **Ardaş Yedek Parça / Ardaş**
- Sector: Automotive Aftermarket / replacement parts distribution
- Public website is **corporate**, not B2B, e-commerce, repair-shop, marketplace, or vehicle-showroom UI.
- Primary corporate reference: the restrained, Swiss-inspired, typography-led corporate language seen on ABB's public website.
- Vehicles must not dominate the visual identity.
- Prefer real warehouse, logistics, team, product-detail, packaging, scanning, distribution and operational imagery.
- Company scale must be visible: **3 locations · 30+ years · 150+ brands · 50,000+ products**.
- Brand/logo and final primary color are not yet finalized. Do not lock the design to ABB red.
- Public site supports **Turkish and English** under locale-prefixed routes (`/tr`, `/en`).
- The far-right navigation action is **Bayi Otomasyonu / Dealer Portal**.
- Dealer portal URL is configuration, not hard-coded business logic. Initial temporary URL:
  `https://online.bsdotomotiv.com/web`
- Any conflict between a generic example below and these project rules must be resolved in favor of these project rules.

---

# Corporate Web Design Language
## ABB-Inspired Corporate Design System Reference

> **Document type:** Design Language Reference
> **Version:** 0.1
> **Reference:** ABB corporate web experience
> **Scope:** Public-facing corporate website
> **Purpose:** Define the visual language, interaction character, hierarchy, and design rules used by the project skills and implementation plan.

---

## 1. Purpose

This document defines a corporate website design language inspired by the visual principles seen in ABB's current corporate web presence.

The goal is **not to clone ABB**.

The goal is to extract and reuse the underlying qualities:

- Global corporate confidence
- Swiss-inspired visual discipline
- Strong typography
- Generous whitespace
- High-quality industrial photography
- Restrained but visible motion
- Clear information hierarchy
- Minimal visual noise
- Strategic use of one strong brand accent
- Editorial storytelling instead of catalogue-style presentation

This design language will later be adapted to an automotive aftermarket parts distributor.

This document deliberately does **not** define:

- Sitemap
- Page-by-page implementation
- Framework or technology stack
- CMS
- Database
- API
- B2B integration
- Development tasks
- Project phases

Those belong in the project skills and `.agent/plans/WEBSITE_IMPLEMENTATION.md`.

---

# 2. Design Personality

The website must feel:

**Corporate. Global. Precise. Established. Modern. Industrial. Confident. Calm.**

It must not feel:

**Retail. E-commerce. Startup. SaaS dashboard. Automotive showroom. Repair shop. Marketplace. Template-driven. Over-designed.**

The visitor should immediately perceive:

> This is a large, established company with serious operational capability.

The visual identity should communicate scale before products.

---

# 3. Core Design Principles

## 3.1 Corporate First

The homepage is a corporate presentation, not a product catalogue.

The first impression should communicate:

- Company scale
- Capability
- Trust
- Distribution strength
- Industry experience
- Brand portfolio
- Operational excellence

Products support the company story; they do not dominate it.

---

## 3.2 Less, But Stronger

Every section should have one primary message.

Avoid:

- Multiple competing headlines
- Excessive badges
- Icon-heavy sections
- Small cards everywhere
- Dense information blocks
- Multiple CTA buttons competing for attention

Prefer:

- One strong headline
- One concise supporting paragraph
- One primary action
- One dominant visual

---

## 3.3 Editorial, Not Dashboard

Pages should feel like a premium corporate publication.

Content flows vertically as a story.

Use:

- Full-width imagery
- Large editorial blocks
- Alternating image/text compositions
- Strong section introductions
- Large statistics
- Carefully selected cards

Avoid dashboard-style grids containing many unrelated widgets.

---

## 3.4 Whitespace Is Structural

Whitespace is not unused space.

It creates:

- Hierarchy
- Confidence
- Readability
- Premium perception
- Separation between ideas

Sections must be allowed to breathe.

Do not reduce spacing simply to show more content above the fold.

---

## 3.5 One Strong Accent

The visual system should be mostly neutral.

Primary composition:

- White
- Near-black
- Grey
- One strong corporate accent color

The accent color is used intentionally for:

- Primary CTA
- Small graphic markers
- Links
- Active states
- Important highlights
- Navigation indicators

Do not paint entire pages with the brand color.

---

# 4. Visual Foundation

## 4.1 Color Philosophy

ABB's visual language relies heavily on white space, neutral tones, black typography, and strategic red accents.

For our implementation, the company's own brand color must replace ABB's brand identity.

### Reference palette

```css
--brand-reference: #FF000F; /* ABB reference only */
--background-primary: #FFFFFF;
--background-secondary: #F4F4F4;
--background-tertiary: #EAEAEA;

--text-primary: #111111;
--text-secondary: #4F4F4F;
--text-muted: #777777;

--border-light: #DADADA;
--border-strong: #B8B8B8;
```

### Important

`#FF000F` is a reference to ABB's brand red.

It should **not automatically become our brand color**.

When the target company's corporate identity is finalized, define:

```css
--brand-primary: <COMPANY_PRIMARY_COLOR>;
```

and map all accent components to that token.

---

## 4.2 Color Distribution

Recommended visual balance:

- **70–80%** white / very light surfaces
- **15–25%** imagery and neutral contrast
- **5–10%** brand accent

The accent color must remain visually valuable.

If everything is highlighted, nothing is highlighted.

---

## 4.3 Dark Sections

Do not make the entire website dark.

Dark backgrounds are allowed selectively for:

- Hero media
- Major campaign statements
- Video sections
- High-impact transition sections
- Footer

Dark areas should act as contrast moments inside an otherwise bright corporate experience.

---

# 5. Typography

## 5.1 Character

Typography is one of the primary visual elements.

Desired characteristics:

- Modern grotesk / neo-grotesk sans-serif
- Excellent readability
- Neutral but confident
- Strong uppercase performance
- Clear numeric forms
- Multiple weights
- Good Turkish character support

ABB uses its proprietary `ABBVoice` typeface.

Do **not** copy or distribute ABB's proprietary font.

Suitable implementation direction:

```css
font-family:
  "Inter",
  "Helvetica Neue",
  "Helvetica",
  "Arial",
  sans-serif;
```

A dedicated corporate font may replace this later.

---

## 5.2 Hierarchy

### Display / Hero

Desktop:

```text
56–88 px
Weight: 600–700
Line-height: 0.95–1.05
Letter-spacing: -0.02em to -0.04em
```

Mobile:

```text
38–52 px
Weight: 600–700
Line-height: 1.00–1.08
```

Use uppercase selectively when maximum corporate impact is required.

Example:

> BUILT TO KEEP BUSINESS MOVING

---

### H1

```text
48–72 px desktop
36–48 px mobile
Weight: 600–700
Line-height: 1.0–1.1
```

---

### H2

```text
36–52 px desktop
30–40 px mobile
Weight: 500–650
Line-height: 1.05–1.15
```

---

### H3

```text
24–32 px
Weight: 500–650
Line-height: 1.15–1.25
```

---

### Lead Paragraph

```text
20–24 px
Line-height: 1.4–1.55
Maximum width: 650–760 px
```

---

### Body

```text
16–18 px
Line-height: 1.5–1.7
Maximum readable line length: 65–75 characters
```

---

### Label / Eyebrow

```text
12–14 px
Weight: 600
Uppercase
Letter-spacing: 0.06em–0.12em
```

---

# 6. Typographic Behaviour

Headlines should be:

- Short
- Direct
- Outcome-oriented
- Visually dominant

Avoid long marketing sentences as headlines.

Bad:

> We are one of the leading companies providing a wide variety of automotive replacement products to our valued customers.

Better:

> KEEPING THE AFTERMARKET MOVING

Supporting copy can explain the detail below.

---

# 7. Layout System

## 7.1 Grid

Use a disciplined responsive grid.

Desktop:

```text
12-column grid
Maximum content width: 1280–1440 px
Outer gutter: 64–80 px
Column gap: 24–32 px
```

Tablet:

```text
8-column grid
Outer gutter: 32–48 px
```

Mobile:

```text
4-column grid
Outer gutter: 20–24 px
```

Full-width media can escape the content grid intentionally.

---

## 7.2 Vertical Rhythm

Recommended section spacing:

Desktop:

```text
Large section: 120–160 px
Standard section: 96–120 px
Compact section: 64–80 px
```

Mobile:

```text
Large section: 72–96 px
Standard section: 56–72 px
Compact section: 40–56 px
```

Sections should never appear accidentally compressed.

---

## 7.3 Alignment

Prefer:

- Strong left alignment
- Consistent grid anchors
- Intentional asymmetry
- Large image/text relationships

Centered content should be reserved for:

- Hero statements
- Major campaign messages
- Singular statistics
- Transition sections

Do not center every section.

---

# 8. Header & Navigation

The header must feel minimal and architectural.

## Principles

- Logo clearly isolated
- Limited visible navigation
- Strong spacing
- No clutter
- No oversized utility bar
- No excessive icons
- No colorful menu items

The navigation can transition between:

- Transparent/light-over-media state
- Solid white sticky state

depending on scroll position.

---

## Desktop Behaviour

Preferred:

```text
Logo ---------------- Primary Navigation ---------------- Utilities
```

or a simplified corporate variant:

```text
Logo -------------------------------- Search / Language / Menu
```

Detailed navigation can open inside a clean mega menu.

---

## Mega Menu

Mega menus should:

- Use white background
- Occupy meaningful screen space
- Use clear columns
- Prioritize typography over decoration
- Avoid tiny nested dropdowns
- Include at most one supporting visual
- Provide clear hierarchy

Do not make the mega menu resemble an e-commerce category browser.

---

# 9. Hero Language

The hero is the strongest branding area of the site.

## Composition

Preferred structure:

```text
[small eyebrow / campaign line]

LARGE CORPORATE
STATEMENT

Short supporting sentence.

[Primary CTA →]
```

---

## Hero Media

Preferred imagery:

- Distribution center
- Warehouse automation
- Employees at work
- Logistics operations
- Product macro photography
- Packaging / scanning / fulfillment
- Industrial systems
- Technology and people together

Automotive vehicles should **not** dominate the hero.

The company is a distributor, not a vehicle manufacturer.

---

## Hero Treatment

Hero can use:

- Full-screen image
- Full-screen muted video
- Cinematic image sequence
- Subtle dark overlay

Overlay should maintain text contrast without destroying the image.

Recommended:

```text
20–45% dark overlay depending on source image
```

---

## Hero CTA

One primary CTA.

Button characteristics:

- Strong accent fill
- White text
- Compact horizontal padding
- Clear arrow or directional icon
- Comfortable touch target
- Moderate/pill radius only if consistent with the brand

Avoid multiple equally strong CTA buttons.

---

# 10. Signature Graphic Detail

A small horizontal accent bar can be used as a recurring visual signature.

Example:

```text
━━━━

SECTION TITLE
```

or:

```text
—  CORPORATE
```

Rules:

- Use sparingly
- Always use the brand accent color
- Keep dimensions consistent
- Do not turn it into decoration everywhere

This detail should behave as a visual punctuation mark.

---

# 11. Section Composition

## 11.1 Corporate Statement Section

Structure:

```text
Large heading
Short supporting paragraph
Optional CTA
Large visual or whitespace
```

Do not place the company story inside a small card.

---

## 11.2 Split Editorial Section

Desktop:

```text
| IMAGE 55% | TEXT 45% |
```

or:

```text
| TEXT 45% | IMAGE 55% |
```

Alternate orientation between sections.

On mobile:

```text
IMAGE
TEXT
```

unless content priority requires text first.

---

## 11.3 Full-Bleed Story

Use a large image/video with a restrained text overlay.

Ideal for:

- Distribution
- Logistics
- Company culture
- Sustainability
- Technology
- Major milestones

---

## 11.4 Statistics

Statistics should feel significant.

Example:

```text
30+
Years of experience

150+
Global brands

50,000+
Product references
```

Use:

- Large numeric typography
- Minimal supporting copy
- Strong spacing
- Few metrics at once

Avoid decorative gauges, charts, circles, or dashboard visuals unless actual data requires them.

---

# 12. Cards

Cards should not dominate the design system.

Use cards for content that is genuinely repeatable:

- News
- Stories
- Brand highlights
- Product groups
- Corporate initiatives

Card appearance:

- Minimal or no shadow
- Square or very small radius
- Strong image crop
- Clear title
- Small metadata
- Arrow-based interaction

Avoid:

- Floating glass cards
- Heavy shadows
- Gradient borders
- Large rounded SaaS cards
- Every section inside a container

---

# 13. Buttons & Links

## Primary Button

```text
Brand accent background
High-contrast text
Arrow icon optional
```

## Secondary Button

Prefer a text link with arrow:

```text
Learn more →
```

or a light outline button when necessary.

Do not create a collection of differently colored button styles.

---

## Hover Behaviour

Buttons:

```text
200–300 ms
subtle background/contrast change
arrow moves 3–5 px
```

Text links:

```text
underline reveal
or
arrow translation
```

No bounce animation.

---

# 14. Motion Language

Motion must communicate quality, not entertainment.

## Character

Motion should feel:

- Smooth
- Deliberate
- Quiet
- Controlled
- Mechanical
- Premium

Motion should not feel:

- Playful
- Elastic
- Bouncy
- Game-like
- Experimental
- Excessively cinematic

---

## 14.1 Scroll Reveal

Recommended:

```text
Opacity: 0 → 1
Translate Y: 16–32 px → 0
Duration: 500–800 ms
Easing: smooth ease-out
```

Elements may stagger slightly.

Maximum stagger:

```text
60–120 ms
```

Do not animate every paragraph independently.

---

## 14.2 Image Motion

Allowed:

- Very subtle scale on scroll
- Controlled crop movement
- Mask reveal
- Gentle parallax
- Video playback

Typical scale range:

```text
1.00 → 1.03
```

Avoid dramatic zoom effects.

---

## 14.3 Page Transitions

If implemented:

```text
200–400 ms
```

Use subtle opacity or mask transitions.

Navigation should always feel immediate.

Do not sacrifice usability for animation.

---

## 14.4 Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Disable:

- Parallax
- Non-essential transforms
- Autoplay decorative motion where necessary

Accessibility takes priority over visual effect.

---

# 15. Photography Direction

Photography is a major part of the visual identity.

## Desired

- Authentic operational environments
- Real employees
- Real warehouses
- Real products
- Real logistics
- Industrial texture
- Machinery details
- Human + technology interaction
- Wide architectural shots
- Macro component photography

---

## Avoid

- Generic stock-office meetings
- Handshake photographs
- Random sports cars
- Luxury-car glamour shots
- Mechanic-under-car clichés
- Overly staged warehouse poses
- AI-looking fake industrial images
- Excessive isolated product packshots

Vehicles can appear contextually, but must not become the site's main visual identity.

---

# 16. Image Cropping

Preferred aspect ratios:

```text
Hero: 16:9 / 21:9 / viewport fill
Editorial landscape: 3:2
Card landscape: 16:10
Portrait editorial: 4:5
Square: use sparingly
```

Images should intentionally fill their containers.

Avoid arbitrary mixed ratios in the same component family.

---

# 17. Iconography

Icons must be:

- Simple
- Geometric
- Consistent
- Monochrome
- Functional

Recommended:

```text
24 × 24 px standard
1.5–2 px stroke
```

Use icons primarily for:

- Navigation
- Search
- Language
- Downloads
- Location
- Contact actions
- Directional actions

Do not use large colorful icon illustrations to explain every corporate capability.

---

# 18. Content Language

The visual system depends on concise copy.

## Headlines

Use confident declarations.

Examples:

> BUILT FOR DISTRIBUTION

> GLOBAL BRANDS. LOCAL STRENGTH.

> MOVING PARTS. MOVING BUSINESS.

> SCALE THAT DELIVERS.

These are style examples only, not final website copy.

---

## Paragraphs

Keep introductory copy concise.

Recommended:

```text
1–3 sentences
40–90 words maximum for section introductions
```

Detailed information belongs deeper in the page.

---

# 19. Corporate Storytelling

The homepage should communicate ideas in this order conceptually:

```text
Impact
↓
Scale
↓
Capability
↓
Portfolio / Brands
↓
Distribution / Operations
↓
Trust
↓
People / Careers
↓
Contact
```

This is a **storytelling hierarchy**, not a final sitemap.

The exact implementation sequence is defined in `.agent/plans/WEBSITE_IMPLEMENTATION.md`.

---

# 20. Automotive Aftermarket Adaptation Rules

The ABB-inspired design language must be adapted to an automotive aftermarket distributor without turning into an automotive showroom.

## Emphasize

- Distribution
- Availability
- Scale
- Product expertise
- Supplier relationships
- Brands
- Warehousing
- Logistics
- Quality
- Technology
- Employees
- Corporate history

## De-emphasize

- Cars
- Mechanics
- Workshops
- Retail pricing
- Shopping behaviour
- B2B login flows
- Product-detail-heavy homepage content

---

# 21. Brand Presentation

A distributor may work with a very large number of brands.

Do not create an endless logo wall on the homepage.

Prefer:

- Curated strategic brand selection
- Strong whitespace
- Consistent logo sizing
- Monochrome treatment where appropriate
- Dedicated full brand directory elsewhere

Brand logos should never compete visually with the company's own identity.

---

# 22. Product Presentation

Products should be shown as part of expertise, not as e-commerce merchandise.

Preferred:

```text
Large category image
Category title
One-line description
Directional link
```

Avoid homepage patterns like:

```text
Product image
SKU
Price
Stock
Add to cart
```

The public corporate website and B2B platform are separate experiences.

---

# 23. Responsive Philosophy

Mobile must be designed intentionally, not treated as compressed desktop.

## Mobile Rules

- Preserve large typography
- Reduce but do not eliminate whitespace
- Stack editorial sections naturally
- Keep touch targets at least 44 × 44 px
- Simplify navigation
- Avoid horizontal overflow
- Avoid tiny logo grids
- Keep CTA hierarchy intact
- Maintain strong imagery

Hero content must remain readable without relying on exact image framing.

---

# 24. Accessibility

Minimum requirements:

- WCAG AA contrast
- Keyboard-accessible navigation
- Visible focus states
- Semantic heading hierarchy
- Alternative text for meaningful imagery
- Captions where required
- Reduced-motion support
- Touch-friendly interactive elements
- No information communicated by color alone

Corporate quality includes accessibility.

---

# 25. Interaction Quality

Every interaction should answer one of three purposes:

1. Show hierarchy
2. Confirm an action
3. Guide attention

If an animation does none of these, remove it.

---

# 26. Things We Explicitly Do Not Want

Do **not** introduce the following unless a specific future requirement justifies them:

- Glassmorphism
- Neon gradients
- 3D floating objects
- Particle backgrounds
- Excessive WebGL
- Scroll hijacking
- Cursor gimmicks
- Continuous horizontal logo marquees everywhere
- Huge rounded SaaS cards
- Cartoon illustrations
- Excessive car imagery
- Full-site dark mode as the main identity
- Heavy drop shadows
- Autoplay carousels with important content
- Multiple competing accent colors
- Every element animating on scroll
- Product catalogue as homepage
- E-commerce patterns
- B2B dashboard patterns

---

# 27. Design Tokens — Recommended Starting Point

These tokens are **our implementation baseline**, not an exact extraction of ABB's production CSS.

```css
:root {
  /* Brand */
  --brand-primary: #FF000F; /* temporary reference only */

  /* Surfaces */
  --surface-0: #FFFFFF;
  --surface-1: #F4F4F4;
  --surface-2: #EAEAEA;

  /* Text */
  --text-strong: #111111;
  --text-default: #333333;
  --text-muted: #6B6B6B;
  --text-on-dark: #FFFFFF;

  /* Borders */
  --border-subtle: #DDDDDD;
  --border-default: #BDBDBD;

  /* Layout */
  --content-max: 1360px;

  /* Radius */
  --radius-small: 2px;
  --radius-medium: 4px;
  --radius-pill: 999px;

  /* Motion */
  --motion-fast: 200ms;
  --motion-default: 350ms;
  --motion-reveal: 650ms;

  /* Easing */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

The final brand palette must replace `--brand-primary`.

---

# 28. Spacing Scale — Recommended Starting Point

Use a consistent spacing system.

```text
4
8
12
16
24
32
40
48
64
80
96
120
160
```

Avoid arbitrary values unless layout geometry requires them.

---

# 29. Border Radius Philosophy

The site should feel architectural rather than soft.

Default:

```text
0–4 px
```

Pill shapes may be used intentionally for:

- Primary CTA
- Tags
- Small status controls

Do not apply 16–32 px rounded corners to every container.

---

# 30. Shadows

Shadows should be rare.

Default components should rely on:

- Whitespace
- Borders
- Surface contrast
- Typography
- Image separation

If a shadow is necessary:

```text
very soft
very low opacity
large blur
```

No floating-dashboard effect.

---

# 31. Footer

Footer should feel substantial and corporate.

Possible characteristics:

- Strong dark or neutral contrast
- Clear information groups
- Corporate navigation
- Contact information
- Legal links
- Social channels where relevant
- Language / location selector
- Copyright

Avoid turning the footer into another marketing hero.

---

# 32. Design Quality Gate

Before approving any screen, ask:

### Corporate

- Does this look like a serious global company?
- Does the company feel larger than the individual products?
- Is the visual language trustworthy?

### Hierarchy

- Is there one obvious primary message?
- Can the section be understood in five seconds?
- Is the CTA hierarchy clear?

### Composition

- Is there enough whitespace?
- Is alignment disciplined?
- Are images large enough to matter?

### Typography

- Are headlines concise?
- Is type doing more work than decoration?
- Is body copy comfortably readable?

### Color

- Is the brand accent being used strategically?
- Is the page still predominantly neutral?
- Are contrast requirements satisfied?

### Motion

- Is motion restrained?
- Does it help comprehension?
- Would the page still look premium with motion disabled?

### Automotive Adaptation

- Does the site avoid looking like a repair shop?
- Does it avoid looking like an online parts store?
- Are cars supporting visuals instead of dominating visuals?
- Do logistics, brands, scale and company capability remain central?

If several answers are "no", the design has drifted away from this language.

---

# 33. One-Sentence Definition

> **A bright, typography-led, Swiss-inspired corporate web language that uses generous whitespace, authentic industrial imagery, one strong brand accent and restrained motion to communicate scale, precision and trust.**

---

# 34. Final Rule

When there is a choice between:

```text
more decoration
```

and:

```text
better hierarchy
```

always choose **better hierarchy**.

When there is a choice between:

```text
more automotive imagery
```

and:

```text
stronger corporate identity
```

always choose **stronger corporate identity**.

When there is a choice between:

```text
more animation
```

and:

```text
more confidence
```

always choose **more confidence**.
