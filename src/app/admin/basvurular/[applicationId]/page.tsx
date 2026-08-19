import {
  getCareerApplicationDetail,
  listCareerApplicationAuditTrail,
  type ApplicationStatus,
} from "@/admin/career-applications";
import { requireAdminPagePermission } from "@/admin/request-access";
import { CareerApplicationActions } from "@/components/admin/admin-controls";
import { getRuntimeDatabase } from "@/db/runtime";
import { allowedApplicationStatusTransitions } from "@/security/admin-mutations";
import { ResourceNotFoundError } from "@/security/errors";
import type { PermissionKey } from "@/security/rbac/catalog";

const statusLabels: Record<ApplicationStatus, string> = {
  new: "Yeni",
  in_review: "İncelemede",
  interview: "Mülakat",
  rejected: "Olumsuz",
  hired: "İşe alındı",
  archived: "Arşivlendi",
};

const auditLabels: Record<string, string> = {
  "privacy.candidate_detail_viewed": "Hassas detay görüntülendi",
  "privacy.candidate_internal_note_added": "İç not eklendi",
  "privacy.candidate_status_changed": "Durum değiştirildi",
  "privacy.cv_downloaded": "Korumalı CV indirildi",
  "privacy.candidate_anonymized": "Aday kaydı anonimleştirildi",
  "privacy.candidate_deleted": "Aday kaydı silindi",
};

function hasPermission(
  permissions: Awaited<ReturnType<typeof requireAdminPagePermission>>["permissions"],
  key: PermissionKey,
) {
  return Boolean(permissions[key]?.length);
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00+03:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("tr-TR");
}

function cvState(storageClass: string | null, scanStatus: string | null) {
  if (storageClass === "protected" && scanStatus === "clean") return "Temiz · korumalı storage";
  if (!storageClass) return "Dosya ilişkisi yok";
  return `${storageClass} · ${scanStatus ?? "scan sonucu yok"}`;
}

export default async function CareerApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const principal = await requireAdminPagePermission("Applications:view", {
    returnTo: `/admin/basvurular/${applicationId}`,
  });
  const { db } = getRuntimeDatabase();
  let detail: Awaited<ReturnType<typeof getCareerApplicationDetail>>;
  try {
    detail = await getCareerApplicationDetail(db, principal, applicationId);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    throw error;
  }
  const { application, notes, history } = detail;
  const auditTrail = hasPermission(principal.permissions, "Audit:view-career-scope")
    ? await listCareerApplicationAuditTrail(db, principal, applicationId)
    : [];
  const now = new Date();
  const retentionEligible =
    !application.anonymizedAt &&
    application.retentionDueAt <= now &&
    (!application.retentionHoldUntil || application.retentionHoldUntil <= now);
  const canDownload =
    hasPermission(principal.permissions, "Applications:cv-download") &&
    application.cvStorageClass === "protected" &&
    application.cvScanStatus === "clean";
  const canDelete = principal.permissions["Applications:delete"]?.includes("all") ?? false;
  const transitions = allowedApplicationStatusTransitions(application.status).map((status) => ({
    value: status,
    label: statusLabels[status],
  }));
  const hasApprovalGatedData = Boolean(
    application.gender ||
    application.birthDate ||
    application.maritalStatus ||
    application.militaryStatus ||
    application.defermentDate,
  );

  return <main>
    <div className="admin-page-heading">
      <div><span className="admin-kicker">Hassas aday kaydı</span><h1>{application.firstName} {application.lastName}</h1></div>
      <p>Bu ekran kişisel veri içerir. Görüntüleme audit’e yalnız kayıt ve aktör kimlikleriyle yazılır; serbest metin veya iletişim bilgileri audit metadata’ya kopyalanmaz.</p>
    </div>
    <div className="admin-two-column">
      <div className="admin-stack">
        <section className="admin-panel" aria-labelledby="candidate-detail-heading">
          <h2 id="candidate-detail-heading">Başvuru detayı</h2>
          <dl className="admin-detail-list">
            <dt>Başvuru tarihi</dt><dd>{application.createdAt.toLocaleString("tr-TR")}</dd>
            <dt>Ad</dt><dd>{application.firstName ?? "Anonimleştirildi"}</dd>
            <dt>Soyad</dt><dd>{application.lastName ?? "Anonimleştirildi"}</dd>
            <dt>Telefon</dt><dd>{application.phone ?? "—"}</dd>
            <dt>E-posta</dt><dd>{application.email ?? "—"}</dd>
            <dt>Departman</dt><dd>{application.departmentName ?? application.departmentKey}</dd>
            <dt>Hedef lokasyon</dt><dd>{application.locationName ?? application.locationKey}</dd>
            <dt>Beklenen net ücret</dt><dd>{application.expectedSalaryTry ? `${new Intl.NumberFormat("tr-TR").format(Number(application.expectedSalaryTry))} TRY` : "—"}</dd>
            <dt>Uygunluk tarihi</dt><dd>{formatDate(application.availableFrom)}</dd>
            <dt>Şirketi tanıyor</dt><dd>{application.knowsCompany ? "Evet" : "Hayır"}</dd>
            {application.knowsCompanySource ? <><dt>Kaynak</dt><dd>{application.knowsCompanySource}</dd></> : null}
            <dt>Başvuru türü</dt><dd>{application.jobPostingId ? application.jobPostingTitle ?? "İlan Başvurusu" : "Genel Başvuru"}</dd>
            <dt>Kendini tanıtma</dt><dd>{application.aboutText ?? "Anonimleştirildi"}</dd>
          </dl>
        </section>
        {hasApprovalGatedData ? <section className="admin-panel" aria-labelledby="candidate-gated-heading">
          <h2 id="candidate-gated-heading">Onaya tabi alanlar</h2>
          <dl className="admin-detail-list">
            {application.gender ? <><dt>Cinsiyet</dt><dd>{application.gender}</dd></> : null}
            {application.birthDate ? <><dt>Doğum tarihi</dt><dd>{formatDate(application.birthDate)}</dd></> : null}
            {application.maritalStatus ? <><dt>Medeni hal</dt><dd>{application.maritalStatus}</dd></> : null}
            {application.militaryStatus ? <><dt>Askerlik durumu</dt><dd>{application.militaryStatus}</dd></> : null}
            {application.defermentDate ? <><dt>Erteleme tarihi</dt><dd>{formatDate(application.defermentDate)}</dd></> : null}
          </dl>
        </section> : null}
        <section className="admin-panel" aria-labelledby="candidate-privacy-heading">
          <h2 id="candidate-privacy-heading">Privacy provenance ve saklama</h2>
          <dl className="admin-detail-list">
            <dt>Dil</dt><dd>{application.locale.toUpperCase()}</dd>
            <dt>Notice sürümü</dt><dd>{application.privacyNoticeVersion}</dd>
            <dt>Gösterilme zamanı</dt><dd>{application.privacyNoticeShownAt.toLocaleString("tr-TR")}</dd>
            <dt>Acknowledgement</dt><dd>{application.privacyAcknowledgedAt?.toLocaleString("tr-TR") ?? "—"}</dd>
            <dt>Retention due</dt><dd>{application.retentionDueAt.toLocaleString("tr-TR")}</dd>
            <dt>Hold</dt><dd>{application.retentionHoldUntil?.toLocaleString("tr-TR") ?? "Yok"}</dd>
            <dt>Son güncelleme</dt><dd>{application.updatedAt.toLocaleString("tr-TR")}</dd>
          </dl>
        </section>
        <section className="admin-panel" aria-labelledby="candidate-notes-heading">
          <h2 id="candidate-notes-heading">İç notlar</h2>
          {notes.length ? notes.map((note) => <article className="admin-timeline-item" key={note.id}><small>{note.authorName ?? "Sistem kullanıcısı"} · {note.createdAt.toLocaleString("tr-TR")}</small><p>{note.body}</p></article>) : <p className="admin-help">İç not bulunmuyor.</p>}
        </section>
        <section className="admin-panel" aria-labelledby="candidate-history-heading">
          <h2 id="candidate-history-heading">Durum geçmişi</h2>
          <p className="admin-help">Güncel durum: <strong>{statusLabels[application.status]}</strong></p>
          {history.length ? <ol className="admin-timeline">{history.map((item) => <li key={item.id}><strong>{item.fromStatus ? statusLabels[item.fromStatus] : "Başlangıç"} → {statusLabels[item.toStatus]}</strong><span>{item.actorName ?? "Sistem"} · {item.changedAt.toLocaleString("tr-TR")}</span></li>)}</ol> : <p className="admin-help">Henüz durum değişikliği yok.</p>}
        </section>
        <section className="admin-panel" aria-labelledby="candidate-audit-heading">
          <h2 id="candidate-audit-heading">Kariyer kapsamlı audit</h2>
          {auditTrail.length ? <ol className="admin-timeline">{auditTrail.map((item) => <li key={item.id}><strong>{auditLabels[item.eventType] ?? item.eventType}</strong><span>{item.actorName ?? "Sistem"} · {item.createdAt.toLocaleString("tr-TR")}</span></li>)}</ol> : <p className="admin-help">Bu kayıt için audit olayı bulunmuyor.</p>}
        </section>
      </div>
      <aside className="admin-stack">
        <section className="admin-panel" aria-labelledby="candidate-cv-heading">
          <span className="admin-kicker">Protected storage</span><h2 id="candidate-cv-heading">CV erişimi</h2>
          <p>{cvState(application.cvStorageClass, application.cvScanStatus)}</p>
          {canDownload ? <a className="admin-button" href={`/api/admin/career-applications/${application.id}/cv`}>Temiz PDF CV’yi indir</a> : <p className="admin-help">CV yalnız clean scan sonucu, protected storage ilişkisi, MFA ve indirme permission’ı birlikte sağlandığında açılır.</p>}
        </section>
        <CareerApplicationActions
          id={application.id}
          currentStatus={statusLabels[application.status]}
          transitions={transitions}
          canStatus={hasPermission(principal.permissions, "Applications:status") && !application.anonymizedAt}
          canNotes={hasPermission(principal.permissions, "Applications:notes") && !application.anonymizedAt}
          canAnonymize={hasPermission(principal.permissions, "Applications:anonymize") && !application.anonymizedAt}
          canDelete={canDelete}
          retentionEligible={Boolean(retentionEligible)}
        />
      </aside>
    </div>
  </main>;
}
import { notFound } from "next/navigation";
