import Link from "next/link";

import { contactInboxStatuses, listContactInbox, type ContactInboxStatus } from "@/admin/contact-inbox";
import { requireAdminPagePermission } from "@/admin/request-access";
import { getRuntimeDatabase } from "@/db/runtime";

export default async function ContactInboxPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const principal = await requireAdminPagePermission("Contact:view", { returnTo: "/admin/iletisim" });
  const query = await searchParams; const rawStatus = typeof query.status === "string" ? query.status : undefined;
  const status = contactInboxStatuses.includes(rawStatus as ContactInboxStatus) ? rawStatus as ContactInboxStatus : undefined;
  const from = typeof query.from === "string" && query.from ? new Date(`${query.from}T00:00:00+03:00`) : undefined;
  const to = typeof query.to === "string" && query.to ? new Date(`${query.to}T23:59:59+03:00`) : undefined;
  const { db } = getRuntimeDatabase();
  const messages = await listContactInbox(db, principal, { status, query: typeof query.q === "string" ? query.q : undefined,
    from: from && !Number.isNaN(from.getTime()) ? from : undefined, to: to && !Number.isNaN(to.getTime()) ? to : undefined });
  return <main><div className="admin-page-heading"><div><span className="admin-kicker">Kişisel veri · sınırlı erişim</span><h1>İletişim Kutusu</h1></div><p>Liste görünümü yalnızca tarih, ad, konu ve durumu gösterir. Mesaj gövdesi detay ekranında permission kontrolünden sonra açılır.</p></div>
    <form className="admin-panel" method="get" style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: ".7rem", alignItems: "end" }}>
      <label>Arama<input name="q" defaultValue={typeof query.q === "string" ? query.q : ""} placeholder="Ad veya konu" /></label>
      <label>Durum<select name="status" defaultValue={status ?? ""}><option value="">Tümü</option>{contactInboxStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label>Başlangıç<input name="from" type="date" defaultValue={typeof query.from === "string" ? query.from : ""} /></label>
      <label>Bitiş<input name="to" type="date" defaultValue={typeof query.to === "string" ? query.to : ""} /></label>
      <button className="admin-button">Filtrele</button>
    </form>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tarih</th><th>Ad</th><th>Konu</th><th>Dil</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
      {messages.map((message) => <tr key={message.id}><td>{message.createdAt.toLocaleString("tr-TR")}</td><td>{message.name}</td><td>{message.subject}</td><td>{message.locale.toUpperCase()}</td><td>{message.status}</td><td><Link href={`/admin/iletisim/${message.id}`}>Detayı aç</Link></td></tr>)}
    </tbody></table></div>{messages.length === 0 ? <p className="admin-empty">Filtreye uyan mesaj yok.</p> : null}
  </main>;
}
