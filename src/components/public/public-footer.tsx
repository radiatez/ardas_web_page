import Link from "next/link";

import { publicShellCopy } from "@/content/public-shell";
import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/i18n/routes";
import type { DealerPortalResolution } from "@/security/dealer-portal";

import { BrandWordmark } from "./brand-wordmark";
import { DealerPortalLink } from "./dealer-portal-link";

type PublicFooterProps = {
  locale: Locale;
  dealerPortal: DealerPortalResolution;
};

export function PublicFooter({ locale, dealerPortal }: PublicFooterProps) {
  const copy = publicShellCopy[locale];

  return (
    <footer className="public-footer">
      <div className="ds-container public-footer__inner">
        <div className="public-footer__brand">
          <BrandWordmark inverse locale={locale} />
          <p>{copy.industryLabel}</p>
        </div>

        <nav aria-label={copy.footerNavigationLabel} className="public-footer__group">
          <h2>{copy.footerNavigationLabel}</h2>
          <ul>
            {copy.navigation.map((item) => (
              <li key={item.routeKey}>
                <Link href={getLocalizedPath(item.routeKey, locale)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="public-footer__group">
          <h2>{copy.locationsLabel}</h2>
          <ul>
            {copy.locationNames.map((location) => (
              <li key={location}>{location}</li>
            ))}
          </ul>
        </section>

        <section className="public-footer__group">
          <h2>{copy.contactLabel}</h2>
          <p>{copy.contactPlaceholder}</p>
          <DealerPortalLink
            label={copy.dealerPortalLabel}
            placement="footer"
            resolution={dealerPortal}
            unavailableLabel={copy.dealerPortalUnavailableLabel}
          />
        </section>

        <div className="public-footer__legal">
          <p>
            © {new Date().getUTCFullYear()} {copy.copyrightLabel}
          </p>
          <nav aria-label={copy.legalNavigationLabel}>
            <ul>
              {copy.legalLinks.map((item) => (
                <li key={item.routeKey}>
                  <Link href={getLocalizedPath(item.routeKey, locale)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
