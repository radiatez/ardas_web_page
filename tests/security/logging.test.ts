import { describe, expect, it } from "vitest";

import {
  createLogger,
  type StructuredLogRecord,
} from "../../src/security/logging";
import { sanitizeAuditMetadata } from "../../src/security/audit";

describe("PII-safe structured logging", () => {
  it("redacts direct and nested personal data, tokens and free text", () => {
    const records: StructuredLogRecord[] = [];
    const logger = createLogger((record) => records.push(record));
    logger.info("contact.received", {
      email: "person@example.com",
      nested: {
        phone: "+90 555 111 22 33",
        messageBody: "private contact message",
        authorization: "Bearer secret-token",
        harmlessId: "00000000-0000-4000-8000-000000000001",
      },
      accidental: "person@example.com",
      url: "https://example.com/path?token=secret#fragment",
    });

    const serialized = JSON.stringify(records);
    for (const forbidden of [
      "person@example.com",
      "+90 555 111 22 33",
      "private contact message",
      "secret-token",
      "?token=secret",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(serialized).toContain("[REDACTED]");
    expect(serialized).toContain("00000000-0000-4000-8000-000000000001");
  });

  it("applies the same minimization boundary to audit metadata", () => {
    const metadata = sanitizeAuditMetadata({
      applicationId: "00000000-0000-4000-8000-000000000001",
      email: "person@example.com",
      contactMessageBody: "private message",
      token: "eyJheader.payload.signature",
      cvFileContent: "%PDF private",
    });
    const serialized = JSON.stringify(metadata);
    expect(serialized).toContain("00000000-0000-4000-8000-000000000001");
    expect(serialized).not.toContain("person@example.com");
    expect(serialized).not.toContain("private message");
    expect(serialized).not.toContain("eyJheader.payload.signature");
    expect(serialized).not.toContain("%PDF private");
  });
});
