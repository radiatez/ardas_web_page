# Production Readiness — External & Legal Inputs

This register lists inputs that the application must not invent. Temporary
legal content is suitable for review and non-production presentation only; it
does not close these launch gates.

## Legal identity and contact

- Exact legal company name/title: `TBD`
- Registered address and any legally required identifiers (including MERSİS,
  tax, KEP where applicable): `TBD`
- Verified data-controller application channels: `TBD`
- Approved legal/contact email, if used: `TBD`
- Responsible legal approver and traceable approval reference: `TBD`

Only verified controller identity and channels may be entered under the
non-secret Site Setting below:

```json
{
  "legalController": {
    "identity": "verified value",
    "contactChannels": ["verified channel"]
  }
}
```

The setting key is `contact_footer`. Missing values remain absent on the public
page; there is no fabricated fallback.

## Approved legal content

- Lawyer-approved TR/EN Privacy Policy: `TBD`
- Lawyer-approved TR/EN KVKK/Data Protection Notice: `TBD`
- Lawyer-approved TR/EN Cookie Policy: `TBD`
- Lawyer-approved TR/EN career short notice: `TBD`
- Lawyer-approved TR/EN contact short notice: `TBD`
- Confirmed processing purposes, legal grounds and recipient/transfer wording:
  `TBD`

Approved copy must be added through CMS as a new immutable revision and a new,
non-`TEMP` legal version with an approval reference. It must not overwrite
`TEMP-2026-08-V1` or change historic submission provenance.

## Retention and privacy operations

- Approved candidate retention days: `TBD`
- Approved contact retention days: `TBD`
- Approved audit retention days: `TBD`
- Legal-hold, deletion/anonymization and data-subject request operating policy:
  `TBD`

No default duration may be inferred from the temporary legal copy.

## Providers and international transfers

- Provider contracts, DPA/subprocessor lists and processing regions: `TBD`
- Legal assessment of any transfer outside Türkiye: `TBD`
- Any required safeguards or transfer instrument: `TBD`
- Auth0, Neon, AWS, SES and monitoring production-account evidence: `TBD`

The temporary notice deliberately makes no claim that a DPA, SCC or other
transfer mechanism is complete.

## Cookies and tracking

The current code has no public analytics/advertising tracker and no public
browser-storage preference mechanism. Auth0 admin session/security cookies are
strictly necessary. Before adding any non-essential cookie, analytics, pixel or
tracking technology:

- update and approve the cookie inventory/policy,
- complete the legal assessment,
- implement and verify the required preference/consent mechanism,
- prevent the technology from loading before that mechanism permits it.

## Production form gate

Career and contact forms remain disabled unless the active locale notice is
published, matches the configured version, is marked approved, no longer
requires legal review and contains a traceable approval reference. All other
security, retention, provider and notification gates remain in force.
