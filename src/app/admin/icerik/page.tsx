import Link from "next/link";

import { listPageWorkspace } from "@/admin/cms";
import { requireAdminPagePermission } from "@/admin/request-access";
import { publicPageRouteKeys } from "@/content/public-pages";
import { getRuntimeDatabase } from "@/db/runtime";

export default async function AdminPagesPage() {
  const principal = await requireAdminPagePermission("Pages:view", { returnTo: "/admin/icerik" });
  const { db } = getRuntimeDatabase(); const rows = await listPageWorkspace(db, principal);
  return <main><div className="admin-page-heading"><div><span className="admin-kicker">Bilingual CMS</span><h1>Sayfalar ve Anasayfa</h1></div><p>TR ve EN içerik birbirinden bağımsız taslak, yayın ve arşiv durumuna sahiptir.</p></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Sayfa</th><th>Dil</th><th>Başlık</th><th>Durum</th><th>Plan</th><th>İşlem</th></tr></thead><tbody>
      {publicPageRouteKeys.flatMap((routeKey) => (["tr", "en"] as const).map((locale) => {
        const row = rows.find((item) => item.routeKey === routeKey && item.locale === locale);
        return <tr key={`${routeKey}-${locale}`}><td>{routeKey}</td><td>{locale.toUpperCase()}</td><td>{row?.title ?? "Henüz oluşturulmadı"}</td><td>{row?.publishStatus ?? "—"}</td><td>{row?.scheduledPublishAt?.toLocaleString("tr-TR") ?? "—"}</td><td><Link href={`/admin/icerik/${routeKey}/${locale}`}>Düzenle</Link></td></tr>;
      }))}
    </tbody></table></div>
  </main>;
}
