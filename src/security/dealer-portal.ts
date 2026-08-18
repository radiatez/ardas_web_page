import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../db/client";
import { siteSettings } from "../db/schema";
import { appendAuditEvent } from "./audit";
import { InvalidSecurityInputError } from "./errors";
import {
  assertAuthorized,
  type AdminPrincipal,
} from "./rbac/authorization";

export interface DealerPortalResolution {
  enabled: boolean;
  source: "site_setting" | "environment" | "disabled";
  url?: string;
}

function configuredAllowedHosts(): string[] {
  return (process.env.DEALER_PORTAL_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

export function validateDealerPortalUrl(
  value: string,
  allowedHosts = configuredAllowedHosts(),
): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new InvalidSecurityInputError("dealer_portal_url_invalid");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.port && url.port !== "443")
  ) {
    throw new InvalidSecurityInputError("dealer_portal_url_invalid");
  }
  if (
    allowedHosts.length > 0 &&
    !allowedHosts.some((host) => host === url.hostname.toLowerCase())
  ) {
    throw new InvalidSecurityInputError("dealer_portal_host_not_allowed");
  }
  return url.toString();
}

function safeUrlMetadata(value: string | undefined) {
  if (!value) {
    return { enabled: false };
  }
  const url = new URL(value);
  return { enabled: true, origin: url.origin, path: url.pathname };
}

export async function resolveDealerPortalUrl(
  db: DatabaseClient,
): Promise<DealerPortalResolution> {
  const [setting] = await db
    .select({ value: siteSettings.typedValue })
    .from(siteSettings)
    .where(eq(siteSettings.key, "dealer_portal_url"))
    .limit(1);
  if (typeof setting?.value === "string") {
    try {
      return {
        enabled: true,
        source: "site_setting",
        url: validateDealerPortalUrl(setting.value),
      };
    } catch {
      // Invalid persisted values never bypass the environment fallback.
    }
  }

  if (process.env.DEALER_PORTAL_URL) {
    try {
      return {
        enabled: true,
        source: "environment",
        url: validateDealerPortalUrl(process.env.DEALER_PORTAL_URL),
      };
    } catch {
      // Invalid environment fallback resolves as disabled.
    }
  }
  return { enabled: false, source: "disabled" };
}

export async function updateDealerPortalUrl(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  value: string,
) {
  assertAuthorized(principal, {
    permission: "DealerPortal:update",
    environment: process.env.APP_ENV,
  });
  const normalized = validateDealerPortalUrl(value);
  const [existing] = await db
    .select({ value: siteSettings.typedValue })
    .from(siteSettings)
    .where(eq(siteSettings.key, "dealer_portal_url"))
    .limit(1);
  const oldValue = typeof existing?.value === "string" ? existing.value : undefined;
  const now = new Date();

  await db.transaction(async (transaction) => {
    await transaction
      .insert(siteSettings)
      .values({
        key: "dealer_portal_url",
        typedValue: normalized,
        updatedBy: principal.userId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          typedValue: normalized,
          updatedBy: principal.userId,
          updatedAt: now,
        },
      });
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "security.dealer_portal_url_updated",
      resourceType: "site_setting",
      metadata: {
        settingKey: "dealer_portal_url",
        old: safeUrlMetadata(oldValue),
        new: safeUrlMetadata(normalized),
      },
    });
  });
  return normalized;
}
