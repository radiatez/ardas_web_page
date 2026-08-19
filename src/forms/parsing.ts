import {
  careerFieldNames,
  contactFieldNames,
  type FormFieldErrors,
} from "./contracts";
import { PublicFormValidationError } from "./errors";
import type { RawCareerSubmission, RawContactSubmission } from "./validation";

function assertKnownFields(
  keys: readonly string[],
  allowed: readonly string[],
): void {
  const errors: FormFieldErrors = {};
  for (const key of keys) {
    if (!allowed.includes(key)) errors[key] = "unexpected";
  }
  if (Object.keys(errors).length > 0) throw new PublicFormValidationError(errors);
}

export function parseContactRequestBody(bytes: Uint8Array): RawContactSubmission {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new PublicFormValidationError({ form: "invalid" });
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PublicFormValidationError({ form: "invalid" });
  }
  const record = value as Record<string, unknown>;
  assertKnownFields(Object.keys(record), contactFieldNames);
  for (const [key, fieldValue] of Object.entries(record)) {
    if (typeof fieldValue !== "string" && typeof fieldValue !== "boolean") {
      throw new PublicFormValidationError({ [key]: "invalid" });
    }
  }
  return {
    submissionId: record.submission_id as string | undefined,
    locale: record.locale as string | undefined,
    name: record.name as string | undefined,
    company: record.company as string | undefined,
    email: record.email as string | undefined,
    phone: record.phone as string | undefined,
    subject: record.subject as string | undefined,
    message: record.message as string | undefined,
    privacyNoticeVersion: record.privacy_notice_version as string | undefined,
    privacyNoticeShownAt: record.privacy_notice_shown_at as string | undefined,
    privacyAcknowledged: record.privacy_acknowledged as string | boolean | undefined,
    website: record.website as string | undefined,
  };
}

function formValue(data: FormData, key: string): string | undefined {
  const values = data.getAll(key);
  if (values.length > 1) throw new PublicFormValidationError({ [key]: "unexpected" });
  const value = values[0];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new PublicFormValidationError({ [key]: "invalid" });
  return value;
}

export async function parseCareerRequestBody(
  bytes: Uint8Array,
  contentType: string | null,
): Promise<{ raw: RawCareerSubmission; cv: File }> {
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new PublicFormValidationError({ form: "invalid" });
  }
  let data: FormData;
  try {
    data = await new Request("http://localhost/form", {
      method: "POST",
      headers: { "content-type": contentType },
      body: bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
    }).formData();
  } catch {
    throw new PublicFormValidationError({ form: "invalid" });
  }
  assertKnownFields([...data.keys()], careerFieldNames);
  for (const key of new Set(data.keys())) {
    if (data.getAll(key).length > 1) {
      throw new PublicFormValidationError({ [key]: "unexpected" });
    }
  }
  const cv = data.get("cv");
  if (!(cv instanceof File)) throw new PublicFormValidationError({ cv: "required" });

  return {
    raw: {
      submissionId: formValue(data, "submission_id"),
      locale: formValue(data, "locale"),
      firstName: formValue(data, "first_name"),
      lastName: formValue(data, "last_name"),
      phone: formValue(data, "phone"),
      email: formValue(data, "email"),
      departmentId: formValue(data, "department_id"),
      locationKey: formValue(data, "location_key"),
      expectedSalaryTry: formValue(data, "expected_salary_try"),
      availableFrom: formValue(data, "available_from"),
      aboutText: formValue(data, "about_text"),
      knowsCompany: formValue(data, "knows_company"),
      knowsCompanySource: formValue(data, "knows_company_source"),
      gender: formValue(data, "gender"),
      birthDate: formValue(data, "birth_date"),
      maritalStatus: formValue(data, "marital_status"),
      militaryStatus: formValue(data, "military_status"),
      defermentDate: formValue(data, "deferment_date"),
      privacyNoticeVersion: formValue(data, "privacy_notice_version"),
      privacyNoticeShownAt: formValue(data, "privacy_notice_shown_at"),
      privacyAcknowledged: formValue(data, "privacy_acknowledged"),
      website: formValue(data, "website"),
    },
    cv,
  };
}
