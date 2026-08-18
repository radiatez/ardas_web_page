import { getRuntimeDatabase } from "@/db/runtime";
import {
  markTimedOutCvScans,
  parseGuardDutyScanEvent,
  processGuardDutyScanEvent,
  retryDueCvScans,
} from "@/security/cv/guardduty";
import { SqsScanEventQueue } from "@/security/cv/queue";
import { S3CvObjectStorage } from "@/security/cv/storage";
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
    const storage = S3CvObjectStorage.fromEnvironment();
    const expectedQuarantineBucket = process.env.S3_QUARANTINE_BUCKET;
    if (!expectedQuarantineBucket) {
      return Response.json({ error: "service_unavailable" }, { status: 503 });
    }

    await markTimedOutCvScans(db);
    const queue = SqsScanEventQueue.fromEnvironment();
    let messages;
    try {
      messages = await queue.receive();
    } catch (error) {
      securityLogger.error("security.cv_scanner_queue_unavailable", { error });
      return Response.json({ error: "scanner_unavailable" }, { status: 503 });
    }

    let processed = 0;
    for (const message of messages) {
      try {
        const event = parseGuardDutyScanEvent(message.body);
        await processGuardDutyScanEvent(db, storage, event, {
          expectedQuarantineBucket,
        });
        await queue.acknowledge(message.receiptHandle);
        processed += 1;
      } catch (error) {
        securityLogger.error("security.cv_scan_event_failed", { error });
      }
    }
    const retried = await retryDueCvScans(db, storage);

    return Response.json({ processed, retried });
  } catch (error) {
    securityLogger.error("security.cv_scan_worker_failed", { error });
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}
