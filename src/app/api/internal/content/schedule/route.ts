import { runScheduledContentTransitions } from "@/admin/scheduler";
import { getRuntimeDatabase } from "@/db/runtime";
import { authorizeInternalJob } from "@/security/internal-job";
import { securityLogger } from "@/security/logging";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!authorizeInternalJob(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { db } = getRuntimeDatabase();
    return Response.json(await runScheduledContentTransitions(db));
  } catch (error) {
    securityLogger.error("content.scheduler_route_failed", { error });
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}
