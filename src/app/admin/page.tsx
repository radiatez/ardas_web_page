import { loadAdminDashboard } from "@/admin/dashboard";
import { requireAdminPagePermission } from "@/admin/request-access";
import { getRuntimeDatabase } from "@/db/runtime";

export default async function AdminDashboardPage() {
  const principal = await requireAdminPagePermission("Dashboard:view");
  const { db } = getRuntimeDatabase();
  const dashboard = await loadAdminDashboard(db, principal);
  return <main><div className="admin-page-heading"><div><span className="admin-kicker">Operasyon özeti</span><h1>Gösterge Paneli</h1></div><p>Yalnızca yetkiniz olan iş alanlarının durumu gösterilir. Kişisel veri içeren özetler izinsiz rollere açılmaz.</p></div>
    <section className="admin-cards" aria-label="İçerik ve operasyon özeti">
      {dashboard.content ? <><article className="admin-card"><span>Taslak locale kaydı</span><strong>{dashboard.content.drafts}</strong></article><article className="admin-card"><span>Eksik çeviri</span><strong>{dashboard.content.missingTranslations}</strong></article><article className="admin-card"><span>Son 7 gün revizyon</span><strong>{dashboard.content.recentRevisions}</strong></article></> : null}
      {dashboard.contact ? <article className="admin-card"><span>Yeni iletişim mesajı</span><strong>{dashboard.contact.newMessages}</strong></article> : null}
      {dashboard.applications ? <article className="admin-card"><span>Yeni aday başvurusu</span><strong>{dashboard.applications.newApplications}</strong></article> : null}
    </section>
    {dashboard.providers ? <section className="admin-panel" style={{ marginTop: "1rem" }}><span className="admin-kicker">Production readiness</span><h2>Sağlayıcı yapılandırması</h2><div className="admin-cards">
      {Object.entries(dashboard.providers).map(([key, ready]) => <article className="admin-card" key={key}><span>{key}</span><strong style={{ fontSize: "1rem" }}>{ready ? "Hazır" : "TBD"}</strong></article>)}
    </div></section> : null}
  </main>;
}
