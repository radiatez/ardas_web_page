# Career / General Job Application Requirements v0.3

## Model

Initial recruitment flow:

**General application**

Future vacancy-specific support:

```text
job_posting_id = nullable
```

## Routes

```text
/tr/kariyer
/tr/kariyer/basvuru
/en/careers
/en/careers/apply
```

## Security Gate

Public production submission remains disabled until:

- admin auth + MFA,
- permission RBAC,
- protected storage,
- PDF validation,
- mandatory malware scan,
- fail-closed quarantine,
- server validation,
- audit,
- retention/deletion,
- privacy notice versioning,
- rate/abuse protection

pass validation.

## Required Core Fields

### First Name / İsim
Required.

### Last Name / Soyisim
Required.

### Phone / İletişim Numarası
Required.

TR display:

```text
+90 (xxx) xxx xx xx
```

Store normalized phone.

### Email / E-posta
Required.

Normalize case/whitespace appropriately.

### Department / Başvurulan Departman
Required.

Departments are managed entities, not permanent enum constants.

Initial records:

- Satış Temsilcisi
- Finans
- Muhasebe
- Bilgi İşlem
- İthalat & İhracat
- Depo & Sevkiyat

### Target Warehouse / Başvurulan Depo
Required.

Initial:

- İstanbul
- Ankara
- Diyarbakır

### Expected Net Monthly Salary / İstenen Aylık Ücret
Required.

- TRY
- net monthly expectation
- numeric/currency

### Availability / Ne Zaman İşe Başlayabilirsiniz?
Required.

Prefer structured date.

### About You / Kısaca Kendinizi Tanıtın
Required.

- multiline
- reasonable server-side length cap

### CV
Required.

v1:

```text
PDF only
max 10 MB
```

Security:

`../security/FILE_UPLOAD_SECURITY.md`

## Approval-Gated Fields

These remain modeled because they are currently requested, but production collection requires approval:

### Gender / Cinsiyet
Approval-gated.

### Date of Birth / Doğum Tarihi
Approval-gated.

### Marital Status / Medeni Hal
Approval-gated.

### Military Status / Askerlik Durumu
Approval-gated and conditional.

If gender = Male and the field is enabled:

```text
Military Status required
```

Options:

- Completed
- Not Completed
- Deferred

If Deferred:

```text
Deferment Date required
```

## Company Awareness

Required:

```text
Do you know our company? Yes/No
```

If Yes:

```text
Source / Where from? required
```

## Privacy Provenance

Every accepted application stores:

```text
locale
privacy_notice_version
privacy_notice_shown_at
privacy_acknowledged_at
```

If acknowledgement is legally not a "consent" but only confirmation of notice display, field naming/UI must match approved legal language.

Do not invent legal semantics.

## Submission Flow

1. Client UX validation.
2. Server validation.
3. Abuse/rate control.
4. Privacy notice/version validation.
5. PDF upload validation.
6. Quarantine.
7. Mandatory malware scan.
8. If clean → protected storage/access state.
9. Create application record.
10. Operational/audit event.
11. Queue/send HR notification.
12. Success response.

Email failure never discards stored application.

## Scanner Failure

Fail closed:

```text
scanner unavailable/error
→ file remains quarantined
→ HR cannot download
→ operational alert/retry
```

## Admin/HR Management

Management UI is delivered later than public persistence.

Milestone 5 validates:

- public submission,
- protected storage,
- persisted record.

Milestone 7 validates:

- HR list/detail,
- CV download,
- notes,
- status,
- retention.

Implemented Milestone 7 behavior:

- server-side search/filter/pagination with a minimum-PII list projection,
- protected detail with privacy provenance, internal notes and status history,
- forward-only `New → In Review → Interview → Hired/Rejected → Archived`
  lifecycle with valid early reject/archive branches,
- clean/protected/MFA/permission/application-relationship CV enforcement,
- due/no-active-hold HR anonymization and Super Admin `all`-scope override/delete,
- PII-safe career-scoped audit.

## Retention

No indefinite retention.

See:

`../security/PRIVACY_RETENTION.md`
