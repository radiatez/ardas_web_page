"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { PublicNavigationItem } from "@/content/public-shell";
import type { Locale } from "@/i18n/config";
import type { DealerPortalResolution } from "@/security/dealer-portal";

import { DealerPortalLink } from "./dealer-portal-link";
import { CloseIcon, MenuIcon } from "./icons";
import { PublicNavigation } from "./public-navigation";

const focusableSelector =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type MobileMenuProps = {
  locale: Locale;
  navigationLabel: string;
  navigation: readonly PublicNavigationItem[];
  openLabel: string;
  closeLabel: string;
  dealerPortalLabel: string;
  dealerPortalUnavailableLabel: string;
  dealerPortal: DealerPortalResolution;
};

export function MobileMenu({
  locale,
  navigationLabel,
  navigation,
  openLabel,
  closeLabel,
  dealerPortalLabel,
  dealerPortalUnavailableLabel,
  dealerPortal,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = panel?.querySelectorAll<HTMLElement>(focusableSelector);
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const elements = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("aria-disabled"));

      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="mobile-menu">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={open ? closeLabel : openLabel}
        className="mobile-menu__trigger"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        {open ? (
          <CloseIcon className="menu-icon" />
        ) : (
          <MenuIcon className="menu-icon" />
        )}
      </button>

      {open ? (
        <div className="mobile-menu__layer">
          <button
            aria-label={closeLabel}
            className="mobile-menu__backdrop"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <div
            aria-label={navigationLabel}
            aria-modal="true"
            className="mobile-menu__panel"
            id={panelId}
            ref={panelRef}
            role="dialog"
          >
            <div className="mobile-menu__panel-header">
              <span className="mobile-menu__wordmark" aria-hidden="true">
                ARDAŞ
              </span>
              <button
                aria-label={closeLabel}
                className="mobile-menu__close"
                onClick={() => setOpen(false)}
                type="button"
              >
                <CloseIcon className="menu-icon" />
              </button>
            </div>
            <PublicNavigation
              items={navigation}
              label={navigationLabel}
              locale={locale}
              onNavigate={() => setOpen(false)}
            />
            <div className="mobile-menu__portal">
              <DealerPortalLink
                label={dealerPortalLabel}
                placement="drawer"
                resolution={dealerPortal}
                unavailableLabel={dealerPortalUnavailableLabel}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
