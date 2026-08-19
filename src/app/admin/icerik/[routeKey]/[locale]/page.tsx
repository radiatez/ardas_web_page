import { notFound } from "next/navigation";

import { getPageEditorState } from "@/admin/cms";
import { requireAdminPagePermission } from "@/admin/request-access";
import { AdminPageEditor } from "@/components/admin/admin-controls";
import { publicPageRouteKeys, type PublicPageRouteKey } from "@/content/public-pages";
import { getRuntimeDatabase } from "@/db/runtime";
import { isLocale } from "@/i18n/config";

export default async function AdminPageEditorPage({ params }: { params: Promise<{ routeKey: string; locale: string }> }) {
  const { routeKey: rawRouteKey, locale: rawLocale } = await params;
  if (!publicPageRouteKeys.includes(rawRouteKey as PublicPageRouteKey) || !isLocale(rawLocale)) notFound();
  const principal = await requireAdminPagePermission("Pages:view", { returnTo: `/admin/icerik/${rawRouteKey}/${rawLocale}` });
  const { db } = getRuntimeDatabase(); const initial = await getPageEditorState(db, principal, rawRouteKey as PublicPageRouteKey, rawLocale);
  const legal = rawRouteKey === "privacy" || rawRouteKey === "cookies" || rawRouteKey === "data-protection";
  const career = rawRouteKey === "careers" || rawRouteKey === "career-apply";
  const allowed = (permission: keyof typeof principal.permissions) => Boolean(principal.permissions[permission]?.length);
  const canEdit = legal ? allowed("LegalPages:edit") : career ? allowed("CareerContent:edit") : allowed("Pages:edit");
  const canPublish = legal ? allowed("LegalPages:publish") : career ? allowed("CareerContent:publish") : allowed("Pages:publish");
  return <main><div className="admin-page-heading"><div><span className="admin-kicker">{rawLocale.toUpperCase()} · {rawRouteKey}</span><h1>{initial?.title ?? "Yeni sayfa taslağı"}</h1></div><p>Yapılandırılmış içerik sözleşmesi public component kompozisyonunu korur; serbest HTML çalıştırılmaz.</p></div>
    <AdminPageEditor routeKey={rawRouteKey} locale={rawLocale} initial={initial}
      canEdit={canEdit} canPreview={legal ? allowed("LegalPages:view") : career ? allowed("CareerContent:view") : allowed("Pages:preview")}
      canPublish={canPublish} canSchedule={legal || career ? canPublish : allowed("Pages:schedule")}
      canRollback={legal || career ? canEdit : allowed("Pages:rollback")} canSeo={allowed("SEO:edit")} />
  </main>;
}
