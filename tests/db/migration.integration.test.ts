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

  it("creates the complete Milestone 1 table set on a clean database", async () => {
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
        "content_revision",
        "department",
        "department_locale",
        "job_posting",
        "job_posting_locale",
        "location",
        "location_locale",
        "media",
        "media_locale",
        "page",
        "page_locale",
        "permission",
        "product_group",
        "product_group_locale",
        "role",
        "role_permission",
        "site_setting",
        "slug_redirect",
        "user_role",
      ]),
    );
  });

  it("records the committed Drizzle migration", async () => {
    const result = await pool.query<{ migration_count: string }>(
      "select count(*)::text as migration_count from public.__drizzle_migrations",
    );

    expect(Number(result.rows[0]?.migration_count)).toBeGreaterThan(0);
  });
});
