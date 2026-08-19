import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("generated PostgreSQL migration", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({ connectionString: databaseUrl });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("runs against the selected PostgreSQL major version", async () => {
    const result = await pool.query<{ server_version: string }>(
      "select current_setting('server_version') as server_version",
    );

    expect(result.rows[0]?.server_version).toMatch(/^18\./);
  });

  it("creates the complete Milestone 6 table set on a clean database", async () => {
    const result = await pool.query<{ table_name: string }>(
      `select table_name
         from information_schema.tables
        where table_schema = 'public'
        order by table_name`,
    );
    const tableNames = result.rows.map(({ table_name }) => table_name);

    expect(tableNames).toEqual(
      expect.arrayContaining([
        "admin_user",
        "application_status_history",
        "audit_event",
        "brand",
        "brand_locale",
        "career_application",
        "career_application_note",
        "contact_submission",
        "contact_submission_note",
        "content_draft",
        "content_revision",
        "department",
        "department_locale",
        "job_posting",
        "job_posting_locale",
        "location",
        "location_locale",
        "media",
        "media_locale",
        "malware_scan_event",
        "page",
        "page_locale",
        "permission",
        "product_group",
        "product_group_locale",
        "rate_limit_bucket",
        "role",
        "role_permission",
        "site_setting",
        "slug_redirect",
        "submission_notification",
        "user_role",
      ]),
    );
  });

  it("seeds managed bilingual career departments and stable locations", async () => {
    const departments = await pool.query<{ key: string; locales: string[] }>(
      `select d.key, array_agg(dl.locale::text order by dl.locale::text) as locales
         from department d
         join department_locale dl on dl.department_id = d.id
        where d.key = any($1::text[])
        group by d.key`,
      [["sales", "finance", "accounting", "it", "import-export", "warehouse-shipping"]],
    );
    const locations = await pool.query<{ key: string; locales: string[] }>(
      `select l.key, array_agg(ll.locale::text order by ll.locale::text) as locales
         from location l
         join location_locale ll on ll.location_id = l.id
        where l.key = any($1::text[])
        group by l.key`,
      [["istanbul", "ankara", "diyarbakir"]],
    );
    expect(departments.rows).toHaveLength(6);
    expect(locations.rows).toHaveLength(3);
    for (const row of [...departments.rows, ...locations.rows]) {
      expect(row.locales).toEqual(["en", "tr"]);
    }
  });

  it("records the committed Drizzle migration", async () => {
    const result = await pool.query<{ migration_count: string }>(
      "select count(*)::text as migration_count from public.__drizzle_migrations",
    );

    expect(Number(result.rows[0]?.migration_count)).toBeGreaterThan(0);
  });
});
