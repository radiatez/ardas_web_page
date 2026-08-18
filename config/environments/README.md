# Environment Configuration

The committed files in this directory document non-secret configuration shape
for `local`, `staging`, and `production`.

Rules:

- copy only the local example to a developer-owned `.env.local`,
- inject staging and production values through the selected platform's secret manager,
- never copy production credentials into local or staging,
- keep candidate/contact data synthetic outside production,
- leave approval-gated retention values unset until approved.

Next.js reads root `.env*` files. The files here are references and must not be
loaded automatically in production.
