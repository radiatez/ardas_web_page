import pg from "pg";

const departmentId = "81000000-0000-4000-8000-000000000001";
const locations = [
  ["82000000-0000-4000-8000-000000000001", "istanbul", "İstanbul", "Istanbul"],
  ["82000000-0000-4000-8000-000000000002", "ankara", "Ankara", "Ankara"],
  ["82000000-0000-4000-8000-000000000003", "diyarbakir", "Diyarbakır", "Diyarbakır"],
] as const;

export default async function globalSetup() {
  const connectionString = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("E2E requires TEST_DATABASE_URL or DATABASE_URL.");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const department = await client.query<{ id: string }>(
      `insert into department (id, key, sort_order, status)
       values ($1, 'e2e-department', 0, 'active')
       on conflict (key) do update set status = 'active'
       returning id`,
      [departmentId],
    );
    const persistedDepartmentId = department.rows[0]?.id;
    if (!persistedDepartmentId) throw new Error("E2E department seed failed.");
    for (const locale of ["tr", "en"] as const) {
      await client.query(
        `insert into department_locale
          (department_id, locale, name, publish_status, published_at)
         values ($1, $2, $3, 'published', now() - interval '1 minute')
         on conflict (department_id, locale) do update set
          name = excluded.name, publish_status = 'published', published_at = excluded.published_at`,
        [persistedDepartmentId, locale, locale === "tr" ? "Test Departmanı" : "Test Department"],
      );
    }
    for (const [id, key, trName, enName] of locations) {
      const location = await client.query<{ id: string }>(
        `insert into location (id, key, sort_order, status)
         values ($1, $2, 0, 'active')
         on conflict (key) do update set status = 'active'
         returning id`,
        [id, key],
      );
      const persistedLocationId = location.rows[0]?.id;
      if (!persistedLocationId) throw new Error(`E2E location seed failed: ${key}`);
      for (const locale of ["tr", "en"] as const) {
        await client.query(
          `insert into location_locale
            (location_id, locale, name, publish_status, published_at)
           values ($1, $2, $3, 'published', now() - interval '1 minute')
           on conflict (location_id, locale) do update set
            name = excluded.name, publish_status = 'published', published_at = excluded.published_at`,
          [persistedLocationId, locale, locale === "tr" ? trName : enName],
        );
      }
    }
  } finally {
    await client.end();
  }
}
