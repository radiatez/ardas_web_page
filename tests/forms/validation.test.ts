import { describe, expect, it } from "vitest";

import type { PublicFormConfiguration } from "../../src/forms/contracts";
import { PublicFormValidationError } from "../../src/forms/errors";
import { parseContactRequestBody } from "../../src/forms/parsing";
import {
  normalizeEmail,
  normalizePhone,
  validateCareerSubmission,
  validateContactSubmission,
} from "../../src/forms/validation";

const configuration: PublicFormConfiguration = {
  locale: "tr",
  privacyNoticeVersion: "test-v1",
  privacyAcknowledgementRequired: true,
  approvalGatedCareerFieldsEnabled: false,
};
const now = new Date("2026-08-19T08:00:00.000Z");

function validCareer() {
  return {
    submissionId: "00000000-0000-4000-8000-000000000001",
    locale: "tr",
    firstName: " Ada ",
    lastName: " Yılmaz ",
    phone: "+90 (555) 111 22 33",
    email: " ADA@EXAMPLE.COM ",
    departmentId: "00000000-0000-4000-8000-000000000002",
    locationKey: "istanbul",
    expectedSalaryTry: "50000,50",
    availableFrom: "2026-09-01",
    aboutText: "Otomotiv dağıtım alanında deneyim sahibiyim.",
    knowsCompany: "yes",
    knowsCompanySource: "Sektör çalışmaları",
    privacyNoticeVersion: "test-v1",
    privacyNoticeShownAt: "2026-08-19T07:55:00.000Z",
    privacyAcknowledged: true,
  };
}

describe("Milestone 5 authoritative form validation", () => {
  it("normalizes email and Turkish phone values to canonical storage forms", () => {
    expect(normalizeEmail(" PERSON@Example.COM ")).toBe("person@example.com");
    expect(normalizePhone("+90 (555) 111 22 33")).toBe("+905551112233");
    expect(normalizePhone("0555 111 22 33")).toBe("+905551112233");
  });

  it("accepts and trims a complete contact submission with provenance", () => {
    const result = validateContactSubmission(
      {
        submissionId: "00000000-0000-4000-8000-000000000003",
        locale: "tr",
        name: " Test Kişi ",
        company: " Ardaş Test ",
        email: " TEST@EXAMPLE.COM ",
        phone: "+90 555 111 22 33",
        subject: " Kurumsal talep ",
        message: "Kurumsal talebimiz hakkında bilgi almak istiyoruz.",
        privacyNoticeVersion: "test-v1",
        privacyNoticeShownAt: "2026-08-19T07:55:00.000Z",
        privacyAcknowledged: true,
      },
      configuration,
      now,
    );
    expect(result).toMatchObject({
      name: "Test Kişi",
      emailNormalized: "test@example.com",
      phoneNormalized: "+905551112233",
      locale: "tr",
      privacyNoticeVersion: "test-v1",
    });
  });

  it("rejects required contact fields, invalid email, overlong copy and stale notice version", () => {
    try {
      validateContactSubmission(
        {
          submissionId: "bad",
          locale: "tr",
          name: "",
          email: "invalid",
          subject: "",
          message: "x".repeat(5_001),
          privacyNoticeVersion: "old-v1",
          privacyNoticeShownAt: "invalid",
        },
        configuration,
        now,
      );
      throw new Error("Expected validation failure.");
    } catch (error) {
      expect(error).toBeInstanceOf(PublicFormValidationError);
      expect((error as PublicFormValidationError).fieldErrors).toMatchObject({
        submissionId: "invalid",
        name: "required",
        email: "invalid",
        subject: "required",
        message: "too_long",
        privacyNoticeVersion: "privacy_version_mismatch",
        privacyAcknowledged: "required",
      });
    }
  });

  it("silently identifies the honeypot without accepting a record payload", () => {
    expect(
      validateContactSubmission({ website: "spam.example" }, configuration, now),
    ).toEqual({ honeypot: true });
  });

  it("rejects unexpected contact fields before validation", () => {
    expect(() =>
      parseContactRequestBody(
        new TextEncoder().encode(JSON.stringify({ name: "Test", admin: true })),
      ),
    ).toThrowError("validation_failed");
  });

  it("accepts required career values and keeps the general application job-neutral", () => {
    const result = validateCareerSubmission(validCareer(), configuration, now);
    expect(result).toMatchObject({
      firstName: "Ada",
      lastName: "Yılmaz",
      phoneNormalized: "+905551112233",
      emailNormalized: "ada@example.com",
      locationKey: "istanbul",
      expectedSalaryTry: "50000.50",
      knowsCompany: true,
    });
  });

  it("enforces career entity, salary, availability, about and company-source rules", () => {
    try {
      validateCareerSubmission(
        {
          ...validCareer(),
          departmentId: "not-a-uuid",
          locationKey: "izmir",
          expectedSalaryTry: "0",
          availableFrom: "2026-02-31",
          aboutText: "short",
          knowsCompanySource: "",
        },
        configuration,
        now,
      );
      throw new Error("Expected validation failure.");
    } catch (error) {
      expect((error as PublicFormValidationError).fieldErrors).toMatchObject({
        departmentId: "invalid",
        locationKey: "invalid",
        expectedSalaryTry: "invalid",
        availableFrom: "invalid",
        aboutText: "too_short",
        knowsCompanySource: "required",
      });
    }
  });

  it("rejects approval-gated collection while disabled and enforces enabled conditionals", () => {
    expect(() =>
      validateCareerSubmission(
        { ...validCareer(), gender: "male" },
        configuration,
        now,
      ),
    ).toThrowError("validation_failed");

    const enabled = {
      ...configuration,
      approvalGatedCareerFieldsEnabled: true,
    };
    try {
      validateCareerSubmission(
        { ...validCareer(), gender: "male", militaryStatus: "deferred" },
        enabled,
        now,
      );
      throw new Error("Expected conditional validation failure.");
    } catch (error) {
      expect((error as PublicFormValidationError).fieldErrors).toMatchObject({
        defermentDate: "deferment_date_required",
      });
    }
    expect(() =>
      validateCareerSubmission(
        {
          ...validCareer(),
          gender: "male",
          militaryStatus: "deferred",
          defermentDate: "2027-01-01",
        },
        enabled,
        now,
      ),
    ).not.toThrow();
  });
});

