import type { Locale } from "@/i18n/config";
import { routeKeys, type RouteKey } from "@/i18n/routes";

export const publicPageRouteKeys = [
  "home",
  "corporate",
  "brands",
  "product-groups",
  "locations",
  "careers",
  "contact",
  "privacy",
  "cookies",
  "data-protection",
] as const;

export type PublicPageRouteKey = (typeof publicPageRouteKeys)[number];

export type EditorialAction = {
  label: string;
  routeKey: RouteKey;
};

export type EditorialBlock = {
  eyebrow?: string;
  heading: string;
  body: readonly string[];
  action?: EditorialAction;
  mediaId?: string;
  decorativeMedia?: boolean;
};

export type PublicPageContent = {
  schemaVersion: 1;
  hero: EditorialBlock;
  sections: Readonly<Record<string, EditorialBlock>>;
  legalBlocks: readonly EditorialBlock[];
};

export type PublicPageSource = "cms" | "placeholder";

export type PublicPageDocument = {
  routeKey: PublicPageRouteKey;
  locale: Locale;
  slug: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  content: PublicPageContent;
  source: PublicPageSource;
  availableLocales: readonly Locale[];
};

type PlaceholderPage = Omit<
  PublicPageDocument,
  "slug" | "source" | "availableLocales"
>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text && text.length <= maxLength ? text : undefined;
}

function readBody(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 8)
    .map((paragraph) => readText(paragraph, 2_000))
    .filter((paragraph): paragraph is string => Boolean(paragraph));
}

function readAction(value: unknown): EditorialAction | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  const label = readText(candidate.label, 80);
  const routeKey = readText(candidate.routeKey, 80);
  if (
    !label ||
    !routeKey ||
    !routeKeys.includes(routeKey as RouteKey)
  ) {
    return undefined;
  }
  return { label, routeKey: routeKey as RouteKey };
}

function readBlock(value: unknown): EditorialBlock | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const candidate = value as Record<string, unknown>;
  const heading = readText(candidate.heading, 240);
  if (!heading) return undefined;
  const mediaId = readText(candidate.mediaId, 64);

  return {
    heading,
    body: readBody(candidate.body),
    eyebrow: readText(candidate.eyebrow, 100),
    action: readAction(candidate.action),
    mediaId: mediaId && uuidPattern.test(mediaId) ? mediaId : undefined,
    decorativeMedia: candidate.decorativeMedia === true,
  };
}

export function parsePublicPageContent(
  value: Record<string, unknown>,
  fallbackTitle: string,
): PublicPageContent {
  const hero = readBlock(value.hero) ?? {
    heading: fallbackTitle,
    body: [],
  };
  const sections: Record<string, EditorialBlock> = {};
  if (
    value.sections &&
    typeof value.sections === "object" &&
    !Array.isArray(value.sections)
  ) {
    for (const [key, sectionValue] of Object.entries(value.sections).slice(0, 20)) {
      if (!/^[a-z0-9-]{1,80}$/.test(key)) continue;
      const section = readBlock(sectionValue);
      if (section) sections[key] = section;
    }
  }
  const legalBlocks = Array.isArray(value.legalBlocks)
    ? value.legalBlocks
        .slice(0, 30)
        .map(readBlock)
        .filter((block): block is EditorialBlock => Boolean(block))
    : [];

  return { schemaVersion: 1, hero, sections, legalBlocks };
}

const trPlaceholders: Record<PublicPageRouteKey, PlaceholderPage> = {
  home: {
    routeKey: "home",
    locale: "tr",
    title: "Ardaş Yedek Parça",
    seoTitle: "Ardaş Yedek Parça",
    seoDescription:
      "30+ yıllık deneyim, 150+ marka ve Türkiye geneli aftermarket dağıtımı.",
    content: {
      schemaVersion: 1,
      hero: {
        eyebrow: "Geliştirme içeriği · TBD",
        heading: "Türkiye geneli aftermarket dağıtımı.",
        body: [
          "Ardaş Yedek Parça; 30+ yıllık deneyimi, 150+ marka portföyü ve 50.000+ ürün ölçeğiyle İstanbul, Ankara ve Diyarbakır’dan hizmet verir.",
        ],
        action: { label: "Kurumsal yapımız", routeKey: "corporate" },
      },
      sections: {
        capability: {
          eyebrow: "Dağıtım kabiliyeti",
          heading: "Üç şehirden Türkiye geneline.",
          body: [
            "Operasyon ve hizmet ayrıntıları CMS içeriği ve yetkili onayı bekliyor. TBD.",
          ],
          action: { label: "Depoları görüntüle", routeKey: "locations" },
        },
        brands: {
          eyebrow: "Portföy",
          heading: "150+ marka. Seçili markalar CMS yayını bekliyor.",
          body: ["Featured marka listesi ve onaylı logolar: TBD."],
          action: { label: "Tüm markalar", routeKey: "brands" },
        },
        products: {
          eyebrow: "Ürün grupları",
          heading: "Ürün uzmanlığı için editorial bir yapı.",
          body: ["Onaylı ürün grubu taksonomisi ve görselleri: TBD."],
          action: { label: "Ürün grupları", routeKey: "product-groups" },
        },
        operations: {
          eyebrow: "Operasyon",
          heading: "İstanbul. Ankara. Diyarbakır.",
          body: ["Adresler, iletişim bilgileri ve operasyon detayları: TBD."],
          action: { label: "Lokasyonlar", routeKey: "locations" },
        },
        trust: {
          eyebrow: "Deneyim ve ölçek",
          heading: "30+ yıllık sektör deneyimi.",
          body: [
            "Kalite, sertifika, ödül ve partnerlik beyanları onaylı içerik olmadan yayımlanmayacaktır.",
          ],
        },
        careers: {
          eyebrow: "İnsan ve kariyer",
          heading: "Ardaş’ta kariyer.",
          body: ["Kariyer içeriği ve açık pozisyon ayrıntıları: TBD."],
          action: { label: "Kariyer sayfası", routeKey: "careers" },
        },
        contact: {
          eyebrow: "İletişim",
          heading: "İletişime geçin.",
          body: ["Onaylı telefon, e-posta ve adres bilgileri: TBD."],
          action: { label: "İletişim sayfası", routeKey: "contact" },
        },
      },
      legalBlocks: [],
    },
  },
  corporate: {
    routeKey: "corporate",
    locale: "tr",
    title: "Kurumsal",
    seoTitle: "Kurumsal",
    seoDescription: "Ardaş Yedek Parça’nın kurumsal yapısı ve dağıtım ölçeği.",
    content: {
      schemaVersion: 1,
      hero: {
        eyebrow: "Geliştirme içeriği · TBD",
        heading: "Deneyim, ölçek ve dağıtım odağı.",
        body: [
          "Ardaş Yedek Parça, otomotiv aftermarket yedek parça dağıtımı alanında faaliyet gösterir.",
        ],
      },
      sections: {
        overview: {
          eyebrow: "Genel bakış",
          heading: "Türkiye geneline uzanan kurumsal yapı.",
          body: [
            "İstanbul, Ankara ve Diyarbakır lokasyonlarından Türkiye geneli kargo ve dağıtım sağlanır. Ayrıntılı kurumsal metin: TBD.",
          ],
        },
        operations: {
          eyebrow: "Operasyon",
          heading: "Üç şehir. Tek dağıtım odağı.",
          body: ["Depo ve operasyon kabiliyetlerinin onaylı ayrıntıları: TBD."],
          action: { label: "Lokasyonlar", routeKey: "locations" },
        },
        history: {
          eyebrow: "Tarihçe",
          heading: "30+ yıllık deneyim.",
          body: ["Onaylı kilometre taşları ve şirket tarihçesi: TBD."],
        },
        people: {
          eyebrow: "İnsan",
          heading: "Kurum kültürü içeriği onay bekliyor.",
          body: ["Ekip, çalışma kültürü ve insan hikâyeleri: TBD."],
          action: { label: "Kariyer", routeKey: "careers" },
        },
      },
      legalBlocks: [],
    },
  },
  brands: {
    routeKey: "brands",
    locale: "tr",
    title: "Markalar",
    seoTitle: "Markalar",
    seoDescription: "Ardaş Yedek Parça’nın 150+ markalık portföyü.",
    content: {
      schemaVersion: 1,
      hero: {
        eyebrow: "Geliştirme içeriği · TBD",
        heading: "150+ markalık portföy.",
        body: ["Onaylı marka listesi, açıklamalar ve logo hakları: TBD."],
      },
      sections: {},
      legalBlocks: [],
    },
  },
  "product-groups": {
    routeKey: "product-groups",
    locale: "tr",
    title: "Ürün Grupları",
    seoTitle: "Ürün Grupları",
    seoDescription: "Ardaş Yedek Parça ürün grupları.",
    content: {
      schemaVersion: 1,
      hero: {
        eyebrow: "Geliştirme içeriği · TBD",
        heading: "Ürün uzmanlığı, kurumsal bir sunumla.",
        body: ["Onaylı ürün grubu taksonomisi, açıklamaları ve görselleri: TBD."],
      },
      sections: {},
      legalBlocks: [],
    },
  },
  locations: {
    routeKey: "locations",
    locale: "tr",
    title: "Depolar",
    seoTitle: "Depolar ve Lokasyonlar",
    seoDescription: "İstanbul, Ankara ve Diyarbakır lokasyonları.",
    content: {
      schemaVersion: 1,
      hero: {
        eyebrow: "Geliştirme içeriği · TBD",
        heading: "Üç şehirden Türkiye geneline.",
        body: ["İstanbul, Ankara ve Diyarbakır adres ve iletişim bilgileri: TBD."],
      },
      sections: {},
      legalBlocks: [],
    },
  },
  careers: {
    routeKey: "careers",
    locale: "tr",
    title: "Kariyer",
    seoTitle: "Kariyer",
    seoDescription: "Ardaş Yedek Parça kariyer sayfası.",
    content: {
      schemaVersion: 1,
      hero: {
        eyebrow: "Geliştirme içeriği · TBD",
        heading: "Ardaş’ta kariyer.",
        body: [
          "Onaylı kariyer içeriği ve başvuru formu Milestone 5 yayını bekliyor. TBD.",
        ],
      },
      sections: {},
      legalBlocks: [],
    },
  },
  contact: {
    routeKey: "contact",
    locale: "tr",
    title: "İletişim",
    seoTitle: "İletişim",
    seoDescription: "Ardaş Yedek Parça iletişim sayfası.",
    content: {
      schemaVersion: 1,
      hero: {
        eyebrow: "Geliştirme içeriği · TBD",
        heading: "İletişime geçin.",
        body: [
          "Onaylı telefon, e-posta, adres bilgileri ve iletişim formu Milestone 5 yayını bekliyor. TBD.",
        ],
      },
      sections: {},
      legalBlocks: [],
    },
  },
  privacy: createLegalPlaceholder("tr", "privacy", "Gizlilik"),
  cookies: createLegalPlaceholder("tr", "cookies", "Çerez Politikası"),
  "data-protection": createLegalPlaceholder("tr", "data-protection", "KVKK"),
};

function createLegalPlaceholder(
  locale: Locale,
  routeKey: "privacy" | "cookies" | "data-protection",
  title: string,
): PlaceholderPage {
  const isTurkish = locale === "tr";
  return {
    routeKey,
    locale,
    title,
    seoTitle: title,
    content: {
      schemaVersion: 1,
      hero: {
        eyebrow: isTurkish
          ? "Yasal · Geliştirme içeriği"
          : "Legal · Development content",
        heading: title,
        body: [],
      },
      sections: {},
      legalBlocks: [
        {
          heading: isTurkish
            ? "Onaylı hukuki metin bekleniyor."
            : "Approved legal copy is pending.",
          body: [
            isTurkish
              ? "Yetkili onayı ve CMS yayını tamamlanmadan hukuki metin yayımlanmayacaktır. İçerik: TBD."
              : "Legal copy will not be published before authorized approval and CMS publication are complete. Content: TBD.",
          ],
        },
      ],
    },
  };
}

function translatePlaceholder(page: PlaceholderPage): PlaceholderPage {
  const translations: Partial<Record<PublicPageRouteKey, PlaceholderPage>> = {
    home: {
      routeKey: "home",
      locale: "en",
      title: "Ardaş Yedek Parça",
      seoTitle: "Ardaş Yedek Parça",
      seoDescription:
        "30+ years of experience, 150+ brands and aftermarket distribution across Türkiye.",
      content: {
        schemaVersion: 1,
        hero: {
          eyebrow: "Development content · TBD",
          heading: "Aftermarket distribution across Türkiye.",
          body: [
            "Ardaş Yedek Parça operates from Istanbul, Ankara and Diyarbakır with 30+ years of experience, a portfolio of 150+ brands and a scale of 50,000+ products.",
          ],
          action: { label: "Our corporate structure", routeKey: "corporate" },
        },
        sections: {
          capability: {
            eyebrow: "Distribution capability",
            heading: "From three cities to Türkiye nationwide.",
            body: ["Approved operational and service details are pending. TBD."],
            action: { label: "View locations", routeKey: "locations" },
          },
          brands: {
            eyebrow: "Portfolio",
            heading: "150+ brands. Featured brands await CMS publication.",
            body: ["Featured brand list and approved logos: TBD."],
            action: { label: "All brands", routeKey: "brands" },
          },
          products: {
            eyebrow: "Product groups",
            heading: "An editorial structure for product expertise.",
            body: ["Approved product taxonomy and imagery: TBD."],
            action: { label: "Product groups", routeKey: "product-groups" },
          },
          operations: {
            eyebrow: "Operations",
            heading: "Istanbul. Ankara. Diyarbakır.",
            body: ["Addresses, contact details and operational details: TBD."],
            action: { label: "Locations", routeKey: "locations" },
          },
          trust: {
            eyebrow: "Experience and scale",
            heading: "30+ years of industry experience.",
            body: [
              "Quality, certification, award and partnership claims will not be published without approved content.",
            ],
          },
          careers: {
            eyebrow: "People and careers",
            heading: "Careers at Ardaş.",
            body: ["Careers content and open-position details: TBD."],
            action: { label: "Careers", routeKey: "careers" },
          },
          contact: {
            eyebrow: "Contact",
            heading: "Start a conversation.",
            body: ["Approved phone, email and address details: TBD."],
            action: { label: "Contact page", routeKey: "contact" },
          },
        },
        legalBlocks: [],
      },
    },
    corporate: {
      routeKey: "corporate",
      locale: "en",
      title: "Corporate",
      seoTitle: "Corporate",
      seoDescription: "Ardaş Yedek Parça corporate structure and distribution scale.",
      content: {
        schemaVersion: 1,
        hero: {
          eyebrow: "Development content · TBD",
          heading: "Experience, scale and distribution focus.",
          body: [
            "Ardaş Yedek Parça operates in automotive aftermarket replacement-parts distribution.",
          ],
        },
        sections: {
          overview: {
            eyebrow: "Overview",
            heading: "A corporate structure reaching across Türkiye.",
            body: [
              "Nationwide cargo and distribution are provided from Istanbul, Ankara and Diyarbakır. Detailed corporate copy: TBD.",
            ],
          },
          operations: {
            eyebrow: "Operations",
            heading: "Three cities. One distribution focus.",
            body: ["Approved warehouse and operations details: TBD."],
            action: { label: "Locations", routeKey: "locations" },
          },
          history: {
            eyebrow: "History",
            heading: "30+ years of experience.",
            body: ["Approved milestones and company history: TBD."],
          },
          people: {
            eyebrow: "People",
            heading: "Company culture content is pending approval.",
            body: ["Team, culture and people stories: TBD."],
            action: { label: "Careers", routeKey: "careers" },
          },
        },
        legalBlocks: [],
      },
    },
    brands: {
      routeKey: "brands",
      locale: "en",
      title: "Brands",
      seoTitle: "Brands",
      seoDescription: "Ardaş Yedek Parça portfolio of 150+ brands.",
      content: {
        schemaVersion: 1,
        hero: {
          eyebrow: "Development content · TBD",
          heading: "A portfolio of 150+ brands.",
          body: ["Approved brand directory, descriptions and logo rights: TBD."],
        },
        sections: {},
        legalBlocks: [],
      },
    },
    "product-groups": {
      routeKey: "product-groups",
      locale: "en",
      title: "Product Groups",
      seoTitle: "Product Groups",
      seoDescription: "Ardaş Yedek Parça product groups.",
      content: {
        schemaVersion: 1,
        hero: {
          eyebrow: "Development content · TBD",
          heading: "Product expertise, presented with corporate clarity.",
          body: ["Approved taxonomy, descriptions and imagery: TBD."],
        },
        sections: {},
        legalBlocks: [],
      },
    },
    locations: {
      routeKey: "locations",
      locale: "en",
      title: "Locations",
      seoTitle: "Locations",
      seoDescription: "Istanbul, Ankara and Diyarbakır locations.",
      content: {
        schemaVersion: 1,
        hero: {
          eyebrow: "Development content · TBD",
          heading: "From three cities to Türkiye nationwide.",
          body: ["Istanbul, Ankara and Diyarbakır address and contact details: TBD."],
        },
        sections: {},
        legalBlocks: [],
      },
    },
    careers: {
      routeKey: "careers",
      locale: "en",
      title: "Careers",
      seoTitle: "Careers",
      seoDescription: "Ardaş Yedek Parça careers page.",
      content: {
        schemaVersion: 1,
        hero: {
          eyebrow: "Development content · TBD",
          heading: "Careers at Ardaş.",
          body: [
            "Approved careers content and the application form await Milestone 5 publication. TBD.",
          ],
        },
        sections: {},
        legalBlocks: [],
      },
    },
    contact: {
      routeKey: "contact",
      locale: "en",
      title: "Contact",
      seoTitle: "Contact",
      seoDescription: "Ardaş Yedek Parça contact page.",
      content: {
        schemaVersion: 1,
        hero: {
          eyebrow: "Development content · TBD",
          heading: "Start a conversation.",
          body: [
            "Approved phone, email, address details and the contact form await Milestone 5 publication. TBD.",
          ],
        },
        sections: {},
        legalBlocks: [],
      },
    },
    privacy: createLegalPlaceholder("en", "privacy", "Privacy"),
    cookies: createLegalPlaceholder("en", "cookies", "Cookie Policy"),
    "data-protection": createLegalPlaceholder(
      "en",
      "data-protection",
      "Data Protection",
    ),
  };
  return translations[page.routeKey] ?? page;
}

const enPlaceholders = Object.fromEntries(
  Object.entries(trPlaceholders).map(([key, value]) => [
    key,
    translatePlaceholder(value),
  ]),
) as Record<PublicPageRouteKey, PlaceholderPage>;

export function getDevelopmentPage(
  routeKey: PublicPageRouteKey,
  locale: Locale,
): PublicPageDocument {
  const page = locale === "tr" ? trPlaceholders[routeKey] : enPlaceholders[routeKey];
  return {
    ...page,
    slug: "",
    source: "placeholder",
    availableLocales: ["tr", "en"],
  };
}

export function isPublicPageRouteKey(value: RouteKey): value is PublicPageRouteKey {
  return publicPageRouteKeys.includes(value as PublicPageRouteKey);
}
