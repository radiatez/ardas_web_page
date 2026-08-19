import type { Locale } from "@/i18n/config";

export const contactFieldNames = [
  "submission_id",
  "locale",
  "name",
  "company",
  "email",
  "phone",
  "subject",
  "message",
  "privacy_notice_version",
  "privacy_notice_shown_at",
  "privacy_acknowledged",
  "website",
] as const;

export const careerFieldNames = [
  "submission_id",
  "locale",
  "first_name",
  "last_name",
  "phone",
  "email",
  "department_id",
  "location_key",
  "expected_salary_try",
  "available_from",
  "about_text",
  "knows_company",
  "knows_company_source",
  "gender",
  "birth_date",
  "marital_status",
  "military_status",
  "deferment_date",
  "privacy_notice_version",
  "privacy_notice_shown_at",
  "privacy_acknowledged",
  "website",
  "cv",
] as const;

export const locationKeys = ["istanbul", "ankara", "diyarbakir"] as const;
export type LocationKey = (typeof locationKeys)[number];

export type FormErrorCode =
  | "required"
  | "invalid"
  | "too_short"
  | "too_long"
  | "unexpected"
  | "privacy_version_mismatch"
  | "approval_gated_disabled"
  | "military_status_required"
  | "deferment_date_required";

export type FormFieldErrors = Record<string, FormErrorCode>;

export type PublicFormConfiguration = {
  locale: Locale;
  privacyNoticeVersion: string;
  privacyAcknowledgementRequired: boolean;
  approvalGatedCareerFieldsEnabled: boolean;
};

export function approvalGatedCareerFieldErrors(
  values: {
    gender?: string;
    birthDate?: string;
    maritalStatus?: string;
    militaryStatus?: string;
    defermentDate?: string;
  },
  enabled: boolean,
): FormFieldErrors {
  const supplied = Object.entries(values).filter(([, value]) => Boolean(value?.trim()));
  if (!enabled) {
    return Object.fromEntries(
      supplied.map(([field]) => [field, "approval_gated_disabled"]),
    );
  }

  const errors: FormFieldErrors = {};
  if (values.gender?.trim().toLowerCase() === "male" && !values.militaryStatus?.trim()) {
    errors.militaryStatus = "military_status_required";
  }
  if (
    values.militaryStatus?.trim().toLowerCase() === "deferred" &&
    !values.defermentDate?.trim()
  ) {
    errors.defermentDate = "deferment_date_required";
  }
  return errors;
}

