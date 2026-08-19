import { notFound } from "next/navigation";

import { AdminPageEditor, CareerApplicationActions } from "@/components/admin/admin-controls";
import { AdminShell } from "@/components/admin/admin-shell";
import { e2eUiTestSurfaceIsEnabled } from "@/security/test-surfaces";

export const dynamic = "force-dynamic";

export default function AdminUiTestSurface() {
  if (!e2eUiTestSurfaceIsEnabled()) notFound();

  return <AdminShell navigation={[
    { href: "/e2e-test-surface/admin-ui#dashboard", label: "Gösterge Paneli" },
    { href: "/e2e-test-surface/admin-ui#cms", label: "Sayfalar ve Anasayfa" },
    { href: "/e2e-test-surface/admin-ui#contact", label: "İletişim Kutusu" },
    { href: "/e2e-test-surface/admin-ui#applications", label: "Aday Başvuruları" },
  ]}>
    <main>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">E2E presentation fixture</span><h1>Yönetim arayüzü doğrulaması</h1></div>
        <p>Bu test-only yüzey gerçek kişisel veri, oturum veya production yetkilendirme bypass’ı içermez.</p>
      </div>
      <section id="dashboard" aria-labelledby="e2e-dashboard-heading">
        <h2 id="e2e-dashboard-heading">Gösterge Paneli</h2>
        <div className="admin-cards" aria-label="Sentetik operasyon özeti">
          <article className="admin-card"><span>Taslak locale kaydı</span><strong>2</strong></article>
          <article className="admin-card"><span>Eksik çeviri</span><strong>0</strong></article>
          <article className="admin-card"><span>Yeni iletişim mesajı</span><strong>1</strong></article>
          <article className="admin-card"><span>Yeni aday başvurusu</span><strong>1</strong></article>
        </div>
      </section>
      <section id="cms" aria-labelledby="e2e-cms-heading">
        <h2 id="e2e-cms-heading">CMS kritik kontrolleri</h2>
        <AdminPageEditor
          routeKey="corporate"
          locale="tr"
          initial={{
            title: "Kurumsal",
            content: { schemaVersion: 1, hero: { heading: "Kurumsal", body: [] }, sections: {}, legalBlocks: [] },
            seoTitle: "Kurumsal",
            seoDescription: "Test açıklaması",
            ogTitle: null,
            ogDescription: null,
            ogMediaId: null,
            allowIndexing: true,
            publishStatus: "draft",
            hasDraft: true,
          }}
          canEdit
          canPreview
          canPublish
          canSchedule
          canRollback
          canSeo
        />
      </section>
      <section className="admin-panel admin-panel--spaced" id="contact" aria-labelledby="e2e-contact-heading">
        <h2 id="e2e-contact-heading">İletişim Kutusu</h2>
        <form className="admin-filter-grid" aria-label="İletişim filtreleri">
          <label>Arama<input name="contact-q" /></label>
          <label>Durum<select name="contact-status"><option value="">Tümü</option><option value="new">Yeni</option></select></label>
          <button className="admin-button">Filtrele</button>
        </form>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="admin-sr-only">Sentetik iletişim kayıtları</caption>
            <thead><tr><th scope="col">Tarih</th><th scope="col">Ad</th><th scope="col">Konu</th><th scope="col">Dil</th><th scope="col">Durum</th><th scope="col">İşlem</th></tr></thead>
            <tbody><tr><td>19.08.2026</td><td>Sentetik test kaydı</td><td>Kurumsal talep</td><td>TR</td><td><span className="admin-status">Yeni</span></td><td><a href="#contact">Detayı aç</a></td></tr></tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel admin-panel--spaced" id="applications" aria-labelledby="e2e-applications-heading">
        <h2 id="e2e-applications-heading">HR liste ve detay kontrolleri</h2>
        <form className="admin-filter-grid" aria-label="Başvuru filtreleri">
          <label>Ad soyad arama<input name="q" /></label>
          <label>Durum<select name="status"><option value="">Tümü</option><option value="new">Yeni</option></select></label>
          <button className="admin-button">Filtrele</button>
        </form>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--applications">
            <caption className="admin-sr-only">Test aday başvuruları</caption>
            <thead><tr><th scope="col">Başvuru tarihi</th><th scope="col">Aday</th><th scope="col">Durum</th><th scope="col">CV durumu</th><th scope="col">İşlem</th></tr></thead>
            <tbody><tr><td>19.08.2026</td><td>Sentetik test kaydı</td><td><span className="admin-status">Yeni</span></td><td>Temiz · korumalı</td><td><a href="#candidate-actions">Detayı aç</a></td></tr></tbody>
          </table>
        </div>
        <div id="candidate-actions">
          <CareerApplicationActions
            id="00000000-0000-4000-8000-000000000001"
            currentStatus="Yeni"
            transitions={[{ value: "in_review", label: "İncelemede" }]}
            canStatus
            canNotes
            canAnonymize
            canDelete
            retentionEligible
          />
        </div>
      </section>
    </main>
  </AdminShell>;
}
