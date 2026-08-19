import { getRuntimeDatabase } from "@/db/runtime";
import {
  createSesNotificationSender,
  processDueSubmissionNotifications,
} from "@/forms/notifications";
import { authorizeInternalJob } from "@/security/internal-job";
import { securityLogger } from "@/security/logging";

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
    const sender = await createSesNotificationSender(db);
    return Response.json(await processDueSubmissionNotifications(db, sender));
  } catch (error) {
    securityLogger.error("operations.notification_worker_failed", { error });
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}

