import Link from "next/link";

import { publicShellCopy } from "@/content/public-shell";
import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/i18n/routes";

import { ArrowIcon } from "./icons";
import { Container, Eyebrow, Section } from "./layout-primitives";

type SystemStateKind = "not-found" | "error" | "unavailable";

type SystemStateProps = {
  locale: Locale;
  kind: SystemStateKind;
  onRetry?: () => void;
};

export function SystemState({ locale, kind, onRetry }: SystemStateProps) {
  const copy = publicShellCopy[locale].system;
  const content = {
    "not-found": {
      eyebrow: copy.notFoundEyebrow,
      heading: copy.notFoundHeading,
      description: copy.notFoundDescription,
    },
    error: {
      eyebrow: copy.errorEyebrow,
      heading: copy.errorHeading,
      description: copy.errorDescription,
    },
    unavailable: {
      eyebrow: copy.unavailableEyebrow,
      heading: copy.unavailableHeading,
      description: copy.unavailableDescription,
    },
  }[kind];

  return (
    <main className="system-state" id="main-content">
      <Section spacing="large">
        <Container>
          <div className="system-state__content motion-reveal">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h1 className="type-display">{content.heading}</h1>
            <p className="type-lead">{content.description}</p>
            <div className="system-state__actions">
              {kind === "error" && onRetry ? (
                <button className="action-link" onClick={onRetry} type="button">
                  {copy.retryLabel}
                  <ArrowIcon className="direction-icon" />
                </button>
              ) : null}
              <Link className="action-link" href={getLocalizedPath("home", locale)}>
                {copy.backHomeLabel}
                <ArrowIcon className="direction-icon" />
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
