import type { Locale } from "@/i18n/config";
import { routeKeys, type RouteKey } from "@/i18n/routes";

import { demoMediaIds } from "./demo-media";

export const publicPageRouteKeys = [
  "home",
  "corporate",
  "brands",
  "product-groups",
  "locations",
  "careers",
  "career-apply",
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
  ogTitle?: string;
  ogDescription?: string;
  ogMediaId?: string;
  ogImage?: { url: string; width: number; height: number; alt?: string };
  allowIndexing?: boolean;
  content: PublicPageContent;
  source: PublicPageSource;
  availableLocales: readonly Locale[];
};

type PlaceholderPage = Omit<
  PublicPageDocument,
  "slug" | "source" | "availableLocales" | "allowIndexing" | "ogImage"
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
        eyebrow: "Otomotiv aftermarket dağıtımı",
        heading: "Türkiye’nin hareketine güç veren dağıtım ağı.",
        body: [
          "30+ yıllık deneyim, 150+ marka ve 50.000+ ürün ölçeği; İstanbul, Ankara ve Diyarbakır’dan Türkiye geneline uzanıyor.",
        ],
        action: { label: "Kurumsal yapımız", routeKey: "corporate" },
        mediaId: demoMediaIds.hero,
      },
      sections: {
        capability: {
          eyebrow: "Dağıtım kabiliyeti",
          heading: "Doğru parçayı, doğru akışla buluşturan operasyon.",
          body: [
            "Üç şehirdeki fiziksel varlığımızı, Türkiye geneline ulaşan dağıtım yaklaşımıyla bir araya getiriyoruz.",
          ],
          action: { label: "Depoları görüntüle", routeKey: "locations" },
          mediaId: demoMediaIds.operations,
        },
        brands: {
          eyebrow: "Portföy",
          heading: "150+ markayı tek bir dağıtım disiplini altında buluşturuyoruz.",
          body: ["Marka portföyümüz, kullanım onayları tamamlandıkça bu seçkide yerini alacak."],
          action: { label: "Tüm markalar", routeKey: "brands" },
          mediaId: demoMediaIds.portfolio,
          decorativeMedia: true,
        },
        products: {
          eyebrow: "Ürün grupları",
          heading: "50.000+ ürünlük ölçekte, düzenli ve anlaşılır bir portföy.",
          body: ["Portföy yapısı, onaylanan ürün aileleriyle kademeli olarak tamamlanacak."],
          action: { label: "Ürün grupları", routeKey: "product-groups" },
          mediaId: demoMediaIds.partsDetail,
        },
        operations: {
          eyebrow: "Operasyon",
          heading: "İstanbul. Ankara. Diyarbakır.",
          body: ["Üç lokasyon, Türkiye geneline uzanan tek bir dağıtım odağı."],
          action: { label: "Lokasyonlar", routeKey: "locations" },
          mediaId: demoMediaIds.facility,
        },
        trust: {
          eyebrow: "Deneyim ve ölçek",
          heading: "30+ yıllık sektör deneyimi.",
          body: [
            "Kalite, sertifika, ödül ve iş ortaklığı bilgileri doğrulama süreci tamamlandıkça burada yer alacak.",
          ],
        },
        careers: {
          eyebrow: "İnsan ve kariyer",
          heading: "Operasyonun arkasındaki ortak akıl.",
          body: ["Birlikte çalışan, deneyimi paylaşan ve gelişime alan açan bir yapı."],
          action: { label: "Kariyer sayfası", routeKey: "careers" },
          mediaId: demoMediaIds.careers,
        },
        contact: {
          eyebrow: "İletişim",
          heading: "İletişime geçin.",
          body: ["Kurumsal iletişim bilgileri onaylı CMS yayınına kadar TBD olarak kalır."],
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
        eyebrow: "Kurumsal yapı",
        heading: "Deneyim, ölçek ve dağıtım odağı.",
        body: [
          "Ardaş Yedek Parça, otomotiv aftermarket yedek parça dağıtımı alanında faaliyet gösterir.",
        ],
        mediaId: demoMediaIds.operations,
      },
      sections: {
        overview: {
          eyebrow: "Genel bakış",
          heading: "Türkiye geneline uzanan kurumsal yapı.",
          body: [
            "İstanbul, Ankara ve Diyarbakır lokasyonlarından Türkiye geneline kargo ve dağıtım sağlanır.",
          ],
        },
        operations: {
          eyebrow: "Operasyon",
          heading: "Üç şehir. Tek dağıtım odağı.",
          body: ["Fiziksel altyapı ve dağıtım yaklaşımı, üç şehirde aynı operasyon odağıyla ilerler."],
          action: { label: "Lokasyonlar", routeKey: "locations" },
          mediaId: demoMediaIds.facility,
        },
        history: {
          eyebrow: "Tarihçe",
          heading: "30+ yıllık deneyim.",
          body: ["Onaylı kilometre taşları, kurumsal içerik yayınıyla tamamlanacak."],
        },
        people: {
          eyebrow: "İnsan",
          heading: "Operasyonun merkezinde insan var.",
          body: ["Ekip ve çalışma kültürü anlatısı, onaylı içerikle genişletilecek."],
          action: { label: "Kariyer", routeKey: "careers" },
          mediaId: demoMediaIds.careers,
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
        eyebrow: "Portföy ölçeği",
        heading: "150+ marka. Tek bir dağıtım disiplini.",
        body: ["Marka seçkisi, kullanım onayları tamamlandıkça burada yerini alacak."],
        mediaId: demoMediaIds.portfolio,
        decorativeMedia: true,
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
        eyebrow: "Ürün ölçeği",
        heading: "50.000+ ürünü anlaşılır bir yapıda sunmak.",
        body: ["Ürün aileleri, onaylı içerik ve görsellerle bu yapı içinde sunulacak."],
        mediaId: demoMediaIds.partsDetail,
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
        eyebrow: "Dağıtım ağı",
        heading: "Üç şehirden Türkiye geneline.",
        body: ["İstanbul, Ankara ve Diyarbakır; aynı dağıtım odağının üç fiziksel noktası."],
        mediaId: demoMediaIds.facility,
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
        eyebrow: "İnsan ve kariyer",
        heading: "Birlikte çalışan, birlikte gelişen bir yapı.",
        body: [
          "Genel başvurular, kişisel veri ve CV güvenliği gözetilen ayrı başvuru formu üzerinden alınır.",
        ],
        mediaId: demoMediaIds.careers,
      },
      sections: {},
      legalBlocks: [],
    },
  },
  "career-apply": {
    routeKey: "career-apply",
    locale: "tr",
    title: "Genel Başvuru",
    seoTitle: "Genel İş Başvurusu",
    seoDescription: "Ardaş Yedek Parça genel iş başvuru formu.",
    content: {
      schemaVersion: 1,
      hero: {
        eyebrow: "Kariyer · Genel başvuru",
        heading: "Bir sonraki adımınızı bizimle paylaşın.",
        body: ["Başvuru bilgileri ve CV, güvenli ve yetki kontrollü işe alım sürecinde değerlendirilir."],
        mediaId: demoMediaIds.careers,
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
        eyebrow: "Kurumsal iletişim",
        heading: "Doğru ekiple bağlantı kurun.",
        body: [
          "Kurumsal talebinizi güvenli iletişim formu üzerinden ilgili ekibe iletin.",
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
          eyebrow: "Automotive aftermarket distribution",
          heading: "A distribution network that keeps Türkiye moving.",
          body: [
            "30+ years of experience, 150+ brands and 50,000+ products, extending across Türkiye from Istanbul, Ankara and Diyarbakır.",
          ],
          action: { label: "Our corporate structure", routeKey: "corporate" },
          mediaId: demoMediaIds.hero,
        },
        sections: {
          capability: {
            eyebrow: "Distribution capability",
            heading: "An operation built to keep the right parts moving.",
            body: ["We connect our physical presence in three cities with a distribution approach that reaches across Türkiye."],
            action: { label: "View locations", routeKey: "locations" },
            mediaId: demoMediaIds.operations,
          },
          brands: {
            eyebrow: "Portfolio",
            heading: "150+ brands, brought together by one distribution discipline.",
            body: ["Our brand portfolio will take its place in this selection as usage approvals are completed."],
            action: { label: "All brands", routeKey: "brands" },
            mediaId: demoMediaIds.portfolio,
            decorativeMedia: true,
          },
          products: {
            eyebrow: "Product groups",
            heading: "A clear, organized portfolio at a scale of 50,000+ products.",
            body: ["The portfolio structure will be completed progressively with approved product families."],
            action: { label: "Product groups", routeKey: "product-groups" },
            mediaId: demoMediaIds.partsDetail,
          },
          operations: {
            eyebrow: "Operations",
            heading: "Istanbul. Ankara. Diyarbakır.",
            body: ["Three locations, aligned around one nationwide distribution focus."],
            action: { label: "Locations", routeKey: "locations" },
            mediaId: demoMediaIds.facility,
          },
          trust: {
            eyebrow: "Experience and scale",
            heading: "30+ years of industry experience.",
            body: [
              "Quality, certification, award and partnership information will appear here as verification is completed.",
            ],
          },
          careers: {
            eyebrow: "People and careers",
            heading: "The shared thinking behind the operation.",
            body: ["A structure built around collaboration, shared experience and room to grow."],
            action: { label: "Careers", routeKey: "careers" },
            mediaId: demoMediaIds.careers,
          },
          contact: {
            eyebrow: "Contact",
            heading: "Start a conversation.",
            body: ["Approved corporate contact details remain TBD until CMS publication."],
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
          eyebrow: "Corporate structure",
          heading: "Experience, scale and distribution focus.",
          body: [
            "Ardaş Yedek Parça operates in automotive aftermarket replacement-parts distribution.",
          ],
          mediaId: demoMediaIds.operations,
        },
        sections: {
          overview: {
            eyebrow: "Overview",
            heading: "A corporate structure reaching across Türkiye.",
            body: [
              "Nationwide cargo and distribution are provided from Istanbul, Ankara and Diyarbakır.",
            ],
          },
          operations: {
            eyebrow: "Operations",
            heading: "Three cities. One distribution focus.",
            body: ["Physical infrastructure and distribution capability share the same operational focus across three cities."],
            action: { label: "Locations", routeKey: "locations" },
            mediaId: demoMediaIds.facility,
          },
          history: {
            eyebrow: "History",
            heading: "30+ years of experience.",
            body: ["Approved milestones will complete this corporate narrative."],
          },
          people: {
            eyebrow: "People",
            heading: "People remain at the centre of the operation.",
            body: ["The team and workplace narrative will expand with approved content."],
            action: { label: "Careers", routeKey: "careers" },
            mediaId: demoMediaIds.careers,
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
          eyebrow: "Portfolio scale",
          heading: "150+ brands. One distribution discipline.",
          body: ["The brand selection will take its place here as usage approvals are completed."],
          mediaId: demoMediaIds.portfolio,
          decorativeMedia: true,
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
          eyebrow: "Product scale",
          heading: "Presenting 50,000+ products with clarity.",
          body: ["Product families will be presented within this structure with approved content and imagery."],
          mediaId: demoMediaIds.partsDetail,
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
          eyebrow: "Distribution network",
          heading: "From three cities to Türkiye nationwide.",
          body: ["Istanbul, Ankara and Diyarbakır are three physical points aligned around one distribution focus."],
          mediaId: demoMediaIds.facility,
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
          eyebrow: "People and careers",
          heading: "A place to work together and grow together.",
          body: [
            "General applications are received through a dedicated form designed around personal-data and CV security.",
          ],
          mediaId: demoMediaIds.careers,
        },
        sections: {},
        legalBlocks: [],
      },
    },
    "career-apply": {
      routeKey: "career-apply",
      locale: "en",
      title: "General Application",
      seoTitle: "General Job Application",
      seoDescription: "Ardaş Yedek Parça general job application form.",
      content: {
        schemaVersion: 1,
        hero: {
          eyebrow: "Careers · General application",
          heading: "Share your next step with us.",
          body: ["Application details and CVs are evaluated within a secure, access-controlled recruitment process."],
          mediaId: demoMediaIds.careers,
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
          eyebrow: "Corporate contact",
          heading: "Connect with the right team.",
          body: [
            "Send your corporate request to the relevant team through the secure contact form.",
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
    allowIndexing: false,
    availableLocales: ["tr", "en"],
  };
}

export function isPublicPageRouteKey(value: RouteKey): value is PublicPageRouteKey {
  return publicPageRouteKeys.includes(value as PublicPageRouteKey);
}
