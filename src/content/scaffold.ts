import type { Locale } from "@/i18n/config";

type ScaffoldCopy = {
  eyebrow: string;
  heading: string;
  description: string;
  languageLabel: string;
  metrics: ReadonlyArray<{
    value: string;
    label: string;
  }>;
};

export const scaffoldCopy: Record<Locale, ScaffoldCopy> = {
  tr: {
    eyebrow: "Milestone 0 · Uygulama altyapısı",
    heading: "ARDAŞ kurumsal web sitesi hazırlanıyor.",
    description:
      "Next.js, TypeScript ve çift dilli yayın altyapısının ilk sürümü kuruluyor.",
    languageLabel: "English",
    metrics: [
      { value: "30+", label: "yıllık deneyim" },
      { value: "150+", label: "marka" },
      { value: "50.000+", label: "ürün" },
      { value: "3", label: "lokasyon" },
    ],
  },
  en: {
    eyebrow: "Milestone 0 · Application foundation",
    heading: "The ARDAŞ corporate website is taking shape.",
    description:
      "The first Next.js, TypeScript and bilingual publishing foundation is being established.",
    languageLabel: "Türkçe",
    metrics: [
      { value: "30+", label: "years of experience" },
      { value: "150+", label: "brands" },
      { value: "50,000+", label: "products" },
      { value: "3", label: "locations" },
    ],
  },
};
