import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function planNodeTypes(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return [
    ...(typeof record["Node Type"] === "string" ? [record["Node Type"]] : []),
    ...(Array.isArray(record.Plans) ? record.Plans.flatMap(planNodeTypes) : []),
  ];
}

describeWithDatabase("Milestone 8 PostgreSQL query safety", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({ connectionString: databaseUrl });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("keeps the operational list, retention, revision and audit indexes", async () => {
    const result = await pool.query<{ indexname: string }>(
      `select indexname from pg_indexes where schemaname = 'public'`,
    );
    const names = result.rows.map((row) => row.indexname);
    expect(names).toEqual(expect.arrayContaining([
      "career_application_status_created_idx",
      "career_application_retention_idx",
      "contact_submission_status_created_idx",
      "contact_submission_retention_idx",
      "page_route_key_unique",
      "content_revision_entity_locale_number_unique",
      "audit_event_resource_idx",
      "rate_limit_bucket_expiry_idx",
    ]));
  });

  it("can plan representative filtered admin queries through their bounded indexes", async () => {
    const client = await pool.connect();
    try {
      await client.query("set enable_seqscan = off");
      const statements = [
        "select id from page where route_key = 'home' limit 1",
        "select revision_no from content_revision where entity_type = 'page' and entity_id = '00000000-0000-4000-8000-000000000001' and locale = 'tr' order by revision_no desc limit 100",
        "select id from career_application where status = 'new' order by created_at desc limit 25",
        "select id from contact_submission where status = 'new' order by created_at desc limit 100",
        "select id from audit_event where resource_type = 'career_application' and resource_id = '00000000-0000-4000-8000-000000000001' order by created_at desc limit 100",
        "select id from rate_limit_bucket where expires_at <= now() limit 100",
      ];
      for (const statement of statements) {
        const explained = await client.query<{ "QUERY PLAN": unknown }>(
          `explain (format json) ${statement}`,
        );
        const root = (explained.rows[0]?.["QUERY PLAN"] as Array<{ Plan?: unknown }> | undefined)?.[0]?.Plan;
        expect(planNodeTypes(root), statement).toEqual(
          expect.arrayContaining([expect.stringMatching(/Index|Bitmap/)]),
        );
      }
    } finally {
      await client.query("reset enable_seqscan");
      client.release();
    }
  });
});
