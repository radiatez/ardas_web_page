import { createHash } from "node:crypto";

import { isLocale, type Locale } from "@/i18n/config";

import {
  approvalGatedCareerFieldErrors,
  locationKeys,
  type FormFieldErrors,
  type LocationKey,
  type PublicFormConfiguration,
} from "./contracts";
import { PublicFormValidationError } from "./errors";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type RawContactSubmission = {
  submissionId?: string;
  locale?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  privacyNoticeVersion?: string;
  privacyNoticeShownAt?: string;
  privacyAcknowledged?: string | boolean;
  website?: string;
};

export type ValidatedContactSubmission = {
  submissionIdHash: string;
  locale: Locale;
  name: string;
  company: string | null;
  emailNormalized: string;
  phoneNormalized: string | null;
  subject: string;
  message: string;
  privacyNoticeVersion: string;
  privacyNoticeShownAt: Date;
  privacyAcknowledgedAt: Date | null;
};

export type RawCareerSubmission = {
  submissionId?: string;
  locale?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  departmentId?: string;
  locationKey?: string;
  expectedSalaryTry?: string;
  availableFrom?: string;
  aboutText?: string;
  knowsCompany?: string;
  knowsCompanySource?: string;
  gender?: string;
  birthDate?: string;
  maritalStatus?: string;
  militaryStatus?: string;
  defermentDate?: string;
  privacyNoticeVersion?: string;
  privacyNoticeShownAt?: string;
  privacyAcknowledged?: string | boolean;
  website?: string;
};

export type ValidatedCareerSubmission = {
  submissionIdHash: string;
  locale: Locale;
  firstName: string;
  lastName: string;
  phoneNormalized: string;
  emailNormalized: string;
  departmentId: string;
  locationKey: LocationKey;
  expectedSalaryTry: string;
  availableFrom: string;
  aboutText: string;
  knowsCompany: boolean;
  knowsCompanySource: string | null;
  gender: string | null;
  birthDate: string | null;
  maritalStatus: string | null;
  militaryStatus: string | null;
  defermentDate: string | null;
  privacyNoticeVersion: string;
  privacyNoticeShownAt: Date;
  privacyAcknowledgedAt: Date | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const normalized = text(value);
  return normalized || null;
}

function boundedRequired(
  value: unknown,
  field: string,
  errors: FormFieldErrors,
  min: number,
  max: number,
): string {
  const normalized = text(value);
  if (!normalized) errors[field] = "required";
  else if (normalized.length < min) errors[field] = "too_short";
  else if (normalized.length > max) errors[field] = "too_long";
  return normalized;
}

function boundedOptional(
  value: unknown,
  field: string,
  errors: FormFieldErrors,
  max: number,
): string | null {
  const normalized = optionalText(value);
  if (normalized && normalized.length > max) errors[field] = "too_long";
  return normalized;
}

export function normalizeEmail(value: unknown): string | undefined {
  const normalized = text(value).toLowerCase();
  return normalized.length <= 320 && emailPattern.test(normalized)
    ? normalized
    : undefined;
}

export function normalizePhone(value: unknown): string | undefined {
  let digits = text(value).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  if (digits.length < 10 || digits.length > 15 || digits.startsWith("0")) {
    return undefined;
  }
  return `+${digits}`;
}

function validDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function validateProvenance(
  raw: {
    locale?: string;
    privacyNoticeVersion?: string;
    privacyNoticeShownAt?: string;
    privacyAcknowledged?: string | boolean;
  },
  configuration: PublicFormConfiguration,
  errors: FormFieldErrors,
  now: Date,
) {
  const locale = text(raw.locale);
  if (!isLocale(locale) || locale !== configuration.locale) {
    errors.locale = "invalid";
  }

  const version = text(raw.privacyNoticeVersion);
  if (!version || version !== configuration.privacyNoticeVersion) {
    errors.privacyNoticeVersion = "privacy_version_mismatch";
  }

  const shownAt = new Date(text(raw.privacyNoticeShownAt));
  if (
    Number.isNaN(shownAt.getTime()) ||
    shownAt.getTime() > now.getTime() + 5 * 60_000
  ) {
    errors.privacyNoticeShownAt = "invalid";
  }

  const acknowledged =
    raw.privacyAcknowledged === true ||
    raw.privacyAcknowledged === "true" ||
    raw.privacyAcknowledged === "on";
  if (configuration.privacyAcknowledgementRequired && !acknowledged) {
    errors.privacyAcknowledged = "required";
  }

  return {
    locale: isLocale(locale) ? locale : configuration.locale,
    privacyNoticeVersion: version,
    privacyNoticeShownAt: shownAt,
    privacyAcknowledgedAt: acknowledged ? now : null,
  };
}

export function hashSubmissionId(value: string): string {
  return createHash("sha256").update(`ardas-form:${value}`).digest("hex");
}

function validateSubmissionId(value: unknown, errors: FormFieldErrors): string {
  const normalized = text(value);
  if (!uuidPattern.test(normalized)) errors.submissionId = "invalid";
  return normalized;
}

export function validateContactSubmission(
  raw: RawContactSubmission,
  configuration: PublicFormConfiguration,
  now = new Date(),
): ValidatedContactSubmission | { honeypot: true } {
  if (text(raw.website)) return { honeypot: true };

  const errors: FormFieldErrors = {};
  const submissionId = validateSubmissionId(raw.submissionId, errors);
  const name = boundedRequired(raw.name, "name", errors, 2, 240);
  const company = boundedOptional(raw.company, "company", errors, 255);
  const emailNormalized = normalizeEmail(raw.email);
  if (!text(raw.email)) errors.email = "required";
  else if (!emailNormalized) errors.email = "invalid";
  const phoneValue = optionalText(raw.phone);
  const phoneNormalized = phoneValue ? normalizePhone(phoneValue) : undefined;
  if (phoneValue && !phoneNormalized) errors.phone = "invalid";
  const subject = boundedRequired(raw.subject, "subject", errors, 2, 255);
  const message = boundedRequired(raw.message, "message", errors, 10, 5_000);
  const provenance = validateProvenance(raw, configuration, errors, now);

  if (Object.keys(errors).length > 0) throw new PublicFormValidationError(errors);
  return {
    submissionIdHash: hashSubmissionId(submissionId),
    name,
    company,
    emailNormalized: emailNormalized!,
    phoneNormalized: phoneNormalized ?? null,
    subject,
    message,
    ...provenance,
  };
}

export function validateCareerSubmission(
  raw: RawCareerSubmission,
  configuration: PublicFormConfiguration,
  now = new Date(),
): ValidatedCareerSubmission | { honeypot: true } {
  if (text(raw.website)) return { honeypot: true };

  const errors: FormFieldErrors = {};
  const submissionId = validateSubmissionId(raw.submissionId, errors);
  const firstName = boundedRequired(raw.firstName, "firstName", errors, 1, 120);
  const lastName = boundedRequired(raw.lastName, "lastName", errors, 1, 120);
  const phoneNormalized = normalizePhone(raw.phone);
  if (!text(raw.phone)) errors.phone = "required";
  else if (!phoneNormalized) errors.phone = "invalid";
  const emailNormalized = normalizeEmail(raw.email);
  if (!text(raw.email)) errors.email = "required";
  else if (!emailNormalized) errors.email = "invalid";

  const departmentId = text(raw.departmentId);
  if (!uuidPattern.test(departmentId)) errors.departmentId = "invalid";
  const locationKey = text(raw.locationKey);
  if (!locationKeys.includes(locationKey as LocationKey)) errors.locationKey = "invalid";

  const salary = text(raw.expectedSalaryTry).replace(/\s/g, "").replace(",", ".");
  const salaryNumber = Number(salary);
  if (!salary) errors.expectedSalaryTry = "required";
  else if (!Number.isFinite(salaryNumber) || salaryNumber <= 0 || salaryNumber > 100_000_000) {
    errors.expectedSalaryTry = "invalid";
  }

  const availableFrom = text(raw.availableFrom);
  if (!availableFrom) errors.availableFrom = "required";
  else if (!validDate(availableFrom)) errors.availableFrom = "invalid";
  const aboutText = boundedRequired(raw.aboutText, "aboutText", errors, 20, 4_000);

  const knowsCompanyValue = text(raw.knowsCompany).toLowerCase();
  if (knowsCompanyValue !== "yes" && knowsCompanyValue !== "no") {
    errors.knowsCompany = "required";
  }
  const knowsCompany = knowsCompanyValue === "yes";
  const knowsCompanySource = boundedOptional(
    raw.knowsCompanySource,
    "knowsCompanySource",
    errors,
    500,
  );
  if (knowsCompany && !knowsCompanySource) errors.knowsCompanySource = "required";
  if (!knowsCompany && knowsCompanySource) errors.knowsCompanySource = "unexpected";

  const gatedValues = {
    gender: text(raw.gender),
    birthDate: text(raw.birthDate),
    maritalStatus: text(raw.maritalStatus),
    militaryStatus: text(raw.militaryStatus),
    defermentDate: text(raw.defermentDate),
  };
  Object.assign(
    errors,
    approvalGatedCareerFieldErrors(
      gatedValues,
      configuration.approvalGatedCareerFieldsEnabled,
    ),
  );
  for (const [field, value] of Object.entries(gatedValues)) {
    if (value.length > 120) errors[field] = "too_long";
  }
  if (gatedValues.birthDate && !validDate(gatedValues.birthDate)) {
    errors.birthDate = "invalid";
  }
  if (gatedValues.defermentDate && !validDate(gatedValues.defermentDate)) {
    errors.defermentDate = "invalid";
  }
  if (
    gatedValues.militaryStatus &&
    !["completed", "not_completed", "deferred"].includes(
      gatedValues.militaryStatus.toLowerCase(),
    )
  ) {
    errors.militaryStatus = "invalid";
  }

  const provenance = validateProvenance(raw, configuration, errors, now);
  if (Object.keys(errors).length > 0) throw new PublicFormValidationError(errors);

  return {
    submissionIdHash: hashSubmissionId(submissionId),
    firstName,
    lastName,
    phoneNormalized: phoneNormalized!,
    emailNormalized: emailNormalized!,
    departmentId,
    locationKey: locationKey as LocationKey,
    expectedSalaryTry: salaryNumber.toFixed(2),
    availableFrom,
    aboutText,
    knowsCompany,
    knowsCompanySource: knowsCompanySource ?? null,
    gender: optionalText(gatedValues.gender),
    birthDate: optionalText(gatedValues.birthDate),
    maritalStatus: optionalText(gatedValues.maritalStatus),
    militaryStatus: optionalText(gatedValues.militaryStatus),
    defermentDate: optionalText(gatedValues.defermentDate),
    ...provenance,
  };
}
