import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/i18n/routes";

type BrandWordmarkProps = {
  locale: Locale;
  inverse?: boolean;
};

export function BrandWordmark({ locale, inverse = false }: BrandWordmarkProps) {
  return (
    <Link
      className="brand-wordmark"
      data-inverse={inverse || undefined}
      href={getLocalizedPath("home", locale)}
      aria-label={`Ardaş Yedek Parça · ${
        locale === "tr" ? "Ana Sayfa" : "Home"
      }`}
    >
      <span aria-hidden="true">ARDAŞ</span>
    </Link>
  );
}
