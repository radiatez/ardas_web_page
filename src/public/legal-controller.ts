import { eq } from "drizzle-orm";

import type { DatabaseClient } from "@/db/client";
import { siteSettings } from "@/db/schema";

export type LegalControllerDetails = {
  identity?: string;
  contactChannels: readonly string[];
};

function text(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : undefined;
}

export function parseLegalControllerDetails(
  value: unknown,
): LegalControllerDetails | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const root = value as Record<string, unknown>;
  const rawController = root.legalController;
  if (!rawController || typeof rawController !== "object" || Array.isArray(rawController)) {
    return undefined;
  }
  const controller = rawController as Record<string, unknown>;
  const identity = text(controller.identity, 300);
  const contactChannels = Array.isArray(controller.contactChannels)
    ? controller.contactChannels
        .slice(0, 8)
        .map((channel) => text(channel, 500))
        .filter((channel): channel is string => Boolean(channel))
    : [];
  return identity || contactChannels.length > 0
    ? { identity, contactChannels }
    : undefined;
}

export async function loadLegalControllerDetails(
  db: DatabaseClient,
): Promise<LegalControllerDetails | undefined> {
  const [setting] = await db
    .select({ value: siteSettings.typedValue })
    .from(siteSettings)
    .where(eq(siteSettings.key, "contact_footer"))
    .limit(1);
  return parseLegalControllerDetails(setting?.value);
}

