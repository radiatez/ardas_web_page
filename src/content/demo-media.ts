import type { Locale } from "@/i18n/config";
import type { PublicMediaPresentation } from "@/public/content-repository";

export const demoMediaIds = {
  hero: "d4100000-4a10-4a10-8a10-000000000001",
  operations: "d4100000-4a10-4a10-8a10-000000000002",
  partsDetail: "d4100000-4a10-4a10-8a10-000000000003",
  facility: "d4100000-4a10-4a10-8a10-000000000004",
  careers: "d4100000-4a10-4a10-8a10-000000000005",
  portfolio: "d4100000-4a10-4a10-8a10-000000000006",
} as const;

export type DemoMediaKey = keyof typeof demoMediaIds;

export type DemoMediaAsset = {
  id: string;
  key: DemoMediaKey;
  src: `/demo-media/${string}.png`;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
  role: "meaningful" | "decorative";
  temporaryMedia: true;
  requiresReplacement: true;
  intendedUse: readonly string[];
  locale: Record<
    Locale,
    {
      altText: string;
      caption: null;
    }
  >;
};

/**
 * Project-generated, unbranded temporary media. These files are intentionally
 * replaceable and are not presented as documentary company photography. Their
 * shape mirrors the Media/MediaLocale presentation contract so approved public
 * media can replace them through CMS records without changing page components.
 */
export const demoMediaManifest: readonly DemoMediaAsset[] = [
  {
    id: demoMediaIds.hero,
    key: "hero",
    src: "/demo-media/warehouse-hero.png",
    width: 1915,
    height: 821,
    focalX: 0.68,
    focalY: 0.5,
    role: "meaningful",
    temporaryMedia: true,
    requiresReplacement: true,
    intendedUse: ["home.hero"],
    locale: {
      tr: { altText: "Raflar ve sevkiyat hatlarıyla modern bir dağıtım deposu", caption: null },
      en: { altText: "A modern distribution warehouse with shelving and dispatch lines", caption: null },
    },
  },
  {
    id: demoMediaIds.operations,
    key: "operations",
    src: "/demo-media/distribution-operations.png",
    width: 1672,
    height: 941,
    focalX: 0.58,
    focalY: 0.5,
    role: "meaningful",
    temporaryMedia: true,
    requiresReplacement: true,
    intendedUse: ["home.capability", "corporate.hero"],
    locale: {
      tr: { altText: "Sevkiyat alanında kolileri kontrol eden depo ekibi", caption: null },
      en: { altText: "Warehouse team checking parcels in the dispatch area", caption: null },
    },
  },
  {
    id: demoMediaIds.partsDetail,
    key: "partsDetail",
    src: "/demo-media/parts-detail.png",
    width: 1536,
    height: 1024,
    focalX: 0.42,
    focalY: 0.55,
    role: "meaningful",
    temporaryMedia: true,
    requiresReplacement: true,
    intendedUse: ["home.products", "product-groups.hero"],
    locale: {
      tr: { altText: "Depo rafında düzenlenmiş markasız otomotiv parçaları ve paketler", caption: null },
      en: { altText: "Unbranded automotive parts and packages arranged on a warehouse shelf", caption: null },
    },
  },
  {
    id: demoMediaIds.facility,
    key: "facility",
    src: "/demo-media/facility-loading.png",
    width: 1672,
    height: 941,
    focalX: 0.64,
    focalY: 0.5,
    role: "meaningful",
    temporaryMedia: true,
    requiresReplacement: true,
    intendedUse: ["home.operations", "corporate.operations", "locations.hero"],
    locale: {
      tr: { altText: "Yükleme alanları bulunan modern bir dağıtım tesisi", caption: null },
      en: { altText: "A modern distribution facility with loading bays", caption: null },
    },
  },
  {
    id: demoMediaIds.careers,
    key: "careers",
    src: "/demo-media/careers-workplace.png",
    width: 1536,
    height: 1024,
    focalX: 0.68,
    focalY: 0.48,
    role: "meaningful",
    temporaryMedia: true,
    requiresReplacement: true,
    intendedUse: ["home.careers", "careers.hero"],
    locale: {
      tr: { altText: "Depo operasyon alanında birlikte çalışan dört ekip üyesi", caption: null },
      en: { altText: "Four team members collaborating in a warehouse operations area", caption: null },
    },
  },
  {
    id: demoMediaIds.portfolio,
    key: "portfolio",
    src: "/demo-media/portfolio-rhythm.png",
    width: 1672,
    height: 941,
    focalX: 0.52,
    focalY: 0.45,
    role: "decorative",
    temporaryMedia: true,
    requiresReplacement: true,
    intendedUse: ["home.brands", "brands.hero"],
    locale: {
      tr: { altText: "", caption: null },
      en: { altText: "", caption: null },
    },
  },
] as const;

export function getTemporaryMediaMap(
  locale: Locale,
): Readonly<Record<string, PublicMediaPresentation>> {
  return Object.fromEntries(
    demoMediaManifest.map((asset) => [
      asset.id,
      {
        id: asset.id,
        src: asset.src,
        width: asset.width,
        height: asset.height,
        focalX: asset.focalX,
        focalY: asset.focalY,
        mediaLocale: {
          locale,
          altText: asset.locale[locale].altText,
          caption: asset.locale[locale].caption,
        },
      },
    ]),
  );
}

/** @deprecated Prefer getTemporaryMediaMap for the environment-neutral contract. */
export const getDevelopmentMediaMap = getTemporaryMediaMap;
