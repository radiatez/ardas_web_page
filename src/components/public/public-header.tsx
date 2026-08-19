import type { Locale } from "@/i18n/config";
import type { DealerPortalResolution } from "@/security/dealer-portal";
import { publicShellCopy } from "@/content/public-shell";

import { BrandWordmark } from "./brand-wordmark";
import { DealerPortalLink } from "./dealer-portal-link";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";
import { PublicNavigation } from "./public-navigation";

type PublicHeaderProps = {
  locale: Locale;
  dealerPortal: DealerPortalResolution;
};

export function PublicHeader({ locale, dealerPortal }: PublicHeaderProps) {
  const copy = publicShellCopy[locale];

  return (
    <header className="public-header">
      <div className="ds-container public-header__inner">
        <BrandWordmark locale={locale} />
        <div className="public-header__desktop-navigation">
          <PublicNavigation
            items={copy.navigation}
            label={copy.navigationLabel}
            locale={locale}
          />
        </div>
        <div className="public-header__utilities">
          <LocaleSwitcher compact label={copy.languageLabel} locale={locale} />
          <div className="public-header__portal">
            <DealerPortalLink
              label={copy.dealerPortalLabel}
              placement="header"
              resolution={dealerPortal}
              unavailableLabel={copy.dealerPortalUnavailableLabel}
            />
          </div>
          <MobileMenu
            closeLabel={copy.menuCloseLabel}
            dealerPortal={dealerPortal}
            dealerPortalLabel={copy.dealerPortalLabel}
            dealerPortalUnavailableLabel={copy.dealerPortalUnavailableLabel}
            locale={locale}
            navigation={copy.navigation}
            navigationLabel={copy.navigationLabel}
            openLabel={copy.menuOpenLabel}
          />
        </div>
      </div>
    </header>
  );
}
