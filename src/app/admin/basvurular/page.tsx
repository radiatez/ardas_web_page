import type { Route } from "next";
import Link from "next/link";

import {
  applicationKinds,
  applicationStatuses,
  listCareerApplicationFilterOptions,
  listCareerApplications,
  type ApplicationKind,
  type ApplicationStatus,
} from "@/admin/career-applications";
import { requireAdminPagePermission } from "@/admin/request-access";
import { getRuntimeDatabase } from "@/db/runtime";

const statusLabels: Record<ApplicationStatus, string> = {
  new: "Yeni",
  in_review: "İncelemede",
  interview: "Mülakat",
  rejected: "Olumsuz",
  hired: "İşe alındı",
  archived: "Arşivlendi",
};

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function dateAt(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}+03:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function uuidOrUndefined(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined;
}

function cvState(storageClass: string | null, scanStatus: string | null) {
  if (storageClass === "protected" && scanStatus === "clean") return "Temiz · indirilebilir";
  if (!storageClass) return "Dosya yok";
  return `${storageClass} · ${scanStatus ?? "sonuç yok"}`;
}

function pageHref(query: Record<string, string | string[] | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key !== "page" && typeof value === "string" && value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/basvurular?${params.toString()}` as Route;
}

export default async function CareerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const principal = await requireAdminPagePermission("Applications:view", {
    returnTo: "/admin/basvurular",
  });
  const query = await searchParams;
  const rawStatus = one(query.status);
  const status = applicationStatuses.includes(rawStatus as ApplicationStatus)
    ? (rawStatus as ApplicationStatus)
    : undefined;
  const rawKind = one(query.kind);
  const kind = applicationKinds.includes(rawKind as ApplicationKind)
    ? (rawKind as ApplicationKind)
    : undefined;
  const page = positiveInt(one(query.page), 1);
  const { db } = getRuntimeDatabase();
  const [result, options] = await Promise.all([
    listCareerApplications(db, principal, {
      query: one(query.q),
      status,
      kind,
      departmentId: uuidOrUndefined(one(query.department)),
      locationId: uuidOrUndefined(one(query.location)),
      from: dateAt(one(query.from)),
      to: dateAt(one(query.to), true),
      page,
      pageSize: 25,
    }),
    listCareerApplicationFilterOptions(db, principal),
  ]);

  return <main>
    <div className="admin-page-heading">
      <div><span className="admin-kicker">Kişisel veri · HR erişimi</span><h1>Aday Başvuruları</h1></div>
      <p>Filtreleme ve sayfalama sunucuda yapılır. Liste yalnız operasyon için gerekli minimum aday bilgisini gösterir.</p>
    </div>
    <form className="admin-panel admin-filter-grid" method="get" aria-label="Başvuru filtreleri">
      <label>Ad soyad arama<input name="q" defaultValue={one(query.q) ?? ""} maxLength={120} /></label>
      <label>Durum<select name="status" defaultValue={status ?? ""}><option value="">Tümü</option>{applicationStatuses.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}</select></label>
      <label>Departman<select name="department" defaultValue={one(query.department) ?? ""}><option value="">Tümü</option>{options.departments.map((item) => <option value={item.id} key={item.id}>{item.name ?? item.key}</option>)}</select></label>
      <label>Lokasyon / depo<select name="location" defaultValue={one(query.location) ?? ""}><option value="">Tümü</option>{options.locations.map((item) => <option value={item.id} key={item.id}>{item.name ?? item.key}</option>)}</select></label>
      <label>Başvuru türü<select name="kind" defaultValue={kind ?? ""}><option value="">Tümü</option><option value="general">Genel Başvuru</option><option value="job_posting">İlan Başvurusu</option></select></label>
      <label>Başlangıç<input name="from" type="date" defaultValue={one(query.from) ?? ""} /></label>
      <label>Bitiş<input name="to" type="date" defaultValue={one(query.to) ?? ""} /></label>
      <button className="admin-button">Filtrele</button>
    </form>
    <div className="admin-result-summary" aria-live="polite">{result.total} başvuru · Sayfa {result.page}/{result.totalPages}</div>
    <div className="admin-table-wrap">
      <table className="admin-table admin-table--applications">
        <caption className="admin-sr-only">Filtrelenmiş aday başvuruları</caption>
        <thead><tr><th scope="col">Başvuru tarihi</th><th scope="col">Aday</th><th scope="col">Departman</th><th scope="col">Lokasyon</th><th scope="col">Durum</th><th scope="col">CV durumu</th><th scope="col">Uygunluk</th><th scope="col">Tür</th><th scope="col">İşlem</th></tr></thead>
        <tbody>{result.rows.map((application) => <tr key={application.id}>
          <td><time dateTime={application.createdAt.toISOString()}>{application.createdAt.toLocaleString("tr-TR")}</time></td>
          <td>{application.firstName} {application.lastName}</td>
          <td>{application.departmentName ?? application.departmentKey}</td>
          <td>{application.locationName ?? application.locationKey}</td>
          <td><span className="admin-status">{statusLabels[application.status]}</span></td>
          <td>{cvState(application.storageClass, application.scanStatus)}</td>
          <td>{application.availableFrom ?? "—"}</td>
          <td>{application.jobPostingId ? application.jobPostingTitle ?? "İlan Başvurusu" : "Genel Başvuru"}</td>
          <td><Link href={`/admin/basvurular/${application.id}`}>Detayı aç</Link></td>
        </tr>)}</tbody>
      </table>
    </div>
    {result.rows.length === 0 ? <p className="admin-empty">Filtreye uyan aktif başvuru yok.</p> : null}
    <nav className="admin-pagination" aria-label="Başvuru sayfaları">
      {result.page > 1 ? <Link className="admin-button admin-button--quiet" href={pageHref(query, result.page - 1)}>Önceki sayfa</Link> : <span />}
      <span>Sayfa {result.page} / {result.totalPages}</span>
      {result.page < result.totalPages ? <Link className="admin-button admin-button--quiet" href={pageHref(query, result.page + 1)}>Sonraki sayfa</Link> : <span />}
    </nav>
  </main>;
}
