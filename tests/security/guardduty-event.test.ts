import { describe, expect, it } from "vitest";

import { parseGuardDutyScanEvent } from "../../src/security/cv/guardduty";

function event(result: string) {
  return {
    version: "0",
    id: "72c7d362-737a-6dce-fc78-9e27a0171419",
    "detail-type": "GuardDuty Malware Protection Object Scan Result",
    source: "aws.guardduty",
    detail: {
      resourceType: "S3_OBJECT",
      s3ObjectDetails: {
        bucketName: "quarantine",
        objectKey: "cv/2026/08/file.pdf",
      },
      scanResultDetails: {
        scanResultStatus: result,
        statusReasons: result === "UNSUPPORTED" ? ["PASSWORD_PROTECTED"] : null,
      },
    },
  };
}

describe("GuardDuty event parsing", () => {
  it("accepts every documented scan result without copying threat details", () => {
    for (const result of [
      "NO_THREATS_FOUND",
      "THREATS_FOUND",
      "UNSUPPORTED",
      "ACCESS_DENIED",
      "FAILED",
    ]) {
      expect(parseGuardDutyScanEvent(event(result)).result).toBe(result);
    }
    expect(parseGuardDutyScanEvent(event("UNSUPPORTED")).statusReason).toBe(
      "PASSWORD_PROTECTED",
    );
  });

  it("rejects unknown source, event type and result values", () => {
    expect(() => parseGuardDutyScanEvent(event("UNKNOWN"))).toThrow();
    expect(() =>
      parseGuardDutyScanEvent({ ...event("FAILED"), source: "untrusted" }),
    ).toThrow();
  });
});
