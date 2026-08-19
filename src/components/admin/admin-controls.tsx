"use client";

import { useRef, useState, type FormEvent } from "react";

type Notice = { type: "success" | "error"; text: string } | null;

async function api(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "İşlem tamamlanamadı");
  return body;
}

function Feedback({ notice }: { notice: Notice }) {
  return notice ? <p className={`admin-feedback admin-feedback--${notice.type}`} role="status">{notice.text}</p> : null;
}

export function AdminPageEditor({ routeKey, locale, initial, canEdit = false, canPreview = false,
  canPublish = false, canSchedule = false, canRollback = false, canSeo = false }: {
  routeKey: string;
  locale: "tr" | "en";
  initial?: {
    title: string;
    content: Record<string, unknown>;
    seoTitle: string | null;
    seoDescription: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogMediaId: string | null;
    allowIndexing: boolean;
    publishStatus: string;
    hasDraft?: boolean;
  };
  canEdit?: boolean;
  canPreview?: boolean;
  canPublish?: boolean;
  canSchedule?: boolean;
  canRollback?: boolean;
  canSeo?: boolean;
}) {
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const endpoint = `/api/admin/cms/pages/${routeKey}/${locale}`;
  async function execute(body: Record<string, unknown>) {
    setBusy(true); setNotice(null);
    try {
      await api(endpoint, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      setNotice({ type: "success", text: "İşlem kaydedildi. Sayfa verisi güncellendi." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı" });
    } finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let content: Record<string, unknown>;
    try { content = JSON.parse(String(data.get("content"))) as Record<string, unknown>; }
    catch { setNotice({ type: "error", text: "İçerik JSON biçimi geçerli değil." }); return; }
    await execute({ action: "save", title: data.get("title"), content,
      seoTitle: data.get("seoTitle"), seoDescription: data.get("seoDescription"),
      ogTitle: data.get("ogTitle"), ogDescription: data.get("ogDescription"),
      ogMediaId: data.get("ogMediaId"), allowIndexing: data.get("allowIndexing") === "on" });
  }
  async function publication(action: string) {
    let scheduledAt: string | undefined;
    if (action === "schedule" || action === "schedule-archive") {
      const value = window.prompt("ISO tarih/saat girin (örn. 2026-09-01T09:00:00+03:00)");
      if (!value) return;
      scheduledAt = value;
    }
    await execute({ action, scheduledAt });
  }
  async function rollback() {
    const value = window.prompt("Geri alınacak revizyon numarası");
    if (!value) return;
    await execute({ action: "rollback", revisionNo: Number(value) });
  }
  const defaultContent = initial?.content ?? { schemaVersion: 1, hero: { heading: "TBD", body: [] }, sections: {}, legalBlocks: [] };
  return <div className="admin-editor-grid">
    <form className="admin-panel" id="admin-page-form" onSubmit={save} ref={formRef}>
      <div className="admin-panel__heading"><div><span className="admin-kicker">{locale.toUpperCase()} içerik</span><h2>Sayfa taslağı</h2></div><span className="admin-status">{initial?.publishStatus ?? "yeni"}{initial?.hasDraft ? " · değişiklik var" : ""}</span></div>
      <label>Sayfa başlığı<input name="title" defaultValue={initial?.title ?? ""} required maxLength={255} readOnly={!canEdit} /></label>
      <label>Yapılandırılmış içerik<textarea name="content" rows={22} defaultValue={JSON.stringify(defaultContent, null, 2)} spellCheck={false} readOnly={!canEdit} /></label>
      <div className="admin-form-actions">{canEdit ? <button className="admin-button" disabled={busy}>Taslak kaydet</button> : null}{canPreview ? <a className="admin-button admin-button--quiet" href={`/preview/${routeKey}/${locale}`} target="_blank" rel="noreferrer">Önizle</a> : null}</div>
    </form>
    <aside className="admin-panel admin-panel--aside">
      <span className="admin-kicker">Yayın kontrolü</span><h2>SEO ve durum</h2>
      <label>SEO başlığı<input form="admin-page-form" name="seoTitle" defaultValue={initial?.seoTitle ?? ""} readOnly={!canSeo} /></label>
      <label>SEO açıklaması<textarea name="seoDescription" rows={4} defaultValue={initial?.seoDescription ?? ""} form="admin-page-form" readOnly={!canSeo} /></label>
      <label>OG başlığı<input name="ogTitle" defaultValue={initial?.ogTitle ?? ""} form="admin-page-form" readOnly={!canSeo} /></label>
      <label>OG açıklaması<textarea name="ogDescription" rows={3} defaultValue={initial?.ogDescription ?? ""} form="admin-page-form" readOnly={!canSeo} /></label>
      <label>OG medya UUID<input name="ogMediaId" defaultValue={initial?.ogMediaId ?? ""} form="admin-page-form" readOnly={!canSeo} /></label>
      <label className="admin-check"><input name="allowIndexing" type="checkbox" defaultChecked={initial?.allowIndexing ?? true} form="admin-page-form" disabled={!canSeo} /> Arama motoru indekslemesine izin ver</label>
      {!canSeo && (initial?.allowIndexing ?? true) ? <input name="allowIndexing" type="hidden" value="on" form="admin-page-form" /> : null}
      <p className="admin-help">SEO alanları taslakla birlikte kaydedilir. Yayın işlemleri son kaydedilmiş taslağa uygulanır.</p>
      <div className="admin-stack">
        {canPublish ? <><button className="admin-button" type="button" disabled={busy} onClick={() => publication("publish")}>Şimdi yayınla</button><button className="admin-button admin-button--danger" type="button" disabled={busy} onClick={() => publication("archive")}>Arşivle</button></> : null}
        {canSchedule ? <><button className="admin-button admin-button--quiet" type="button" disabled={busy} onClick={() => publication("schedule")}>Yayını planla</button><button className="admin-button admin-button--quiet" type="button" disabled={busy} onClick={() => publication("schedule-archive")}>Arşivi planla</button></> : null}
        {canRollback ? <button className="admin-button admin-button--quiet" type="button" disabled={busy} onClick={rollback}>Revizyonu geri al</button> : null}
      </div>
      <Feedback notice={notice} />
    </aside>
  </div>;
}

export function CatalogCreateForm({ kind }: { kind: string }) {
  const [notice, setNotice] = useState<Notice>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try {
      await api(`/api/admin/catalog/${kind}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({
        action: "save", locale: data.get("locale"), key: data.get("key"), name: data.get("name"),
        slug: data.get("slug"), description: data.get("description"), sortOrder: Number(data.get("sortOrder") ?? 0), status: "active",
      }) });
      setNotice({ type: "success", text: "Kayıt taslak olarak oluşturuldu." }); event.currentTarget.reset();
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı" }); }
  }
  const needsKey = kind !== "brands";
  return <form className="admin-panel admin-compact-form" onSubmit={submit}><div className="admin-panel__heading"><div><span className="admin-kicker">Yeni kayıt</span><h2>İçerik ekle</h2></div></div>
    <label>Dil<select name="locale"><option value="tr">Türkçe</option><option value="en">İngilizce</option></select></label>
    {needsKey ? <label>Sabit anahtar<input name="key" required placeholder="ornek-anahtar" /></label> : null}
    <label>Ad<input name="name" required /></label>
    {kind === "product-groups" ? <label>Slug<input name="slug" required placeholder="ornek-grup" /></label> : null}
    <label>Kısa açıklama<textarea name="description" rows={4} /></label>
    <label>Sıra<input name="sortOrder" type="number" defaultValue="0" /></label>
    <button className="admin-button">Taslak oluştur</button><Feedback notice={notice} />
  </form>;
}

export function CatalogInlineEditor({ kind, item }: { kind: string; item: {
  id: string; key: string; slug: string | null; locale: "tr" | "en"; name: string | null;
  description: string | null; sortOrder: number;
} }) {
  const [notice, setNotice] = useState<Notice>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try {
      await api(`/api/admin/catalog/${kind}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({
        action: "save", id: item.id, locale: item.locale, key: data.get("key"), name: data.get("name"),
        slug: data.get("slug"), description: data.get("description"), sortOrder: Number(data.get("sortOrder") ?? 0), status: "active",
      }) });
      setNotice({ type: "success", text: "Değişiklik çalışma kopyasına kaydedildi; canlı yayın etkilenmedi." });
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı" }); }
  }
  async function publish() {
    try { await api(`/api/admin/catalog/${kind}`, { method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "publish", id: item.id, locale: item.locale }) });
      setNotice({ type: "success", text: "Çalışma kopyası yayınlandı." }); }
    catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Yayın tamamlanamadı" }); }
  }
  return <details><summary>Düzenle</summary><form className="admin-compact-form" onSubmit={submit} style={{ minWidth: "18rem", paddingTop: ".8rem" }}>
    {kind !== "brands" ? <label>Anahtar<input name="key" defaultValue={item.key} required /></label> : <input name="key" type="hidden" value={item.key} />}
    <label>Ad<input name="name" defaultValue={item.name ?? ""} required /></label>
    {kind === "product-groups" ? <label>Slug<input name="slug" defaultValue={item.slug ?? ""} required /></label> : null}
    <label>Açıklama<textarea name="description" defaultValue={item.description ?? ""} rows={3} /></label>
    <label>Sıra<input name="sortOrder" type="number" defaultValue={item.sortOrder} /></label>
    <div className="admin-form-actions"><button className="admin-button">Taslağı kaydet</button><button className="admin-button admin-button--quiet" type="button" onClick={publish}>Yayınla</button></div>
    <Feedback notice={notice} />
  </form></details>;
}

export function ContactActions({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [notice, setNotice] = useState<Notice>(null);
  async function send(body: Record<string, unknown>) {
    try { await api(`/api/admin/contact/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      setNotice({ type: "success", text: "İletişim kaydı güncellendi." }); }
    catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı" }); }
  }
  return <div className="admin-panel"><span className="admin-kicker">İşlemler</span><h2>Mesaj yönetimi</h2>
    <label>Durum<select defaultValue={currentStatus} onChange={(event) => send({ action: "status", status: event.target.value })}>
      <option value="new">Yeni</option><option value="read">Okundu</option><option value="replied">Yanıtlandı</option><option value="archived">Arşivlendi</option>
    </select></label>
    <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const value = new FormData(form).get("note"); void send({ action: "note", body: value }).then(() => form.reset()); }}>
      <label>İç not<textarea name="note" rows={4} required maxLength={4000} /></label><button className="admin-button">Not ekle</button>
    </form><button className="admin-button admin-button--danger" type="button" onClick={() => send({ action: "retention" })}>Süresi dolmuş kaydı anonimleştir</button>
    <Feedback notice={notice} />
  </div>;
}

export function SiteSettingForm({ settingKey, label, initialValue }: { settingKey: string; label: string; initialValue: unknown }) {
  const [notice, setNotice] = useState<Notice>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const raw = String(new FormData(event.currentTarget).get("value") ?? "");
    let value: unknown = raw;
    if (settingKey !== "dealer_portal_url" && raw.trim()) { try { value = JSON.parse(raw); } catch { value = raw; } }
    try { await api("/api/admin/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: settingKey, value }) });
      setNotice({ type: "success", text: "Ayar güvenli biçimde güncellendi." }); }
    catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı" }); }
  }
  return <form className="admin-panel" onSubmit={submit}><span className="admin-kicker">Güvenli ayar</span><h2>{label}</h2>
    <label>Değer<textarea name="value" rows={5} defaultValue={typeof initialValue === "string" ? initialValue : JSON.stringify(initialValue ?? {}, null, 2)} /></label>
    <button className="admin-button">Ayarı kaydet</button><Feedback notice={notice} />
  </form>;
}

export function PublicMediaUploadForm() {
  const [notice, setNotice] = useState<Notice>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    data.set("decorative", data.get("decorative") ? "true" : "false");
    try { await api("/api/admin/media", { method: "POST", body: data }); setNotice({ type: "success", text: "Medya taslak olarak yüklendi." }); }
    catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Yükleme tamamlanamadı" }); }
  }
  return <form className="admin-panel admin-compact-form" onSubmit={submit}><span className="admin-kicker">Public storage</span><h2>Görsel yükle</h2>
    <label>Dosya<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
    <label>Dil<select name="locale"><option value="tr">Türkçe</option><option value="en">İngilizce</option></select></label>
    <label>Alt metin<input name="altText" maxLength={500} /></label>
    <label className="admin-check"><input name="decorative" type="checkbox" /> Dekoratif görsel</label>
    <p className="admin-help">JPEG, PNG veya WebP; en fazla 15 MB. Boyut ve dosya imzası sunucuda doğrulanır.</p>
    <button className="admin-button">Yükle</button><Feedback notice={notice} />
  </form>;
}

export function MediaLocaleEditor({ id, locale, altText }: { id: string; locale: "tr" | "en"; altText: string | null }) {
  const [notice, setNotice] = useState<Notice>(null);
  async function send(body: Record<string, unknown>) {
    try { await api("/api/admin/media", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, locale, ...body }) });
      setNotice({ type: "success", text: body.action === "publish" ? "Medya locale’i yayınlandı." : "Alt metin taslağı kaydedildi." }); }
    catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "İşlem tamamlanamadı" }); }
  }
  return <details><summary>{locale.toUpperCase()} metadata</summary><form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget);
    void send({ action: "save-locale", altText: data.get("altText"), caption: data.get("caption"), decorative: data.get("decorative") === "on" }); }}>
    <label>Alt metin<input name="altText" defaultValue={altText ?? ""} /></label><label>Caption<input name="caption" /></label>
    <label className="admin-check"><input name="decorative" type="checkbox" /> Dekoratif</label>
    <div className="admin-form-actions"><button className="admin-button">Taslak kaydet</button><button className="admin-button admin-button--quiet" type="button" onClick={() => send({ action: "publish" })}>Yayınla</button></div><Feedback notice={notice} />
  </form></details>;
}

export function MediaDeleteButton({ id }: { id: string }) {
  const [notice, setNotice] = useState<Notice>(null);
  async function remove() {
    if (!window.confirm("Bu public medya nesnesi silinsin mi? İlişkili içerikleri önce kontrol edin.")) return;
    try { await api("/api/admin/media", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      setNotice({ type: "success", text: "Public medya silindi." }); }
    catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Silme tamamlanamadı" }); }
  }
  return <><button className="admin-button admin-button--danger" type="button" onClick={remove}>Medyayı sil</button><Feedback notice={notice} /></>;
}
