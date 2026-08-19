# Public Legal Pages

> Routes and CMS behavior are technical/product decisions. `TEMP-2026-08-V1`
> is a usable temporary baseline, not lawyer-approved final text.

## Routes

Turkish:

```text
/tr/gizlilik
/tr/cerez-politikasi
/tr/kvkk
```

English:

```text
/en/privacy
/en/cookie-policy
/en/data-protection
```

## CMS Scope

Legal pages support:

- TR/EN content,
- Draft/Published/Archived,
- preview,
- revision history,
- rollback,
- scheduled publication,
- SEO metadata,
- audit.

## Publishing

Temporary content may be published only with all of this metadata:

```text
legal_status = temporary
legal_version = TEMP-2026-08-V1
requires_legal_review = true
```

The admin UI identifies it as `Geçici metin — hukuk onayı bekleniyor`.
The public page does not show a development banner. Temporary seed pages are
`noindex` and contain substantive TR/EN copy rather than placeholders.

Approved content requires `legal_status = approved`, a non-temporary new
version, `requires_legal_review = false` and an approval reference. Changing a
legal page or embedded form notice without changing its version is rejected.
The approved text is saved as a new immutable CMS revision; previous revisions
are not overwritten.

The CMS seed creates only missing locale records and never overwrites existing
content. It does not represent legal approval.

## Cookie Policy

The temporary policy records the current implementation: no public
analytics/advertising tracker and no public `localStorage`/`sessionStorage` use;
Auth0 admin security/session cookies are strictly necessary.

If only strictly necessary cookies are used, UI requirements may differ.

Once non-essential analytics/marketing cookies are introduced, consent requirements must be reviewed and implemented before activation.

## Form Privacy Notice Versions

Career/contact submissions record the version of the relevant notice shown at submission time.

The checkbox acknowledges that the notice was read; it is not modeled or
worded as explicit consent. A later lawyer-approved notice is a new version and
revision. Historic submissions retain their original locale, shown/acknowledged
timestamps and notice version.

Production forms fail closed while the active notice is temporary or still
requires legal review.

Verified data-controller identity and application channels are read only from
`contact_footer.legalController` in Site Settings. No identity, address or email
fallback is invented.
