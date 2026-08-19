import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  getPageEditorState,
  loadPagePreview,
  rollbackPageRevision,
  savePageDraft,
  transitionPagePublication,
} from "../../src/admin/cms";
import {
  addContactInboxNote,
  executeDueContactRetention,
  getContactInboxDetail,
  listContactInbox,
  updateContactInboxStatus,
} from "../../src/admin/contact-inbox";
import { runScheduledContentTransitions } from "../../src/admin/scheduler";
import { createDatabase } from "../../src/db/client";
import { loadPublishedPageBundle } from "../../src/public/content-repository";
import { createPermissions, type AdminPrincipal } from "../../src/security/rbac/authorization";
import { rolePermissionGrants, type RoleKey } from "../../src/security/rbac/catalog";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("Milestone 6 CMS and Contact Manager on PostgreSQL", () => {
  const adminUserId = randomUUID();
  const contactId = randomUUID();
  const database = databaseUrl ? createDatabase(databaseUrl) : undefined;

  function principal(role: RoleKey): AdminPrincipal {
    return {
      userId: adminUserId,
      auth0Subject: `auth0|${adminUserId}`,
      mfaAuthenticated: true,
      permissions: createPermissions(rolePermissionGrants[role]),
    };
  }

  const content = (heading: string) => ({
    schemaVersion: 1,
    hero: { heading, body: [`${heading} açıklaması`] },
    sections: {},
    legalBlocks: [],
  });

  beforeAll(async () => {
    if (!database) return;
    const existing = await database.pool.query<{ id: string }>("select id from page where route_key = 'brands'");
    for (const row of existing.rows) {
      await database.pool.query("delete from content_draft where entity_type = 'page' and entity_id = $1", [row.id]);
      await database.pool.query("delete from content_revision where entity_type = 'page' and entity_id = $1", [row.id]);
    }
    await database.pool.query("delete from page where route_key = 'brands'");
    await database.pool.query(
      `insert into admin_user (id, auth0_subject, email, display_name, status)
       values ($1, $2, $3, 'Milestone 6 Test', 'active')
       on conflict (auth0_subject) do nothing`,
      [adminUserId, `auth0|${adminUserId}`, `${adminUserId}@example.test`],
    );
    await database.pool.query(
      `insert into contact_submission
        (id, name, company, email_normalized, phone_normalized, subject, message, locale,
         privacy_notice_version, privacy_notice_shown_at, privacy_acknowledged_at, status, retention_due_at)
       values ($1, 'İletişim Testi', 'Test Şirketi', 'contact@example.test', '+905551112233',
         'Dağıtım talebi', 'Audit kaydına yazılmaması gereken mesaj gövdesi', 'tr', 'test-v1', now(), now(), 'new', now() - interval '1 day')`,
      [contactId],
    );
  });

  afterAll(async () => {
    if (!database) return;
    await database.pool.query("delete from contact_submission where id = $1", [contactId]);
    const existing = await database.pool.query<{ id: string }>("select id from page where route_key = 'brands'");
    for (const row of existing.rows) {
      await database.pool.query("delete from content_draft where entity_type = 'page' and entity_id = $1", [row.id]);
      await database.pool.query("delete from content_revision where entity_type = 'page' and entity_id = $1", [row.id]);
    }
    await database.pool.query("delete from page where route_key = 'brands'");
    await database.pool.end();
  });

  it("runs draft → preview → publish → schedule → rollback without taking the live page offline", async () => {
    if (!database) return;
    const editor = principal("content_editor");
    const first = await savePageDraft(database.db, editor, {
      routeKey: "brands", locale: "tr", title: "Markalar v1", content: content("Yayımdaki v1"),
    });
    expect(first.revisionNo).toBe(1);
    expect(await loadPublishedPageBundle(database.db, "brands", "tr")).toBeUndefined();
    expect((await loadPagePreview(database.db, editor, "brands", "tr")).content.hero.heading).toBe("Yayımdaki v1");

    await transitionPagePublication(database.db, editor, { routeKey: "brands", locale: "tr", action: "publish" });
    expect((await loadPublishedPageBundle(database.db, "brands", "tr"))?.page.content.hero.heading).toBe("Yayımdaki v1");

    await savePageDraft(database.db, editor, {
      routeKey: "brands", locale: "tr", title: "Markalar v2", content: content("Planlanan v2"),
    });
    expect((await loadPublishedPageBundle(database.db, "brands", "tr"))?.page.content.hero.heading).toBe("Yayımdaki v1");
    expect((await loadPagePreview(database.db, editor, "brands", "tr")).content.hero.heading).toBe("Planlanan v2");
    expect((await getPageEditorState(database.db, editor, "brands", "tr"))?.hasDraft).toBe(true);

    const scheduledAt = new Date("2026-09-01T09:00:00.000Z");
    await transitionPagePublication(database.db, editor, {
      routeKey: "brands", locale: "tr", action: "schedule", scheduledAt,
    });
    expect((await loadPublishedPageBundle(database.db, "brands", "tr", { now: new Date("2026-08-31T09:00:00.000Z") }))?.page.content.hero.heading).toBe("Yayımdaki v1");
    const scheduled = await runScheduledContentTransitions(database.db, { now: new Date("2026-09-01T09:01:00.000Z") });
    expect(scheduled.pages.published).toBeGreaterThanOrEqual(1);
    expect((await loadPublishedPageBundle(database.db, "brands", "tr", { now: new Date("2026-09-01T09:02:00.000Z") }))?.page.content.hero.heading).toBe("Planlanan v2");

    await rollbackPageRevision(database.db, editor, { routeKey: "brands", locale: "tr", revisionNo: 1 });
    expect((await loadPublishedPageBundle(database.db, "brands", "tr", { now: new Date("2026-09-01T09:02:00.000Z") }))?.page.content.hero.heading).toBe("Planlanan v2");
    expect((await loadPagePreview(database.db, editor, "brands", "tr")).content.hero.heading).toBe("Yayımdaki v1");
    const audit = await database.pool.query<{ event_type: string; metadata: string }>(
      `select event_type, metadata_redacted::text as metadata from audit_event
       where resource_id = $1 and event_type like 'content.page_%'`, [first.pageId]);
    expect(audit.rows.map((row) => row.event_type)).toEqual(expect.arrayContaining([
      "content.page_draft_saved", "content.page_publish", "content.page_schedule", "content.page_revision_rolled_back",
    ]));
    expect(audit.rows.map((row) => row.metadata).join(" ")).not.toContain("Yayımdaki v1");
  });

  it("lets Contact Manager view/update permitted PII while Viewer and Editor cannot read it", async () => {
    if (!database) return;
    const manager = principal("contact_manager");
    const list = await listContactInbox(database.db, manager, { query: "Dağıtım" });
    const row = list.find((item) => item.id === contactId);
    expect(row).toMatchObject({ name: "İletişim Testi", subject: "Dağıtım talebi", status: "new" });
    expect(row).not.toHaveProperty("message");
    expect((await getContactInboxDetail(database.db, manager, contactId)).submission.message).toContain("mesaj gövdesi");
    await expect(getContactInboxDetail(database.db, principal("viewer"), contactId)).rejects.toThrowError("permission_denied");
    await expect(getContactInboxDetail(database.db, principal("content_editor"), contactId)).rejects.toThrowError("permission_denied");

    await updateContactInboxStatus(database.db, manager, contactId, "read");
    await addContactInboxNote(database.db, manager, contactId, "Yalnızca yetkili ekip için operasyon notu");
    const detail = await getContactInboxDetail(database.db, manager, contactId);
    expect(detail.submission.status).toBe("read");
    expect(detail.notes[0]?.body).toContain("operasyon notu");

    const audit = await database.pool.query<{ event_type: string; metadata: string }>(
      `select event_type, metadata_redacted::text as metadata from audit_event
       where resource_id = $1 and event_type in ('contact.status_updated', 'contact.internal_note_added')`,
      [contactId],
    );
    expect(audit.rows.map((item) => item.event_type)).toEqual(expect.arrayContaining(["contact.status_updated", "contact.internal_note_added"]));
    expect(audit.rows.map((item) => item.metadata).join(" ")).not.toContain("operasyon notu");
  });

  it("executes only due retention, removes notes and leaves a PII-safe audit event", async () => {
    if (!database) return;
    const result = await executeDueContactRetention(database.db, principal("contact_manager"), contactId,
      new Date("2030-01-01T00:00:00.000Z"));
    expect(result.id).toBe(contactId);
    const row = await database.pool.query<{ name: string | null; message: string | null; anonymized_at: Date | null }>(
      "select name, message, anonymized_at from contact_submission where id = $1", [contactId]);
    expect(row.rows[0]).toMatchObject({ name: null, message: null });
    expect(row.rows[0]?.anonymized_at).toBeInstanceOf(Date);
    const notes = await database.pool.query("select id from contact_submission_note where contact_submission_id = $1", [contactId]);
    expect(notes.rows).toHaveLength(0);
  });
});
