# Ardaş Web Project — Agent Instructions v0.3

## 1. Project Identity

Project: **Ardaş Yedek Parça corporate website**

Ardaş is an automotive aftermarket replacement-parts distributor.

Approved facts:

- Warehouses / locations: İstanbul, Ankara, Diyarbakır
- Distribution: Türkiye geneli kargo / dağıtım
- Experience: 30+ years
- Brand portfolio: 150+ brands
- Product scale: 50,000+ products
- Public languages: Turkish and English
- Admin UI language: Turkish
- Public contact form: required
- Career/general application: required
- Dealer Portal action: required

Temporary Dealer Portal URL:

`https://online.bsdotomotiv.com/web`

## 2. Technology Baseline

Selected before scaffold:

```text
Framework: Next.js
Language: TypeScript
Package manager: pnpm
Database engine: PostgreSQL
```

Exact package/library versions are selected during Milestone 0.

Do not switch framework/package manager/database engine without recording a new accepted decision.

## 3. Product Definition

This is a **public corporate website**, not:

- B2B replacement,
- e-commerce storefront,
- repair-shop website,
- vehicle showroom,
- marketplace,
- SaaS dashboard.

## 4. Mandatory Reading

Before substantial work:

1. `docs/PROJECT_BRIEF.md`
2. `.agent/DECISIONS.md`
3. `.agent/RISKS.md`
4. `.agent/plans/WEBSITE_IMPLEMENTATION.md`

When relevant also read:

- design skills/references,
- `docs/architecture/*`,
- `docs/requirements/*`,
- `docs/security/*`,
- `docs/testing/TEST_MATRIX.md`,
- `docs/operations/*`,
- `docs/legal/PUBLIC_LEGAL_PAGES.md`,
- `docs/content/CONTENT_INVENTORY.md`.

## 5. Internationalization Is Foundational

TR/EN exists from the first real application commit.

Authoritative policy:

`docs/requirements/I18N.md`

Rules:

- `/` redirects to `/tr`
- localized slugs are used
- internal route/entity IDs are language-neutral
- localized entities have their own publication state
- unavailable/unpublished locale variant returns 404
- language switch falls back to target locale homepage only when equivalent page is unavailable

## 6. Canonical Homepage Narrative

Use one conceptual order:

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

This is the canonical design narrative across documents.

## 7. Design Authority

The visual source of truth is:

`.agents/skills/corporate-web-design/references/DESIGN_LANGUAGE.md`

Direction:

- bright,
- corporate,
- typography-led,
- Swiss-inspired,
- precise,
- spacious,
- industrial,
- restrained,
- premium.

ABB is a design-language reference only.

## 8. Admin Security

Before production:

- MFA is mandatory for all admin users,
- no public registration,
- server-side permission enforcement,
- permission-based RBAC,
- sensitive actions audited,
- admin sessions secure/revocable.

Authoritative matrix:

`docs/security/RBAC_MATRIX.md`

## 9. Career Security Gate

Do not enable public career submission until:

- admin auth + MFA work,
- RBAC tests pass,
- protected storage works,
- CV accepts PDF only,
- max CV size is 10 MB,
- malware scanning is active,
- scan failure/unavailability leaves file quarantined and inaccessible,
- server validation is complete,
- audit foundation exists,
- retention/deletion mechanism exists,
- privacy notice versioning exists,
- abuse/rate protection exists.

## 10. Career Required Fields

Core required fields:

- First name
- Last name
- Phone
- Email
- Department
- Target warehouse/location
- Expected net monthly salary (TRY)
- Available/start date
- About/self-introduction
- CV (PDF)

Approval-gated fields remain modeled but must not ship without approval:

- Gender
- Date of birth
- Marital status
- Military status/deferment data

## 11. Contact Data

Contact messages are personal data.

Only explicit contact permissions may access/manage them.

Do not grant contact-message access to generic Viewer or Content Editor roles.

## 12. Dealer Portal Security

Resolution:

```text
validated site setting
→ environment fallback
→ disabled/unavailable
```

Rules:

- HTTPS only,
- server-side URL parsing/validation,
- optional allowed-host policy,
- Super Admin update permission,
- audit old/new values.

## 13. Publishing

Initial v1 workflow:

- authorized Content Editor can publish public content directly,
- no mandatory second approver,
- revision history is mandatory,
- preview is mandatory,
- rollback is mandatory,
- scheduled publishing is mandatory,
- publication state is per locale,
- important actions are audited.

## 14. Personal Data / Privacy

Career and contact submissions must record:

- submission locale,
- privacy notice version shown,
- notice shown timestamp,
- acknowledgement timestamp when applicable.

Do not keep personal data indefinitely.

Exact legal text and retention durations remain production launch gates.

## 15. Engineering Quality Gates

Target:

- WCAG 2.2 AA
- latest 2 stable Chrome / Edge / Firefox / Safari
- current iOS Safari / Android Chrome
- CWV p75:
  - LCP ≤ 2.5s
  - INP ≤ 200ms
  - CLS ≤ 0.10
- lint/typecheck/test/build pass
- critical E2E pass
- PII-safe logs
- responsive/mobile pass

## 16. Planning

For substantial work:

- update `.agent/plans/WEBSITE_IMPLEMENTATION.md`,
- record decisions in `.agent/DECISIONS.md`,
- update `.agent/RISKS.md`,
- record validation per milestone.

## 17. Missing Business Information

Use explicit `TBD`.

Do not invent:

- legal company name,
- exact addresses,
- phone/email,
- final logo/colors/fonts,
- legal text,
- final brand list,
- final product taxonomy,
- approved photography.
