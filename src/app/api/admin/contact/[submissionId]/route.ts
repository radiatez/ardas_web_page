import { addContactInboxNote, executeDueContactRetention, updateContactInboxStatus,
  contactInboxStatuses, type ContactInboxStatus } from "@/admin/contact-inbox";
import { readAdminJson } from "@/admin/http";
import { adminApiError, resolveRequestAdminPrincipal } from "@/admin/request-access";
import { getRuntimeDatabase } from "@/db/runtime";
import { InvalidSecurityInputError } from "@/security/errors";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ submissionId: string }> }) {
  try {
    const [{ submissionId }, body, principal] = await Promise.all([context.params, readAdminJson(request), resolveRequestAdminPrincipal()]);
    const { db } = getRuntimeDatabase();
    if (body.action === "status") {
      if (!contactInboxStatuses.includes(body.status as ContactInboxStatus)) throw new InvalidSecurityInputError("contact_status_invalid");
      return Response.json(await updateContactInboxStatus(db, principal, submissionId, body.status as ContactInboxStatus));
    }
    if (body.action === "note") {
      return Response.json(await addContactInboxNote(db, principal, submissionId, String(body.body ?? "")));
    }
    if (body.action === "retention") {
      return Response.json(await executeDueContactRetention(db, principal, submissionId));
    }
    throw new InvalidSecurityInputError("contact_action_invalid");
  } catch (error) {
    return adminApiError(error);
  }
}
