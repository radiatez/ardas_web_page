import { getRuntimeDatabase } from "@/db/runtime";
import { S3CvObjectStorage } from "@/security/cv/storage";
import { authorizeInternalJob } from "@/security/internal-job";
import { securityLogger } from "@/security/logging";
import { runRetentionCleanup } from "@/security/privacy-retention";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (
    !authorizeInternalJob(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  ) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { db } = getRuntimeDatabase();
    const result = await runRetentionCleanup(
      db,
      S3CvObjectStorage.fromEnvironment(),
    );
    return Response.json(result);
  } catch (error) {
    securityLogger.error("security.retention_cleanup_failed", { error });
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}
