export const locales = ["tr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "tr";

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === "tr" ? "en" : "tr";
}
