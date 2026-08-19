import type { Locale } from "@/i18n/config";
import type { RouteKey } from "@/i18n/routes";

export type PublicNavigationItem = {
  routeKey: RouteKey;
  label: string;
};

type PublicShellCopy = {
  navigationLabel: string;
  navigation: readonly PublicNavigationItem[];
  languageLabel: string;
  menuOpenLabel: string;
  menuCloseLabel: string;
  dealerPortalLabel: string;
  dealerPortalUnavailableLabel: string;
  footerNavigationLabel: string;
  legalNavigationLabel: string;
  locationsLabel: string;
  contactLabel: string;
  contactPlaceholder: string;
  industryLabel: string;
  footerStatement: string;
  locationNames: readonly string[];
  legalLinks: readonly PublicNavigationItem[];
  copyrightLabel: string;
  home: {
    eyebrow: string;
    heading: string;
    description: string;
  };
  system: {
    backHomeLabel: string;
    notFoundEyebrow: string;
    notFoundHeading: string;
    notFoundDescription: string;
    errorEyebrow: string;
    errorHeading: string;
    errorDescription: string;
    retryLabel: string;
    unavailableEyebrow: string;
    unavailableHeading: string;
    unavailableDescription: string;
  };
  legal: Record<
    "privacy" | "cookies" | "data-protection",
    { title: string; eyebrow: string }
  > & {
    pendingHeading: string;
    pendingDescription: string;
  };
};

export const publicShellCopy: Record<Locale, PublicShellCopy> = {
  tr: {
    navigationLabel: "Ana navigasyon",
    navigation: [
      { routeKey: "home", label: "Ana Sayfa" },
      { routeKey: "corporate", label: "Kurumsal" },
      { routeKey: "brands", label: "Markalar" },
      { routeKey: "product-groups", label: "Ürün Grupları" },
      { routeKey: "locations", label: "Depolar" },
      { routeKey: "careers", label: "Kariyer" },
      { routeKey: "contact", label: "İletişim" },
    ],
    languageLabel: "English",
    menuOpenLabel: "Menüyü aç",
    menuCloseLabel: "Menüyü kapat",
    dealerPortalLabel: "Bayi Otomasyonu",
    dealerPortalUnavailableLabel: "Bayi Otomasyonu şu anda kullanılamıyor",
    footerNavigationLabel: "Kurumsal bağlantılar",
    legalNavigationLabel: "Yasal bağlantılar",
    locationsLabel: "Lokasyonlar",
    contactLabel: "İletişim",
    contactPlaceholder: "Kurumsal talepleriniz için iletişim sayfasını kullanın.",
    industryLabel: "Otomotiv Yenileme Pazarı",
    footerStatement: "Türkiye geneline uzanan yedek parça dağıtım deneyimi.",
    locationNames: ["İstanbul", "Ankara", "Diyarbakır"],
    legalLinks: [
      { routeKey: "privacy", label: "Gizlilik" },
      { routeKey: "cookies", label: "Çerez Politikası" },
      { routeKey: "data-protection", label: "KVKK" },
    ],
    copyrightLabel: "Ardaş Yedek Parça. Tüm hakları saklıdır.",
    home: {
      eyebrow: "Ardaş Yedek Parça",
      heading: "Türkiye geneline uzanan dağıtım deneyimi.",
      description:
        "30+ yıl, 150+ marka ve 50.000+ ürün ölçeği; İstanbul, Ankara ve Diyarbakır’dan Türkiye geneline ulaşır.",
    },
    system: {
      backHomeLabel: "Ana sayfaya dön",
      notFoundEyebrow: "404 · Sayfa bulunamadı",
      notFoundHeading: "Aradığınız sayfa burada değil.",
      notFoundDescription:
        "Bağlantı değişmiş veya içerik henüz bu dilde yayımlanmamış olabilir.",
      errorEyebrow: "500 · Sistem durumu",
      errorHeading: "Bir sorun oluştu.",
      errorDescription:
        "İsteğiniz şu anda tamamlanamadı. Lütfen yeniden deneyin veya ana sayfaya dönün.",
      retryLabel: "Yeniden dene",
      unavailableEyebrow: "Hizmet durumu",
      unavailableHeading: "Bu hizmet şu anda kullanılamıyor.",
      unavailableDescription:
        "Güvenli ve eksiksiz bir deneyim sunabilmek için erişim geçici olarak durduruldu.",
    },
    legal: {
      privacy: { title: "Gizlilik", eyebrow: "Yasal" },
      cookies: { title: "Çerez Politikası", eyebrow: "Yasal" },
      "data-protection": { title: "KVKK", eyebrow: "Yasal" },
      pendingHeading: "Hukuki bilgiler",
      pendingDescription:
        "Güncel hukuki bilgiler bu sayfada sürümlü olarak yayımlanır.",
    },
  },
  en: {
    navigationLabel: "Primary navigation",
    navigation: [
      { routeKey: "home", label: "Home" },
      { routeKey: "corporate", label: "Corporate" },
      { routeKey: "brands", label: "Brands" },
      { routeKey: "product-groups", label: "Product Groups" },
      { routeKey: "locations", label: "Locations" },
      { routeKey: "careers", label: "Careers" },
      { routeKey: "contact", label: "Contact" },
    ],
    languageLabel: "Türkçe",
    menuOpenLabel: "Open menu",
    menuCloseLabel: "Close menu",
    dealerPortalLabel: "Dealer Portal",
    dealerPortalUnavailableLabel: "Dealer Portal is currently unavailable",
    footerNavigationLabel: "Corporate links",
    legalNavigationLabel: "Legal links",
    locationsLabel: "Locations",
    contactLabel: "Contact",
    contactPlaceholder: "Use the contact page for corporate enquiries.",
    industryLabel: "Automotive Aftermarket",
    footerStatement: "Aftermarket distribution experience reaching across Türkiye.",
    locationNames: ["Istanbul", "Ankara", "Diyarbakır"],
    legalLinks: [
      { routeKey: "privacy", label: "Privacy" },
      { routeKey: "cookies", label: "Cookie Policy" },
      { routeKey: "data-protection", label: "Data Protection" },
    ],
    copyrightLabel: "Ardaş Yedek Parça. All rights reserved.",
    home: {
      eyebrow: "Ardaş Yedek Parça",
      heading: "Distribution experience reaching across Türkiye.",
      description:
        "30+ years, 150+ brands and 50,000+ products, reaching across Türkiye from Istanbul, Ankara and Diyarbakır.",
    },
    system: {
      backHomeLabel: "Return home",
      notFoundEyebrow: "404 · Page not found",
      notFoundHeading: "The page you’re looking for isn’t here.",
      notFoundDescription:
        "The link may have changed, or the content may not yet be published in this language.",
      errorEyebrow: "500 · System status",
      errorHeading: "Something went wrong.",
      errorDescription:
        "Your request could not be completed. Please try again or return to the homepage.",
      retryLabel: "Try again",
      unavailableEyebrow: "Service status",
      unavailableHeading: "This service is currently unavailable.",
      unavailableDescription:
        "Access has been paused temporarily so we can provide a secure and complete experience.",
    },
    legal: {
      privacy: { title: "Privacy", eyebrow: "Legal" },
      cookies: { title: "Cookie Policy", eyebrow: "Legal" },
      "data-protection": { title: "Data Protection", eyebrow: "Legal" },
      pendingHeading: "Legal information",
      pendingDescription:
        "Current legal information is published on this page with version history.",
    },
  },
};
