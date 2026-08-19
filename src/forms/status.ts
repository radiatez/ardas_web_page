import { eq } from "drizzle-orm";

import type { DatabaseClient } from "@/db/client";
import { careerApplications, media } from "@/db/schema";

import { hashSubmissionId } from "./validation";

export type PublicCareerScanStatus = "clean" | "infected" | "processing" | "missing";

export async function resolvePublicCareerScanStatus(
  db: DatabaseClient,
  submissionId: string,
): Promise<PublicCareerScanStatus> {
  const [record] = await db
    .select({
      scanStatus: media.scanStatus,
      storageClass: media.storageClass,
    })
    .from(careerApplications)
    .innerJoin(media, eq(careerApplications.cvFileId, media.id))
    .where(eq(careerApplications.idempotencyKeyHash, hashSubmissionId(submissionId)))
    .limit(1);

  if (!record) return "missing";
  if (record.scanStatus === "infected") return "infected";
  if (record.scanStatus === "clean" && record.storageClass === "protected") {
    return "clean";
  }
  return "processing";
}
