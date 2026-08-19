import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { temporaryLegalVersion } from "../../src/content/legal-content";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("production-safe structural seed on PostgreSQL", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({ connectionString: databaseUrl });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("publishes the bilingual home baseline with initial revision history", async () => {
    const result = await pool.query<{
      locale: string;
      publish_status: string;
      allow_indexing: boolean;
      revision_count: number;
    }>(
      `select pl.locale, pl.publish_status, pl.allow_indexing,
              count(cr.id)::int as revision_count
         from page p
         join page_locale pl on pl.page_id = p.id
         left join content_revision cr
           on cr.entity_type = 'page' and cr.entity_id = p.id and cr.locale = pl.locale
        where p.route_key = 'home'
        group by pl.locale, pl.publish_status, pl.allow_indexing
        order by pl.locale`,
    );
    expect(result.rows).toEqual([
      { locale: "tr", publish_status: "published", allow_indexing: true, revision_count: 1 },
      { locale: "en", publish_status: "published", allow_indexing: true, revision_count: 1 },
    ]);
  });

  it("stores only the verified company-scale facts", async () => {
    const result = await pool.query<{ typed_value: Record<string, unknown> }>(
      "select typed_value from site_setting where key = 'company_stats'",
    );
    expect(result.rows[0]?.typed_value).toEqual({
      experienceYearsMinimum: 30,
      brandCountMinimum: 150,
      productCountMinimum: 50_000,
      locationKeys: ["istanbul", "ankara", "diyarbakir"],
      nationwideDistribution: true,
    });
  });

  it("preserves temporary legal provenance and migration-owned reference data", async () => {
    const legal = await pool.query<{ legal_version: string }>(
      `select pl.content_json->>'legal_version' as legal_version
         from page p join page_locale pl on pl.page_id = p.id
        where p.route_key = 'privacy' and pl.locale = 'tr'`,
    );
    const references = await pool.query<{ departments: number; locations: number }>(
      `select
         (select count(*)::int from department where status = 'active') as departments,
         (select count(*)::int from location where status = 'active') as locations`,
    );
    expect(legal.rows[0]?.legal_version).toBe(temporaryLegalVersion);
    expect(references.rows[0]).toEqual({ departments: 6, locations: 3 });
  });
});
