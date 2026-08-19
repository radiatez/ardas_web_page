import Image, { type ImageProps } from "next/image";

import type { Locale } from "@/i18n/config";

type MediaLocalePresentation = {
  locale: Locale;
  altText: string | null;
  caption?: string | null;
};

type CorporateMediaProps = {
  src: ImageProps["src"];
  width: number;
  height: number;
  mediaLocale: MediaLocalePresentation;
  decorative?: boolean;
  focalX?: number | null;
  focalY?: number | null;
  preload?: boolean;
  sizes?: string;
  className?: string;
  aspectRatio?: `${number} / ${number}`;
};

function toFocalPercentage(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 50;
  return Math.min(100, Math.max(0, value * 100));
}

export function CorporateMedia({
  src,
  width,
  height,
  mediaLocale,
  decorative = false,
  focalX,
  focalY,
  preload = false,
  sizes = "(min-width: 80rem) 75rem, 100vw",
  className = "",
  aspectRatio,
}: CorporateMediaProps) {
  const alt = decorative ? "" : mediaLocale.altText?.trim();

  if (!decorative && !alt) {
    throw new Error(
      `Meaningful media requires MediaLocale alt text for ${mediaLocale.locale}.`,
    );
  }

  return (
    <figure
      className={`corporate-media ${className}`.trim()}
      data-decorative={decorative || undefined}
    >
      <div
        className="corporate-media__viewport"
        style={{ aspectRatio: aspectRatio ?? `${width} / ${height}` }}
      >
        <Image
          alt={alt ?? ""}
          aria-hidden={decorative || undefined}
          className="corporate-media__image"
          height={height}
          loading={preload ? undefined : "lazy"}
          preload={preload}
          sizes={sizes}
          src={src}
          style={{
            objectPosition: `${toFocalPercentage(focalX)}% ${toFocalPercentage(focalY)}%`,
          }}
          width={width}
        />
      </div>
      {!decorative && mediaLocale.caption ? (
        <figcaption>{mediaLocale.caption}</figcaption>
      ) : null}
    </figure>
  );
}

export { toFocalPercentage };
