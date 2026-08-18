import { randomUUID } from "node:crypto";

import type { DatabaseClient } from "../../db/client";
import { media } from "../../db/schema";
import type { CvObjectStorage } from "./storage";
import {
  createCvStorageKey,
  CV_MIME_TYPE,
  type CvUploadInput,
  validateCvUpload,
} from "./validation";

export async function uploadCvToQuarantine(
  db: DatabaseClient,
  storage: CvObjectStorage,
  input: CvUploadInput,
) {
  validateCvUpload(input);
  const mediaId = randomUUID();
  const storageKey = createCvStorageKey();
  const now = new Date();

  await storage.putQuarantine(storageKey, input.bytes);
  try {
    await db.insert(media).values({
      id: mediaId,
      storageClass: "quarantine",
      storageKey,
      originalFilename: input.originalFilename.trim(),
      mimeType: CV_MIME_TYPE,
      sizeBytes: input.bytes.byteLength,
      scanStatus: "pending",
      scanAttemptCount: 1,
      scanRequestedAt: now,
    });
  } catch (error) {
    await storage.deleteQuarantine(storageKey).catch(() => undefined);
    throw error;
  }

  return { mediaId, storageKey, scanStatus: "pending" as const };
}
