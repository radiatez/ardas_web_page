import { pathToFileURL } from "node:url";

import { Pool, type PoolClient } from "pg";

import { temporaryCmsSeedPages } from "../src/content/temporary-legal-content.ts";

export type TemporaryLegalSeedResult = {
  inserted: number;
  skipped: number;
};

async function findOrCreatePage(
  client: PoolClient,
  routeKey: (typeof temporaryCmsSeedPages)[number]["routeKey"],
) {
  const inserted = await client.query<{ id: string }>(
    `insert into page (route_key, template_key)
     values ($1::route_key, $2)
     on conflict (route_key) do nothing
     returning id`,
    [routeKey, routeKey],
  );
  if (inserted.rows[0]) return inserted.rows[0].id;
  const existing = await client.query<{ id: string }>(
    "select id from page where route_key = $1",
    [routeKey],
  );
  if (!existing.rows[0]) throw new Error("legal_seed_page_resolution_failed");
  return existing.rows[0].id;
}

export async function seedTemporaryLegalContent(
  pool: Pool,
): Promise<TemporaryLegalSeedResult> {
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;
  try {
    await client.query("begin");
    for (const page of temporaryCmsSeedPages) {
      const pageId = await findOrCreatePage(client, page.routeKey);
      const existing = await client.query<{ id: string }>(
        "select id from page_locale where page_id = $1 and locale = $2",
        [pageId, page.locale],
      );
      if (existing.rows.length > 0) {
        skipped += 1;
        continue;
      }

      const publishedAt = new Date();
      await client.query(
        `insert into page_locale
          (page_id, locale, slug, title, content_json, seo_title,
           seo_description, allow_indexing, publish_status, published_at)
         values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, 'published', $9)`,
        [
          pageId,
          page.locale,
          page.slug,
          page.title,
          JSON.stringify(page.content),
          page.seoTitle,
          page.seoDescription,
          page.allowIndexing,
          publishedAt,
        ],
      );
      const latest = await client.query<{ revision_no: number }>(
        `select coalesce(max(revision_no), 0)::int as revision_no
         from content_revision
         where entity_type = 'page' and entity_id = $1 and locale = $2`,
        [pageId, page.locale],
      );
      const revisionNo = Number(latest.rows[0]?.revision_no ?? 0) + 1;
      await client.query(
        `insert into content_revision
          (entity_type, entity_id, locale, revision_no, snapshot)
         values ('page', $1, $2, $3, $4::jsonb)`,
        [
          pageId,
          page.locale,
          revisionNo,
          JSON.stringify({
            slug: page.slug,
            title: page.title,
            contentJson: page.content,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            ogTitle: null,
            ogDescription: null,
            ogMediaId: null,
            allowIndexing: page.allowIndexing,
            publishStatus: "published",
            publishedAt: publishedAt.toISOString(),
            scheduledPublishAt: null,
            scheduledArchiveAt: null,
          }),
        ],
      );
      await client.query("update page set updated_at = $2 where id = $1", [
        pageId,
        publishedAt,
      ]);
      inserted += 1;
    }
    await client.query("commit");
    return { inserted, skipped };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required for the CMS legal seed.");
  const pool = new Pool({ connectionString, max: 2 });
  try {
    const result = await seedTemporaryLegalContent(pool);
    process.stdout.write(
      `Temporary legal CMS seed complete: ${result.inserted} inserted, ${result.skipped} preserved.\n`,
    );
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Temporary legal CMS seed failed."}\n`,
    );
    process.exitCode = 1;
  });
}
