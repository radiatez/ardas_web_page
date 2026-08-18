# Ardaş Yedek Parça — Project Brief v0.2

## Company

**Display name:** Ardaş Yedek Parça
**Short brand:** Ardaş
**Industry:** Automotive Aftermarket
**Business model:** Replacement-parts distribution / wholesale-oriented corporate organization
**Coverage:** Türkiye geneli kargo / dağıtım

Locations:

- İstanbul
- Ankara
- Diyarbakır

Approved public metrics:

- **3 ilde**
- **30+ yıl**
- **150+ marka**
- **50.000+ ürün**

Do not invent additional numerical claims.

## Website Purpose

Primary goals:

1. Establish corporate trust.
2. Communicate scale and experience.
3. Present brand/portfolio breadth.
4. Show distribution/warehouse capability.
5. Provide corporate information.
6. Support recruitment.
7. Accept corporate contact requests.
8. Route dealers to existing Dealer Portal.
9. Allow staff to manage bilingual content through admin.

## Explicit Non-Goals

Initial public site is not:

- B2B replacement,
- public e-commerce checkout,
- public pricing/stock portal,
- repair/service booking,
- vehicle sales/showroom.

## Design

Primary direction:

**ABB-inspired corporate web language**

Characteristics:

- bright,
- spacious,
- typographic,
- precise,
- corporate-industrial,
- restrained motion,
- authentic operational imagery,
- limited vehicle dominance.

## Languages

Required from day one:

- Turkish
- English

Authoritative URL/content policy:

`requirements/I18N.md`

## Public Navigation

TR:

```text
Ana Sayfa
Kurumsal
Markalar
Ürün Grupları
Depolar
Kariyer
İletişim
[Bayi Otomasyonu]
```

EN:

```text
Home
Corporate
Brands
Product Groups
Locations
Careers
Contact
[Dealer Portal]
```

## Dealer Portal

Temporary URL:

`https://online.bsdotomotiv.com/web`

Configuration/security policy is defined in:

- `AGENTS.md`
- `security/SECURITY_BASELINE.md`

## Careers

Initial model:

**General application**

Future job-posting-specific applications are supported through nullable `job_posting_id`.

Detailed requirement:

`requirements/CAREER_APPLICATION.md`

## Contact

A public contact form is required.

Detailed requirement:

`requirements/CONTACT_FORM.md`

## Admin

Admin interface language:

**Turkish**

Admin manages bilingual public content.

Detailed requirement:

`requirements/ADMIN_PANEL.md`

Permission model:

`security/RBAC_MATRIX.md`

## Architecture

See:

- `architecture/ARCHITECTURE.md`
- `architecture/DATA_MODEL.md`
- `architecture/ADR.md`
- `architecture/ENVIRONMENTS.md`

## Launch Gates / TBD

Before production:

- final logo,
- final brand palette,
- final font,
- exact legal company name,
- exact addresses,
- phone/email,
- brand list,
- product group taxonomy,
- real photography/video,
- approved candidate/contact privacy text,
- approved retention durations,
- selected hosting/database/storage/auth/email providers.

## Canonical Homepage Narrative

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


## Technology Baseline

```text
Next.js
TypeScript
pnpm
PostgreSQL
```

## Admin Roles

Initial roles:

- Super Admin
- Content Editor
- HR
- Contact Manager
- Viewer

## Public Legal Routes

TR:

- `/tr/gizlilik`
- `/tr/cerez-politikasi`
- `/tr/kvkk`

EN:

- `/en/privacy`
- `/en/cookie-policy`
- `/en/data-protection`
