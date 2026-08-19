import { adminApiError, resolveRequestAdminPrincipal } from "@/admin/request-access";
import { PUBLIC_MEDIA_MAX_SIZE_BYTES, S3PublicMediaStorage, publishPublicMediaLocale,
  deletePublicMedia, savePublicMediaLocaleDraft, uploadPublicMedia } from "@/admin/public-media";
import { readAdminJson } from "@/admin/http";
import { getRuntimeDatabase } from "@/db/runtime";
import { isLocale } from "@/i18n/config";
import { InvalidSecurityInputError, RequestTooLargeError } from "@/security/errors";
import { assertTrustedPublicFormOrigin } from "@/security/request-limits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertTrustedPublicFormOrigin(request);
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (!Number.isSafeInteger(contentLength) || contentLength <= 0 || contentLength > PUBLIC_MEDIA_MAX_SIZE_BYTES + 128 * 1024) {
      throw new RequestTooLargeError();
    }
    const [form, principal] = await Promise.all([request.formData(), resolveRequestAdminPrincipal()]);
    const file = form.get("file");
    const locale = String(form.get("locale") ?? "");
    if (!(file instanceof File) || !isLocale(locale)) throw new InvalidSecurityInputError("media_form_invalid");
    if (file.size > PUBLIC_MEDIA_MAX_SIZE_BYTES) throw new RequestTooLargeError();
    const { db } = getRuntimeDatabase();
    return Response.json(await uploadPublicMedia(db, S3PublicMediaStorage.fromEnvironment(), principal, {
      originalFilename: file.name,
      mimeType: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
      locale,
      altText: String(form.get("altText") ?? ""),
      decorative: form.get("decorative") === "true",
    }));
  } catch (error) {
    return adminApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const [body, principal] = await Promise.all([readAdminJson(request, 32 * 1024), resolveRequestAdminPrincipal()]);
    const locale = String(body.locale ?? "");
    if (!isLocale(locale)) throw new InvalidSecurityInputError("media_form_invalid");
    const { db } = getRuntimeDatabase();
    if (body.action === "save-locale") {
      return Response.json(await savePublicMediaLocaleDraft(db, principal, { mediaId: String(body.id ?? ""),
        locale, altText: typeof body.altText === "string" ? body.altText : null,
        caption: typeof body.caption === "string" ? body.caption : null, decorative: body.decorative === true }));
    }
    if (body.action !== "publish") throw new InvalidSecurityInputError("media_action_invalid");
    return Response.json(await publishPublicMediaLocale(db, principal, String(body.id ?? ""), locale));
  } catch (error) {
    return adminApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const [body, principal] = await Promise.all([readAdminJson(request, 8 * 1024), resolveRequestAdminPrincipal()]);
    const { db } = getRuntimeDatabase();
    await deletePublicMedia(db, S3PublicMediaStorage.fromEnvironment(), principal, String(body.id ?? ""));
    return Response.json({ deleted: true });
  } catch (error) {
    return adminApiError(error);
  }
}
