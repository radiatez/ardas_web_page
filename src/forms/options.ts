import { and, asc, eq } from "drizzle-orm";

import { isPubliclyAvailable } from "@/content/publication";
import type { DatabaseClient } from "@/db/client";
import {
  departmentLocales,
  departments,
  locationLocales,
  locations,
} from "@/db/schema";
import type { Locale } from "@/i18n/config";

import { locationKeys, type LocationKey } from "./contracts";

export type CareerFormOption = { id: string; key: string; label: string };

export type CareerFormOptions = {
  departments: readonly CareerFormOption[];
  locations: readonly (CareerFormOption & { key: LocationKey })[];
};

export async function loadCareerFormOptions(
  db: DatabaseClient,
  locale: Locale,
  now = new Date(),
): Promise<CareerFormOptions> {
  const [departmentRows, locationRows] = await Promise.all([
    db
      .select({
        id: departments.id,
        key: departments.key,
        label: departmentLocales.name,
        locale: departmentLocales.locale,
        publishStatus: departmentLocales.publishStatus,
        publishedAt: departmentLocales.publishedAt,
        scheduledArchiveAt: departmentLocales.scheduledArchiveAt,
      })
      .from(departments)
      .innerJoin(
        departmentLocales,
        eq(departmentLocales.departmentId, departments.id),
      )
      .where(and(eq(departments.status, "active"), eq(departmentLocales.locale, locale)))
      .orderBy(asc(departments.sortOrder), asc(departmentLocales.name)),
    db
      .select({
        id: locations.id,
        key: locations.key,
        label: locationLocales.name,
        locale: locationLocales.locale,
        publishStatus: locationLocales.publishStatus,
        publishedAt: locationLocales.publishedAt,
        scheduledArchiveAt: locationLocales.scheduledArchiveAt,
      })
      .from(locations)
      .innerJoin(locationLocales, eq(locationLocales.locationId, locations.id))
      .where(and(eq(locations.status, "active"), eq(locationLocales.locale, locale)))
      .orderBy(asc(locations.sortOrder), asc(locationLocales.name)),
  ]);

  const departmentsResult = departmentRows
    .filter((row) => isPubliclyAvailable(row, now))
    .map(({ id, key, label }) => ({ id, key, label }));
  const locationsResult = locationRows.flatMap((row) =>
    locationKeys.includes(row.key as LocationKey) && isPubliclyAvailable(row, now)
      ? [{ id: row.id, key: row.key as LocationKey, label: row.label }]
      : [],
  );

  return { departments: departmentsResult, locations: locationsResult };
}

