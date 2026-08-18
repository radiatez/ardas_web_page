import type { Locale } from "../i18n/config";

export type LocalePublication = {
  locale: Locale;
  publishStatus: "draft" | "published" | "archived";
  publishedAt: Date | null;
  scheduledArchiveAt: Date | null;
};

export function isPubliclyAvailable(
  publication: LocalePublication,
  now = new Date(),
): boolean {
  return (
    publication.publishStatus === "published" &&
    publication.publishedAt !== null &&
    publication.publishedAt <= now &&
    (publication.scheduledArchiveAt === null ||
      publication.scheduledArchiveAt > now)
  );
}

export function getPublishedLocaleVariant<T extends LocalePublication>(
  variants: ReadonlyArray<T>,
  locale: Locale,
  now = new Date(),
): T | undefined {
  const variant = variants.find((candidate) => candidate.locale === locale);

  return variant && isPubliclyAvailable(variant, now) ? variant : undefined;
}
