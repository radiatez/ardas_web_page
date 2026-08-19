import { randomUUID } from "node:crypto";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { and, eq } from "drizzle-orm";

import type { DatabaseClient } from "@/db/client";
import { contentDrafts, media, mediaLocales } from "@/db/schema";
import { isLocale, type Locale } from "@/i18n/config";
import { appendAuditEvent } from "@/security/audit";
import { InvalidSecurityInputError, ResourceNotFoundError } from "@/security/errors";
import { assertAuthorized, type AdminPrincipal } from "@/security/rbac/authorization";

export const PUBLIC_MEDIA_MAX_SIZE_BYTES = 15 * 1024 * 1024;
const allowedMediaTypes = ["image/jpeg", "image/png", "image/webp"] as const;
type PublicMediaMime = (typeof allowedMediaTypes)[number];

export interface PublicMediaStorage {
  put(key: string, bytes: Uint8Array, mimeType: PublicMediaMime): Promise<void>;
  delete(key: string): Promise<void>;
}

export class S3PublicMediaStorage implements PublicMediaStorage {
  private readonly client: S3Client;
  constructor(private readonly configuration: { region: string; bucket: string }) {
    this.client = new S3Client({ region: configuration.region });
  }
  static fromEnvironment() {
    if (!process.env.AWS_REGION || !process.env.S3_PUBLIC_BUCKET) {
      throw new Error("AWS_REGION and S3_PUBLIC_BUCKET are required.");
    }
    return new S3PublicMediaStorage({ region: process.env.AWS_REGION, bucket: process.env.S3_PUBLIC_BUCKET });
  }
  async put(key: string, bytes: Uint8Array, mimeType: PublicMediaMime) {
    await this.client.send(new PutObjectCommand({ Bucket: this.configuration.bucket, Key: key, Body: bytes,
      ContentType: mimeType, ServerSideEncryption: "AES256", CacheControl: "public, max-age=31536000, immutable" }));
  }
  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.configuration.bucket, Key: key }));
  }
}

function uint32(bytes: Uint8Array, offset: number) {
  return ((bytes[offset]! << 24) | (bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!) >>> 0;
}

function dimensions(bytes: Uint8Array, mimeType: PublicMediaMime): { width: number; height: number } | undefined {
  if (mimeType === "image/png") {
    if (bytes.length < 24 || ![137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return;
    return { width: uint32(bytes, 16), height: uint32(bytes, 20) };
  }
  if (mimeType === "image/webp") {
    if (bytes.length < 30 || new TextDecoder("ascii").decode(bytes.subarray(0, 4)) !== "RIFF" ||
        new TextDecoder("ascii").decode(bytes.subarray(8, 12)) !== "WEBP") return;
    const kind = new TextDecoder("ascii").decode(bytes.subarray(12, 16));
    if (kind === "VP8X") {
      const width = 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16);
      const height = 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16);
      return { width, height };
    }
    return;
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return;
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1]!;
    const length = (bytes[offset + 2]! << 8) + bytes[offset + 3]!;
    if (length < 2 || offset + length + 2 > bytes.length) return;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: (bytes[offset + 5]! << 8) + bytes[offset + 6]!, width: (bytes[offset + 7]! << 8) + bytes[offset + 8]! };
    }
    offset += length + 2;
  }
  return;
}

export function validatePublicMediaUpload(input: {
  originalFilename: string;
  mimeType: string;
  bytes: Uint8Array;
}) {
  const mimeType = input.mimeType.trim().toLowerCase();
  if (!allowedMediaTypes.includes(mimeType as PublicMediaMime)) throw new InvalidSecurityInputError("media_mime_not_allowed");
  const extension = input.originalFilename.trim().toLowerCase().split(".").pop();
  const expected = { "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"] }[mimeType as PublicMediaMime];
  if (!extension || !expected.includes(extension)) throw new InvalidSecurityInputError("media_extension_not_allowed");
  if (!input.bytes.length || input.bytes.length > PUBLIC_MEDIA_MAX_SIZE_BYTES) throw new InvalidSecurityInputError("media_size_not_allowed");
  const measured = dimensions(input.bytes, mimeType as PublicMediaMime);
  if (!measured || measured.width < 1 || measured.height < 1 || measured.width > 20_000 || measured.height > 20_000) {
    throw new InvalidSecurityInputError("media_signature_or_dimensions_invalid");
  }
  return { mimeType: mimeType as PublicMediaMime, ...measured };
}

function publicMediaStorageKey(mimeType: PublicMediaMime, now = new Date()) {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  return `public/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension}`;
}

export async function uploadPublicMedia(
  db: DatabaseClient,
  storage: PublicMediaStorage,
  principal: AdminPrincipal | null,
  input: { originalFilename: string; mimeType: string; bytes: Uint8Array; locale: Locale; altText?: string | null; decorative?: boolean },
) {
  assertAuthorized(principal, { permission: "Media:upload-public", environment: process.env.APP_ENV });
  if (!isLocale(input.locale)) throw new InvalidSecurityInputError("media_locale_invalid");
  const validated = validatePublicMediaUpload(input);
  const altText = input.altText?.trim() || null;
  if (!input.decorative && !altText) throw new InvalidSecurityInputError("media_alt_text_required");
  if (altText && altText.length > 500) throw new InvalidSecurityInputError("media_alt_text_invalid");
  const storageKey = publicMediaStorageKey(validated.mimeType);
  await storage.put(storageKey, input.bytes, validated.mimeType);
  try {
    return await db.transaction(async (transaction) => {
      const [created] = await transaction.insert(media).values({ storageClass: "public", storageKey,
        originalFilename: input.originalFilename.trim().slice(0, 255), mimeType: validated.mimeType,
        sizeBytes: input.bytes.length, width: validated.width, height: validated.height, createdBy: principal.userId }).returning({ id: media.id });
      if (!created) throw new ResourceNotFoundError();
      await transaction.insert(mediaLocales).values({ mediaId: created.id, locale: input.locale,
        altText: input.decorative ? null : altText, publishStatus: "draft" });
      await appendAuditEvent(transaction, { actorUserId: principal.userId, eventType: "content.public_media_uploaded",
        resourceType: "media", resourceId: created.id,
        metadata: { locale: input.locale, mimeType: validated.mimeType, sizeBytes: input.bytes.length,
          width: validated.width, height: validated.height, decorative: Boolean(input.decorative) } });
      return { id: created.id, storageKey, width: validated.width, height: validated.height };
    });
  } catch (error) {
    await storage.delete(storageKey).catch(() => undefined);
    throw error;
  }
}

export async function publishPublicMediaLocale(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  mediaId: string,
  locale: Locale,
) {
  assertAuthorized(principal, { permission: "Media:upload-public", environment: process.env.APP_ENV });
  return db.transaction(async (transaction) => {
    const [draft] = await transaction.select({ snapshot: contentDrafts.snapshot }).from(contentDrafts)
      .where(and(eq(contentDrafts.entityType, "media"), eq(contentDrafts.entityId, mediaId), eq(contentDrafts.locale, locale))).limit(1);
    const [updated] = await transaction.update(mediaLocales).set({
      ...(draft ? {
        altText: typeof draft.snapshot.altText === "string" ? draft.snapshot.altText : null,
        caption: typeof draft.snapshot.caption === "string" ? draft.snapshot.caption : null,
      } : {}),
      publishStatus: "published", publishedAt: new Date(),
    }).where(and(eq(mediaLocales.mediaId, mediaId), eq(mediaLocales.locale, locale))).returning({ id: mediaLocales.mediaId });
    if (!updated) throw new ResourceNotFoundError();
    if (draft) await transaction.delete(contentDrafts).where(and(eq(contentDrafts.entityType, "media"),
      eq(contentDrafts.entityId, mediaId), eq(contentDrafts.locale, locale)));
    await appendAuditEvent(transaction, { actorUserId: principal.userId, eventType: "content.public_media_published",
      resourceType: "media", resourceId: mediaId, metadata: { locale } });
    return updated;
  });
}

export async function savePublicMediaLocaleDraft(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  input: { mediaId: string; locale: Locale; altText?: string | null; caption?: string | null; decorative?: boolean },
) {
  assertAuthorized(principal, { permission: "Media:upload-public", environment: process.env.APP_ENV });
  if (!isLocale(input.locale)) throw new InvalidSecurityInputError("media_locale_invalid");
  const altText = input.altText?.trim() || null;
  const caption = input.caption?.trim() || null;
  if (!input.decorative && !altText) throw new InvalidSecurityInputError("media_alt_text_required");
  if ((altText?.length ?? 0) > 500 || (caption?.length ?? 0) > 2_000) throw new InvalidSecurityInputError("media_locale_text_invalid");
  return db.transaction(async (transaction) => {
    const [record] = await transaction.select({ id: media.id }).from(media)
      .where(and(eq(media.id, input.mediaId), eq(media.storageClass, "public"))).limit(1);
    if (!record) throw new ResourceNotFoundError();
    await transaction.insert(mediaLocales).values({ mediaId: input.mediaId, locale: input.locale,
      altText: input.decorative ? null : altText, caption, publishStatus: "draft" })
      .onConflictDoNothing({ target: [mediaLocales.mediaId, mediaLocales.locale] });
    const snapshot = { altText: input.decorative ? null : altText, caption, decorative: Boolean(input.decorative) };
    await transaction.insert(contentDrafts).values({ entityType: "media", entityId: input.mediaId, locale: input.locale,
      snapshot, updatedBy: principal.userId, updatedAt: new Date() }).onConflictDoUpdate({
      target: [contentDrafts.entityType, contentDrafts.entityId, contentDrafts.locale],
      set: { snapshot, updatedBy: principal.userId, updatedAt: new Date() },
    });
    await appendAuditEvent(transaction, { actorUserId: principal.userId, eventType: "content.public_media_locale_saved",
      resourceType: "media", resourceId: input.mediaId, metadata: { locale: input.locale, decorative: Boolean(input.decorative) } });
    return { id: input.mediaId, locale: input.locale };
  });
}

export async function deletePublicMedia(
  db: DatabaseClient,
  storage: PublicMediaStorage,
  principal: AdminPrincipal | null,
  mediaId: string,
) {
  assertAuthorized(principal, { permission: "Media:delete-public", environment: process.env.APP_ENV });
  const [record] = await db.select({ storageKey: media.storageKey }).from(media)
    .where(and(eq(media.id, mediaId), eq(media.storageClass, "public"))).limit(1);
  if (!record) throw new ResourceNotFoundError();
  await storage.delete(record.storageKey);
  await db.transaction(async (transaction) => {
    await transaction.delete(media).where(and(eq(media.id, mediaId), eq(media.storageClass, "public")));
    await appendAuditEvent(transaction, { actorUserId: principal.userId, eventType: "content.public_media_deleted",
      resourceType: "media", resourceId: mediaId });
  });
}

export async function listPublicMedia(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
) {
  assertAuthorized(principal, { permission: "Media:view-public", environment: process.env.APP_ENV });
  return db.select({
    id: media.id,
    originalFilename: media.originalFilename,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    width: media.width,
    height: media.height,
    createdAt: media.createdAt,
    locale: mediaLocales.locale,
    altText: mediaLocales.altText,
    publishStatus: mediaLocales.publishStatus,
  }).from(media).leftJoin(mediaLocales, eq(mediaLocales.mediaId, media.id))
    .where(eq(media.storageClass, "public"));
}
