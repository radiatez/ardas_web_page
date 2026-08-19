import { pathToFileURL } from "node:url";

import { Pool, type PoolClient } from "pg";

import {
  getStructuralPage,
  publicPageRouteKeys,
  type PublicPageRouteKey,
} from "../src/content/public-pages.ts";
import { locales } from "../src/i18n/config.ts";
import {
  seedTemporaryLegalContent,
  type TemporaryLegalSeedResult,
} from "./seed-temporary-legal-content.ts";

export type ProductionContentSeedResult = {
  pagesInserted: number;
  pagesPreserved: number;
  settingsInserted: number;
  legal: TemporaryLegalSeedResult;
};

const verifiedCompanyStats = {
  experienceYearsMinimum: 30,
  brandCountMinimum: 150,
  productCountMinimum: 50_000,
  locationKeys: ["istanbul", "ankara", "diyarbakir"],
  nationwideDistribution: true,
} as const;

async function findOrCreatePage(
  client: PoolClient,
  routeKey: PublicPageRouteKey,
): Promise<string> {
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
  if (!existing.rows[0]) throw new Error("production_seed_page_resolution_failed");
  return existing.rows[0].id;
}

async function verifyStructuralReferenceData(client: PoolClient): Promise<void> {
  const departments = await client.query<{ count: number }>(
    `select count(*)::int as count
       from department d
      where d.status = 'active'
        and d.key = any($1::text[])
        and (select count(*) from department_locale dl where dl.department_id = d.id) = 2`,
    [["sales", "finance", "accounting", "it", "import-export", "warehouse-shipping"]],
  );
  const locations = await client.query<{ count: number }>(
    `select count(*)::int as count
       from location l
      where l.status = 'active'
        and l.key = any($1::text[])
        and (select count(*) from location_locale ll where ll.location_id = l.id) = 2`,
    [["istanbul", "ankara", "diyarbakir"]],
  );
  if (departments.rows[0]?.count !== 6 || locations.rows[0]?.count !== 3) {
    throw new Error("production_seed_structural_reference_data_missing");
  }
}

export async function seedProductionContent(
  pool: Pool,
): Promise<ProductionContentSeedResult> {
  const legal = await seedTemporaryLegalContent(pool);
  const client = await pool.connect();
  let pagesInserted = 0;
  let pagesPreserved = 0;
  let settingsInserted = 0;
  try {
    await client.query("begin");
    await verifyStructuralReferenceData(client);

    for (const routeKey of publicPageRouteKeys) {
      const pageId = await findOrCreatePage(client, routeKey);
      for (const locale of locales) {
        const existing = await client.query<{ id: string }>(
          "select id from page_locale where page_id = $1 and locale = $2",
          [pageId, locale],
        );
        if (existing.rows.length > 0) {
          pagesPreserved += 1;
          continue;
        }

        const page = getStructuralPage(routeKey, locale);
        const publishedAt = new Date();
        await client.query(
          `insert into page_locale
            (page_id, locale, slug, title, content_json, seo_title,
             seo_description, allow_indexing, publish_status, published_at)
           values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, 'published', $9)`,
          [
            pageId,
            locale,
            page.slug,
            page.title,
            JSON.stringify(page.content),
            page.seoTitle ?? null,
            page.seoDescription ?? null,
            page.allowIndexing !== false,
            publishedAt,
          ],
        );
        await client.query(
          `insert into content_revision
            (entity_type, entity_id, locale, revision_no, snapshot)
           values ('page', $1, $2, 1, $3::jsonb)`,
          [
            pageId,
            locale,
            JSON.stringify({
              slug: page.slug,
              title: page.title,
              contentJson: page.content,
              seoTitle: page.seoTitle ?? null,
              seoDescription: page.seoDescription ?? null,
              ogTitle: null,
              ogDescription: null,
              ogMediaId: null,
              allowIndexing: page.allowIndexing !== false,
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
        pagesInserted += 1;
      }
    }

    const setting = await client.query(
      `insert into site_setting (key, typed_value)
       values ('company_stats', $1::jsonb)
       on conflict (key) do nothing
       returning key`,
      [JSON.stringify(verifiedCompanyStats)],
    );
    settingsInserted = setting.rowCount ?? 0;

    await client.query("commit");
    return { pagesInserted, pagesPreserved, settingsInserted, legal };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const connectionString = process.env.MIGRATION_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL is required for the production content seed.");
  const pool = new Pool({ connectionString, max: 2 });
  try {
    const result = await seedProductionContent(pool);
    process.stdout.write(
      `Production content seed complete: ${result.pagesInserted} pages inserted, ${result.pagesPreserved} preserved, ${result.settingsInserted} settings inserted; legal ${result.legal.inserted} inserted/${result.legal.skipped} preserved.\n`,
    );
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Production content seed failed."}\n`,
    );
    process.exitCode = 1;
  });
}
