import Link from "next/link";
import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";

import { listAdminCatalog, type AdminCatalogKind } from "@/admin/catalog";
import { listPageWorkspace } from "@/admin/cms";
import { listPublicMedia } from "@/admin/public-media";
import { requireAdminPagePermission } from "@/admin/request-access";
import { CatalogCreateForm, CatalogInlineEditor, MediaDeleteButton, MediaLocaleEditor, PublicMediaUploadForm, SiteSettingForm } from "@/components/admin/admin-controls";
import { publicPageRouteKeys, type PublicPageRouteKey } from "@/content/public-pages";
import { readLegalContentMetadata } from "@/content/legal-content";
import { getRuntimeDatabase } from "@/db/runtime";
import { contentRevisions, siteSettings, slugRedirects } from "@/db/schema";
import type { PermissionKey } from "@/security/rbac/catalog";

const catalogModules: Record<string, { kind: AdminCatalogKind; title: string; permission: PermissionKey }> = {
  markalar: { kind: "brands", title: "Markalar", permission: "Brands:view" },
  "urun-gruplari": { kind: "product-groups", title: "Ürün Grupları", permission: "ProductGroups:view" },
  lokasyonlar: { kind: "locations", title: "Lokasyonlar", permission: "Locations:view" },
  departmanlar: { kind: "departments", title: "Departmanlar", permission: "Departments:view" },
};

const pageModules: Record<string, { title: string; permission: PermissionKey; routes: readonly PublicPageRouteKey[] }> = {
  "kariyer-icerigi": { title: "Kariyer İçeriği", permission: "CareerContent:view", routes: ["careers", "career-apply"] },
  yasal: { title: "Yasal Sayfalar", permission: "LegalPages:view", routes: ["privacy", "cookies", "data-protection"] },
  seo: { title: "SEO Yönetimi", permission: "SEO:view", routes: publicPageRouteKeys },
};

function has(principal: Awaited<ReturnType<typeof requireAdminPagePermission>>, permission: PermissionKey) {
  return Boolean(principal.permissions[permission]?.length);
}

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const { db } = getRuntimeDatabase();
  const catalog = catalogModules[module];
  if (catalog) {
    const principal = await requireAdminPagePermission(catalog.permission, { returnTo: `/admin/${module}` });
    const rows = await listAdminCatalog(db, principal, catalog.kind);
    const resource = { brands: "Brands", "product-groups": "ProductGroups", locations: "Locations", departments: "Departments" }[catalog.kind];
    const createPermission = `${resource}:create` as PermissionKey;
    const editPermission = `${resource}:edit` as PermissionKey;
    return <main><PageHeading kicker="Koleksiyon CMS" title={catalog.title}>Locale içeriği, sıralama ve yayın durumu birbirinden açık biçimde ayrılır.</PageHeading>
      <div className="admin-two-column"><CatalogTable rows={rows} kind={catalog.kind} editable={has(principal, editPermission)} />{has(principal, createPermission) ? <CatalogCreateForm kind={catalog.kind} /> : null}</div>
    </main>;
  }
  const pageModule = pageModules[module];
  if (pageModule) {
    const principal = await requireAdminPagePermission(pageModule.permission, { returnTo: `/admin/${module}` });
    const rows = await listPageWorkspace(db, principal);
    return <main><PageHeading kicker="Yapılandırılmış yayın" title={pageModule.title}>Taslaklar TR ve EN için ayrı yönetilir. Geçici hukuk metni açık statüyle izlenir; onaylı metin için hukuk referansı zorunludur.</PageHeading>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Sayfa</th><th>Dil</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
        {pageModule.routes.flatMap((route) => (["tr", "en"] as const).map((locale) => { const row = rows.find((item) => item.routeKey === route && item.locale === locale);
          const legalMetadata = row?.content ? readLegalContentMetadata(row.content) : undefined;
          return <tr key={`${route}-${locale}`}><td>{route}</td><td>{locale.toUpperCase()}</td><td>{row?.publishStatus ?? "Oluşturulmadı"}{legalMetadata?.legal_status === "temporary" ? <span className="admin-table-status-note">Geçici metin — hukuk onayı bekleniyor<br />{legalMetadata.legal_version}</span> : null}</td><td><Link href={`/admin/icerik/${route}/${locale}`}>Aç</Link></td></tr>; }))}
      </tbody></table></div>
    </main>;
  }
  if (module === "medya") {
    const principal = await requireAdminPagePermission("Media:view-public", { returnTo: "/admin/medya" });
    const rows = await listPublicMedia(db, principal);
    return <main><PageHeading kicker="Public medya" title="Medya Kütüphanesi">Protected CV nesneleri bu sorguya ve ekrana hiçbir zaman dahil edilmez.</PageHeading>
      <div className="admin-two-column"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Dosya</th><th>Dil</th><th>Ölçü</th><th>Alt metin</th><th>Durum</th><th>Metadata</th></tr></thead><tbody>
        {rows.map((row) => <tr key={`${row.id}-${row.locale}`}><td>{row.originalFilename}</td><td>{row.locale?.toUpperCase() ?? "—"}</td><td>{row.width}×{row.height}</td><td>{row.altText ?? "Dekoratif / TBD"}</td><td>{row.publishStatus ?? "—"}</td><td><div className="admin-stack">{has(principal, "Media:upload-public") ? <><MediaLocaleEditor id={row.id} locale={row.locale ?? "tr"} altText={row.altText} />{row.locale ? <MediaLocaleEditor id={row.id} locale={row.locale === "tr" ? "en" : "tr"} altText={null} /> : null}</> : null}{has(principal, "Media:delete-public") ? <MediaDeleteButton id={row.id} /> : null}</div></td></tr>)}
      </tbody></table></div>{has(principal, "Media:upload-public") ? <PublicMediaUploadForm /> : null}</div>
    </main>;
  }
  if (module === "ayarlar") {
    const principal = await requireAdminPagePermission("SiteSettings:view", { returnTo: "/admin/ayarlar" });
    const values = await db.select().from(siteSettings); const map = new Map(values.map((row) => [row.key, row.typedValue]));
    const general = [["display_name", "Görünen ad"], ["company_stats", "Şirket istatistikleri"], ["contact_footer", "İletişim / footer / veri sorumlusu"], ["social_links", "Sosyal bağlantılar"], ["default_seo", "Varsayılan SEO"], ["content_owner_metadata", "İçerik sahipliği"]] as const;
    return <main><PageHeading kicker="Secret içermeyen ayarlar" title="Site Ayarları">Kimlik bilgileri ve provider secret değerleri burada tutulmaz.</PageHeading><div className="admin-cards admin-cards--settings">
      {has(principal, "SiteSettings:edit-general") ? general.map(([key, label]) => <SiteSettingForm key={key} settingKey={key} label={label} initialValue={map.get(key)} />) : <div className="admin-empty">Salt okunur erişim.</div>}
      {has(principal, "DealerPortal:update") ? <SiteSettingForm settingKey="dealer_portal_url" label="Dealer Portal URL" initialValue={map.get("dealer_portal_url")} /> : null}
    </div></main>;
  }
  if (module === "revizyonlar") {
    await requireAdminPagePermission("Pages:view", { returnTo: "/admin/revizyonlar" });
    const rows = await db.select({ entityType: contentRevisions.entityType, entityId: contentRevisions.entityId,
      locale: contentRevisions.locale, revisionNo: contentRevisions.revisionNo, createdAt: contentRevisions.createdAt })
      .from(contentRevisions).orderBy(desc(contentRevisions.createdAt)).limit(100);
    return <main><PageHeading kicker="Immutable snapshots" title="Revizyon Geçmişi">Rollback, seçilen snapshot’ı yeni bir taslak revizyon olarak geri getirir.</PageHeading><SimpleRows headers={["Tür", "Kayıt", "Dil", "Revizyon", "Tarih"]} rows={rows.map((row) => [row.entityType, row.entityId, row.locale, String(row.revisionNo), row.createdAt.toLocaleString("tr-TR")])} /></main>;
  }
  if (module === "yonlendirmeler") {
    await requireAdminPagePermission("Pages:view", { returnTo: "/admin/yonlendirmeler" });
    const rows = await db.select().from(slugRedirects).orderBy(desc(slugRedirects.createdAt)).limit(100);
    return <main><PageHeading kicker="301 geçmişi" title="Slug Yönlendirmeleri">Yayınlanmış localized slug değişiklikleri eski URL’yi korur; loop ve aynı-yol kayıtları reddedilir.</PageHeading><SimpleRows headers={["Dil", "Eski yol", "Yeni yol", "Durum", "Tarih"]} rows={rows.map((row) => [row.locale, row.oldPath, row.newPath, row.disabledAt ? "Kapalı" : "301", row.createdAt.toLocaleString("tr-TR")])} /></main>;
  }
  notFound();
}

function PageHeading({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return <div className="admin-page-heading"><div><span className="admin-kicker">{kicker}</span><h1>{title}</h1></div><p>{children}</p></div>;
}

function CatalogTable({ rows, kind, editable = false }: { rows: Awaited<ReturnType<typeof listAdminCatalog>>; kind?: AdminCatalogKind; editable?: boolean }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Anahtar</th><th>Dil</th><th>Ad</th><th>Durum</th><th>Yayın</th><th>Sıra</th><th>İşlem</th></tr></thead><tbody>
    {rows.map((row) => <tr key={`${row.id}-${row.locale}`}><td>{row.key}</td><td>{row.locale?.toUpperCase() ?? "—"}</td><td>{row.name ?? "—"}</td><td>{row.status}</td><td>{row.publishStatus ?? "—"}</td><td>{row.sortOrder}</td><td>{editable && kind && row.locale ? <CatalogInlineEditor kind={kind} item={{ ...row, locale: row.locale }} /> : "—"}</td></tr>)}
  </tbody></table></div>;
}

function SimpleRows({ headers, rows }: { headers: readonly string[]; rows: readonly (readonly React.ReactNode[])[] }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
