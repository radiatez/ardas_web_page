import Link from "next/link";

import type { EditorialAction, EditorialBlock } from "@/content/public-pages";
import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/i18n/routes";
import type { PublicMediaPresentation } from "@/public/content-repository";

import { CorporateMedia } from "./corporate-media";
import { ArrowIcon } from "./icons";
import { Eyebrow } from "./layout-primitives";

export function EditorialActionLink({
  action,
  locale,
  className = "action-link",
}: {
  action: EditorialAction;
  locale: Locale;
  className?: string;
}) {
  return (
    <Link className={className} href={getLocalizedPath(action.routeKey, locale)}>
      <span>{action.label}</span>
      <ArrowIcon className="direction-icon" />
    </Link>
  );
}

export function EditorialCopy({
  block,
  locale,
  headingLevel = "h2",
  headingClassName = "type-h2",
  className = "",
  showAction = true,
}: {
  block: EditorialBlock;
  locale: Locale;
  headingLevel?: "h1" | "h2" | "h3";
  headingClassName?: string;
  className?: string;
  showAction?: boolean;
}) {
  const Heading = headingLevel;
  return (
    <div className={`editorial-copy ${className}`.trim()}>
      {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
      <Heading className={headingClassName}>{block.heading}</Heading>
      {block.body.map((paragraph, index) => (
        <p className={index === 0 ? "type-lead" : "type-body"} key={paragraph}>
          {paragraph}
        </p>
      ))}
      {block.action && showAction ? (
        <EditorialActionLink action={block.action} locale={locale} />
      ) : null}
    </div>
  );
}

export function EditorialMedia({
  block,
  media,
  locale,
  preload = false,
  className = "",
  sizes,
}: {
  block: EditorialBlock;
  media?: PublicMediaPresentation;
  locale: Locale;
  preload?: boolean;
  className?: string;
  sizes?: string;
}) {
  const meaningfulMediaHasAlt = Boolean(media?.mediaLocale.altText?.trim());
  if (media && (block.decorativeMedia || meaningfulMediaHasAlt)) {
    return (
      <CorporateMedia
        className={className}
        decorative={block.decorativeMedia}
        focalX={media.focalX}
        focalY={media.focalY}
        height={media.height}
        mediaLocale={media.mediaLocale}
        preload={preload}
        sizes={sizes}
        src={media.src}
        width={media.width}
      />
    );
  }

  return (
    <div
      aria-label={
        locale === "tr"
          ? "Kurumsal görsel alanı"
          : "Corporate media area"
      }
      className={`editorial-media-placeholder ${className}`.trim()}
      role="img"
    >
      <span className="editorial-media-placeholder__index" aria-hidden="true">
        03—01
      </span>
      <span className="editorial-media-placeholder__label">
        {locale === "tr" ? "Kurumsal görsel alanı" : "Corporate media"}
      </span>
    </div>
  );
}
