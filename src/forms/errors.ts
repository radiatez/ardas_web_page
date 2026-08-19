import type { Locale } from "@/i18n/config";
import { SecurityBoundaryError } from "@/security/errors";

import type { FormErrorCode, FormFieldErrors } from "./contracts";

export class PublicFormValidationError extends SecurityBoundaryError {
  constructor(public readonly fieldErrors: FormFieldErrors) {
    super("validation_failed", 400);
  }
}

const localizedMessages: Record<Locale, Record<FormErrorCode, string>> = {
  tr: {
    required: "Bu alan zorunludur.",
    invalid: "Geçerli bir değer girin.",
    too_short: "Bu alan için daha fazla bilgi girin.",
    too_long: "Bu alan izin verilen uzunluğu aşıyor.",
    unexpected: "Beklenmeyen bir alan gönderildi.",
    privacy_version_mismatch: "Gizlilik bildirimi güncellendi. Lütfen formu yenileyin.",
    approval_gated_disabled: "Bu alan şu anda veri toplamaya açık değildir.",
    military_status_required: "Askerlik durumu zorunludur.",
    deferment_date_required: "Tecil tarihi zorunludur.",
  },
  en: {
    required: "This field is required.",
    invalid: "Enter a valid value.",
    too_short: "Provide more information for this field.",
    too_long: "This field exceeds the allowed length.",
    unexpected: "An unexpected field was submitted.",
    privacy_version_mismatch: "The privacy notice changed. Please refresh the form.",
    approval_gated_disabled: "This field is not currently enabled for collection.",
    military_status_required: "Military status is required.",
    deferment_date_required: "Deferment date is required.",
  },
};

export function localizeFieldErrors(
  locale: Locale,
  errors: FormFieldErrors,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).map(([field, code]) => [
      field,
      localizedMessages[locale][code],
    ]),
  );
}

