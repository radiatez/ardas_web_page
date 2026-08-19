import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { seedTemporaryLegalContent } from "../../scripts/seed-temporary-legal-content";
import { temporaryLegalVersion } from "../../src/content/legal-content";
import { createDatabase } from "../../src/db/client";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("temporary legal CMS seed on PostgreSQL", () => {
  const database = databaseUrl ? createDatabase(databaseUrl) : undefined;

  beforeAll(async () => {
    if (database) await seedTemporaryLegalContent(database.pool);
  });

  afterAll(async () => {
    await database?.pool.end();
  });

  it("seeds six published localized legal pages and their initial revisions", async () => {
    if (!database) return;
    const rows = await database.pool.query<{
      route_key: string;
      locale: string;
      content: Record<string, unknown>;
      publish_status: string;
      allow_indexing: boolean;
      revision_count: number;
    }>(
      `select p.route_key, pl.locale, pl.content_json as content,
              pl.publish_status, pl.allow_indexing,
              count(cr.id)::int as revision_count
       from page p
       join page_locale pl on pl.page_id = p.id
       left join content_revision cr
         on cr.entity_type = 'page' and cr.entity_id = p.id and cr.locale = pl.locale
       where p.route_key in ('privacy', 'cookies', 'data-protection')
       group by p.route_key, pl.locale, pl.content_json, pl.publish_status, pl.allow_indexing`,
    );
    expect(rows.rows).toHaveLength(6);
    for (const row of rows.rows) {
      expect(row.publish_status).toBe("published");
      expect(row.allow_indexing).toBe(false);
      expect(row.revision_count).toBe(1);
      expect(row.content).toMatchObject({
        legal_status: "temporary",
        legal_version: temporaryLegalVersion,
        requires_legal_review: true,
      });
    }
  });

  it("is idempotent and never overwrites an existing CMS version", async () => {
    if (!database) return;
    const before = await database.pool.query<{ content: Record<string, unknown>; revisions: number }>(
      `select pl.content_json as content, count(cr.id)::int as revisions
       from page p join page_locale pl on pl.page_id = p.id
       left join content_revision cr on cr.entity_type = 'page' and cr.entity_id = p.id and cr.locale = pl.locale
       where p.route_key = 'privacy' and pl.locale = 'tr'
       group by pl.content_json`,
    );
    const result = await seedTemporaryLegalContent(database.pool);
    const after = await database.pool.query<{ content: Record<string, unknown>; revisions: number }>(
      `select pl.content_json as content, count(cr.id)::int as revisions
       from page p join page_locale pl on pl.page_id = p.id
       left join content_revision cr on cr.entity_type = 'page' and cr.entity_id = p.id and cr.locale = pl.locale
       where p.route_key = 'privacy' and pl.locale = 'tr'
       group by pl.content_json`,
    );
    expect(result.inserted).toBe(0);
    expect(result.skipped).toBe(10);
    expect(after.rows[0]).toEqual(before.rows[0]);
  });
});

