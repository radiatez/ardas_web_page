import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/i18n/routes";
import type { PublicNavigationItem } from "@/content/public-shell";

type PublicNavigationProps = {
  items: readonly PublicNavigationItem[];
  locale: Locale;
  label: string;
  onNavigate?: () => void;
};

export function PublicNavigation({
  items,
  locale,
  label,
  onNavigate,
}: PublicNavigationProps) {
  return (
    <nav aria-label={label} className="public-navigation">
      <ul>
        {items.map((item) => (
          <li key={item.routeKey}>
            <Link
              href={getLocalizedPath(item.routeKey, locale)}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
