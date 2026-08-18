import type { DatabaseClient } from "../db/client";
import { auditEvents } from "../db/schema";
import { sanitizeStructuredData } from "./logging";

export interface AuditEventInput {
  actorUserId?: string | null;
  eventType: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> = {},
): Record<string, unknown> {
  const sanitized = sanitizeStructuredData(metadata);
  return sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)
    ? (sanitized as Record<string, unknown>)
    : {};
}

export async function appendAuditEvent(
  db: Pick<DatabaseClient, "insert">,
  event: AuditEventInput,
) {
  const [created] = await db
    .insert(auditEvents)
    .values({
      actorUserId: event.actorUserId ?? null,
      eventType: event.eventType,
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? null,
      metadataRedacted: sanitizeAuditMetadata(event.metadata),
    })
    .returning({ id: auditEvents.id });

  return created;
}
