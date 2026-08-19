import { getContactInboxDetail } from "@/admin/contact-inbox";
import { requireAdminPagePermission } from "@/admin/request-access";
import { ContactActions } from "@/components/admin/admin-controls";
import { getRuntimeDatabase } from "@/db/runtime";

export default async function ContactDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const principal = await requireAdminPagePermission("Contact:view", { returnTo: `/admin/iletisim/${submissionId}` });
  const { db } = getRuntimeDatabase(); const { submission, notes } = await getContactInboxDetail(db, principal, submissionId);
  return <main><div className="admin-page-heading"><div><span className="admin-kicker">İletişim kaydı</span><h1>{submission.subject ?? "Anonimleştirilmiş kayıt"}</h1></div><p>Privacy provenance ve saklama tarihi operasyonel görünür; değerler audit metadata’ya kopyalanmaz.</p></div>
    <div className="admin-two-column"><section className="admin-panel"><h2>Mesaj detayı</h2><dl className="admin-detail-list">
      <dt>Tarih</dt><dd>{submission.createdAt.toLocaleString("tr-TR")}</dd><dt>Ad</dt><dd>{submission.name ?? "—"}</dd><dt>Şirket</dt><dd>{submission.company ?? "—"}</dd>
      <dt>E-posta</dt><dd>{submission.email ?? "—"}</dd><dt>Telefon</dt><dd>{submission.phone ?? "—"}</dd><dt>Dil</dt><dd>{submission.locale.toUpperCase()}</dd>
      <dt>Mesaj</dt><dd>{submission.message ?? "Anonimleştirildi"}</dd><dt>Notice sürümü</dt><dd>{submission.privacyNoticeVersion}</dd>
      <dt>Gösterilme</dt><dd>{submission.privacyNoticeShownAt.toLocaleString("tr-TR")}</dd><dt>Onay</dt><dd>{submission.privacyAcknowledgedAt?.toLocaleString("tr-TR") ?? "—"}</dd>
      <dt>Retention due</dt><dd>{submission.retentionDueAt.toLocaleString("tr-TR")}</dd><dt>Hold</dt><dd>{submission.retentionHoldUntil?.toLocaleString("tr-TR") ?? "Yok"}</dd>
    </dl><h2 className="admin-section-title">İç notlar</h2>{notes.length ? notes.map((note) => <article className="admin-note" key={note.id}><small>{note.createdAt.toLocaleString("tr-TR")}</small><p>{note.body}</p></article>) : <p className="admin-help">İç not yok.</p>}</section>
      <ContactActions id={submission.id} currentStatus={submission.status} />
    </div>
  </main>;
}
