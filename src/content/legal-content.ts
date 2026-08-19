export const temporaryLegalVersion = "TEMP-2026-08-V1";

export const legalPageRouteKeys = [
  "privacy",
  "cookies",
  "data-protection",
] as const;

export type LegalPageRouteKey = (typeof legalPageRouteKeys)[number];
export type LegalStatus = "temporary" | "approved";

export type LegalContentMetadata = {
  legal_status: LegalStatus;
  legal_version: string;
  requires_legal_review: boolean;
  approval?: {
    status: "approved";
    reference: string;
  };
};

export type PrivacyNoticeContent = LegalContentMetadata & {
  heading: string;
  body: readonly string[];
  acknowledgement_label: string;
  related_route_key: "data-protection";
};

const versionPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{2,119}$/;
const temporaryVersionPattern = /^TEMP-\d{4}-\d{2}-V[1-9]\d*$/;

function normalizedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : undefined;
}

function approvalMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const reference = normalizedText(record.reference, 160);
  return record.status === "approved" && reference
    ? { status: "approved" as const, reference }
    : undefined;
}

export function readLegalContentMetadata(
  value: unknown,
): LegalContentMetadata | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const status = record.legal_status;
  const version = normalizedText(record.legal_version, 120);
  const requiresReview = record.requires_legal_review;
  const approval = approvalMetadata(record.approval);

  if (
    status === "temporary" &&
    version &&
    temporaryVersionPattern.test(version) &&
    requiresReview === true &&
    !approval
  ) {
    return {
      legal_status: status,
      legal_version: version,
      requires_legal_review: true,
    };
  }

  if (
    status === "approved" &&
    version &&
    versionPattern.test(version) &&
    !temporaryVersionPattern.test(version) &&
    requiresReview === false &&
    approval
  ) {
    return {
      legal_status: status,
      legal_version: version,
      requires_legal_review: false,
      approval,
    };
  }

  return undefined;
}

export function readPrivacyNotice(value: unknown): PrivacyNoticeContent | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const metadata = readLegalContentMetadata(record);
  const heading = normalizedText(record.heading, 240);
  const acknowledgementLabel = normalizedText(record.acknowledgement_label, 240);
  const body = Array.isArray(record.body)
    ? record.body
        .slice(0, 8)
        .map((paragraph) => normalizedText(paragraph, 2_000))
        .filter((paragraph): paragraph is string => Boolean(paragraph))
    : [];

  if (
    !metadata ||
    !heading ||
    !acknowledgementLabel ||
    body.length === 0 ||
    record.related_route_key !== "data-protection"
  ) {
    return undefined;
  }

  return {
    ...metadata,
    heading,
    body,
    acknowledgement_label: acknowledgementLabel,
    related_route_key: "data-protection",
  };
}

export function legalContentCanPublish(value: unknown): boolean {
  return Boolean(readLegalContentMetadata(value));
}

export function privacyNoticeCanEnableProduction(value: unknown): boolean {
  const notice = readPrivacyNotice(value);
  return Boolean(
    notice &&
      notice.legal_status === "approved" &&
      notice.requires_legal_review === false &&
      notice.approval,
  );
}

export function isLegalPageRouteKey(value: string): value is LegalPageRouteKey {
  return legalPageRouteKeys.some((routeKey) => routeKey === value);
}
