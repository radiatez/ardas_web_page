import { InvalidSecurityInputError } from "@/security/errors";
import { assertTrustedPublicFormOrigin, readRequestBodyWithinLimit } from "@/security/request-limits";

export async function readAdminJson(request: Request, maxBytes = 256 * 1024) {
  assertTrustedPublicFormOrigin(request);
  const bytes = await readRequestBodyWithinLimit(request, maxBytes);
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new InvalidSecurityInputError("admin_json_invalid");
  }
}
