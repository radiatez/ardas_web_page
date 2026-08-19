import type { Metadata } from "next";

import { resolveRequestAdminPrincipal } from "@/admin/request-access";
import { AdminShell } from "@/components/admin/admin-shell";
import type { PermissionKey } from "@/security/rbac/catalog";
import "@/styles/admin.css";

export const metadata: Metadata = { title: { default: "Ardaş Yönetim", template: "%s · Ardaş Yönetim" }, robots: { index: false, follow: false, noarchive: true } };
export const dynamic = "force-dynamic";

const navigation: readonly { href: string; label: string; permission: PermissionKey }[] = [
  { href: "/admin", label: "Gösterge Paneli", permission: "Dashboard:view" },
  { href: "/admin/icerik", label: "Sayfalar ve Anasayfa", permission: "Pages:view" },
  { href: "/admin/markalar", label: "Markalar", permission: "Brands:view" },
  { href: "/admin/urun-gruplari", label: "Ürün Grupları", permission: "ProductGroups:view" },
  { href: "/admin/lokasyonlar", label: "Lokasyonlar", permission: "Locations:view" },
  { href: "/admin/departmanlar", label: "Departmanlar", permission: "Departments:view" },
  { href: "/admin/kariyer-icerigi", label: "Kariyer İçeriği", permission: "CareerContent:view" },
  { href: "/admin/basvurular", label: "Aday Başvuruları", permission: "Applications:view" },
  { href: "/admin/medya", label: "Medya", permission: "Media:view-public" },
  { href: "/admin/yasal", label: "Yasal Sayfalar", permission: "LegalPages:view" },
  { href: "/admin/seo", label: "SEO", permission: "SEO:view" },
  { href: "/admin/ayarlar", label: "Site Ayarları", permission: "SiteSettings:view" },
  { href: "/admin/iletisim", label: "İletişim Kutusu", permission: "Contact:view" },
  { href: "/admin/revizyonlar", label: "Revizyonlar", permission: "Pages:view" },
  { href: "/admin/yonlendirmeler", label: "Yönlendirmeler", permission: "Pages:view" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const principal = await resolveRequestAdminPrincipal();
  const visibleNavigation = principal
    ? navigation.filter((item) => principal.permissions[item.permission]?.length)
    : [];
  return <AdminShell navigation={visibleNavigation}>{children}</AdminShell>;
}
