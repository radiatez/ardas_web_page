import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabase } from "../../src/db/client";
import { loadPublishedPageBundle } from "../../src/public/content-repository";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("public content publication on PostgreSQL", () => {
  const pageId = randomUUID();
  const trLocaleId = randomUUID();
  const enLocaleId = randomUUID();
  const database = databaseUrl ? createDatabase(databaseUrl) : undefined;

  beforeAll(async () => {
    if (!database) return;
    await database.pool.query("delete from page where route_key = $1", ["corporate"]);
    await database.pool.query(
      "insert into page (id, route_key, template_key) values ($1, $2, $3)",
      [pageId, "corporate", "corporate-v1"],
    );
    await database.pool.query(
      `insert into page_locale
        (id, page_id, locale, slug, title, content_json, publish_status, published_at)
       values
        ($1, $3, 'tr', 'kurumsal', 'Kurumsal', $4::jsonb, 'published', $6),
        ($2, $3, 'en', 'corporate', 'Corporate', $5::jsonb, 'draft', null)`,
      [
        trLocaleId,
        enLocaleId,
        pageId,
        JSON.stringify({ hero: { heading: "Yayımlı kurumsal içerik" } }),
        JSON.stringify({ hero: { heading: "Draft corporate content" } }),
        new Date("2026-01-01T00:00:00.000Z"),
      ],
    );
  });

  afterAll(async () => {
    if (!database) return;
    await database.pool.query("delete from page where id = $1", [pageId]);
    await database.pool.end();
  });

  it("returns the published locale and excludes the draft equivalent", async () => {
    if (!database) return;
    const now = new Date("2026-08-19T00:00:00.000Z");
    const turkish = await loadPublishedPageBundle(database.db, "corporate", "tr", { now });
    const english = await loadPublishedPageBundle(database.db, "corporate", "en", { now });

    expect(turkish?.page.content.hero.heading).toBe("Yayımlı kurumsal içerik");
    expect(turkish?.page.availableLocales).toEqual(["tr"]);
    expect(english).toBeUndefined();
  });

  it("rejects a published row whose localized slug does not match the route registry", async () => {
    if (!database) return;
    await database.pool.query(
      "update page_locale set slug = 'wrong-slug' where id = $1",
      [trLocaleId],
    );
    const result = await loadPublishedPageBundle(database.db, "corporate", "tr", {
      now: new Date("2026-08-19T00:00:00.000Z"),
    });
    expect(result).toBeUndefined();
  });
});
