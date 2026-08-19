"use client";

import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";

import type { PublicFormConfiguration } from "@/forms/contracts";
import type { CareerFormOptions } from "@/forms/options";
import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/i18n/routes";

type SubmitState = {
  status: "idle" | "submitting" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  locked?: boolean;
};

type CommonFormProps = {
  configuration: PublicFormConfiguration;
  noticeShownAt: string;
  submissionId: string;
};

function fieldErrorId(name: string): string {
  return `${name}-error`;
}

function FormField({
  children,
  error,
  label,
  name,
  required = false,
  wide = false,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  name: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="public-form__field" data-wide={wide || undefined}>
      <label htmlFor={name}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="public-form__field-error" id={fieldErrorId(name)}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FormStatus({ state }: { state: SubmitState }) {
  const ref = useRef<HTMLDivElement>(null);
  if (state.status === "idle" || state.status === "submitting") return null;
  return (
    <div
      aria-live={state.status === "success" ? "polite" : "assertive"}
      className="public-form__status"
      data-status={state.status}
      ref={ref}
      role={state.status === "error" ? "alert" : "status"}
      tabIndex={-1}
    >
      <span className="signature-rule" aria-hidden="true" />
      <strong>{state.message}</strong>
    </div>
  );
}

function PrivacyFields({
  configuration,
  noticeShownAt,
}: Pick<CommonFormProps, "configuration" | "noticeShownAt">) {
  const { locale } = configuration;
  return (
    <div className="public-form__privacy">
      <input
        name="privacy_notice_version"
        type="hidden"
        value={configuration.privacyNoticeVersion}
      />
      <input name="privacy_notice_shown_at" type="hidden" value={noticeShownAt} />
      <p>
        {configuration.privacyNoticeVersion === "TBD"
          ? locale === "tr"
            ? "Gizlilik bildirimi sürümü onay bekliyor; bu form production ortamında kapalı kalır."
            : "The privacy notice version is pending approval; this form remains disabled in production."
          : locale === "tr"
            ? `Gizlilik bildirimi sürümü: ${configuration.privacyNoticeVersion}`
            : `Privacy notice version: ${configuration.privacyNoticeVersion}`}
        {" "}
        <Link href={getLocalizedPath("privacy", locale)}>
          {locale === "tr" ? "Gizlilik sayfası" : "Privacy page"}
        </Link>
      </p>
      {configuration.privacyAcknowledgementRequired ? (
        <label className="public-form__checkbox" htmlFor="privacy_acknowledged">
          <input id="privacy_acknowledged" name="privacy_acknowledged" required type="checkbox" />
          <span>
            {locale === "tr"
              ? "Gizlilik bildirimini görüntülediğimi onaylıyorum."
              : "I confirm that I have viewed the privacy notice."}
          </span>
        </label>
      ) : null}
    </div>
  );
}

function Honeypot() {
  return (
    <div aria-hidden="true" className="public-form__honeypot">
      <label htmlFor="website">Website</label>
      <input autoComplete="off" id="website" name="website" tabIndex={-1} />
    </div>
  );
}

function focusSubmitResult(form: HTMLFormElement, state: "error" | "success") {
  requestAnimationFrame(() => {
    const target =
      state === "error"
        ? form.querySelector<HTMLElement>("[aria-invalid='true']") ??
          form.querySelector<HTMLElement>(".public-form__status")
        : form.querySelector<HTMLElement>(".public-form__status");
    target?.focus();
  });
}

function responseLocaleHeader(locale: Locale): HeadersInit {
  return { "Accept-Language": locale };
}

function formatPhoneForLocale(value: string, locale: Locale): string {
  if (locale !== "tr") return value.slice(0, 32);
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("90")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits) return "+90 ";
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)];
  let formatted = `+90 (${groups[0]}`;
  if (groups[0]?.length === 3) formatted += ")";
  if (groups[1]) formatted += ` ${groups[1]}`;
  if (groups[2]) formatted += ` ${groups[2]}`;
  if (groups[3]) formatted += ` ${groups[3]}`;
  return formatted;
}

function clientValidate(form: HTMLFormElement): boolean {
  if (form.checkValidity()) return true;
  form.reportValidity();
  const firstInvalid = form.querySelector<HTMLElement>(":invalid");
  firstInvalid?.focus();
  return false;
}

export function ContactForm({
  configuration,
  noticeShownAt,
  submissionId,
}: CommonFormProps) {
  const { locale } = configuration;
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [phone, setPhone] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!clientValidate(form)) return;
    setState({ status: "submitting" });
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...responseLocaleHeader(locale),
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        message?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!response.ok) {
        setState({
          status: "error",
          message:
            result.message ??
            (locale === "tr" ? "Form gönderilemedi." : "The form could not be submitted."),
          fieldErrors: result.fieldErrors,
        });
        focusSubmitResult(form, "error");
        return;
      }
      setState({ status: "success", message: result.message });
      focusSubmitResult(form, "success");
    } catch {
      setState({
        status: "error",
        message:
          locale === "tr"
            ? "Bağlantı kurulamadı. Lütfen tekrar deneyin."
            : "A connection could not be established. Please try again.",
      });
      focusSubmitResult(form, "error");
    }
  }

  const errors = state.fieldErrors ?? {};
  return (
    <form className="public-form" noValidate onSubmit={submit}>
      <input name="submission_id" type="hidden" value={submissionId} />
      <input name="locale" type="hidden" value={locale} />
      <Honeypot />
      <div className="public-form__grid">
        <FormField error={errors.name} label={locale === "tr" ? "Ad Soyad" : "Name Surname"} name="name" required>
          <input aria-describedby={errors.name ? fieldErrorId("name") : undefined} aria-invalid={Boolean(errors.name)} autoComplete="name" id="name" maxLength={240} minLength={2} name="name" required />
        </FormField>
        <FormField error={errors.company} label={locale === "tr" ? "Firma" : "Company"} name="company">
          <input aria-describedby={errors.company ? fieldErrorId("company") : undefined} aria-invalid={Boolean(errors.company)} autoComplete="organization" id="company" maxLength={255} name="company" />
        </FormField>
        <FormField error={errors.email} label={locale === "tr" ? "E-posta" : "Email"} name="email" required>
          <input aria-describedby={errors.email ? fieldErrorId("email") : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" id="email" maxLength={320} name="email" required type="email" />
        </FormField>
        <FormField error={errors.phone} label={locale === "tr" ? "Telefon" : "Phone"} name="phone">
          <input aria-describedby={errors.phone ? fieldErrorId("phone") : undefined} aria-invalid={Boolean(errors.phone)} autoComplete="tel" id="phone" inputMode="tel" maxLength={32} name="phone" onChange={(event) => setPhone(formatPhoneForLocale(event.target.value, locale))} placeholder={locale === "tr" ? "+90 (5xx) xxx xx xx" : "+90 5xx xxx xx xx"} type="tel" value={phone} />
        </FormField>
        <FormField error={errors.subject} label={locale === "tr" ? "Konu" : "Subject"} name="subject" required wide>
          <input aria-describedby={errors.subject ? fieldErrorId("subject") : undefined} aria-invalid={Boolean(errors.subject)} id="subject" maxLength={255} minLength={2} name="subject" required />
        </FormField>
        <FormField error={errors.message} label={locale === "tr" ? "Mesaj" : "Message"} name="message" required wide>
          <textarea aria-describedby={errors.message ? fieldErrorId("message") : undefined} aria-invalid={Boolean(errors.message)} id="message" maxLength={5000} minLength={10} name="message" required rows={8} />
        </FormField>
      </div>
      <PrivacyFields configuration={configuration} noticeShownAt={noticeShownAt} />
      <FormStatus state={state} />
      <button className="button-primary public-form__submit" disabled={state.status === "submitting" || state.status === "success"} type="submit">
        {state.status === "submitting"
          ? locale === "tr" ? "Gönderiliyor…" : "Sending…"
          : locale === "tr" ? "Mesajı gönder" : "Send message"}
      </button>
    </form>
  );
}

export function CareerApplicationForm({
  configuration,
  noticeShownAt,
  options,
  submissionId,
}: CommonFormProps & { options: CareerFormOptions }) {
  const { locale } = configuration;
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [knowsCompany, setKnowsCompany] = useState("");
  const [gender, setGender] = useState("");
  const [militaryStatus, setMilitaryStatus] = useState("");
  const [phone, setPhone] = useState("");

  async function pollCvScan(statusUrl: string, currentSubmissionId: string) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      try {
        const response = await fetch(statusUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...responseLocaleHeader(locale),
          },
          body: JSON.stringify({ locale, submission_id: currentSubmissionId }),
        });
        if (!response.ok) continue;
        const result = (await response.json()) as {
          message?: string;
          status?: "clean" | "infected" | "processing";
        };
        if (result.status === "clean") {
          setState({ status: "success", message: result.message, locked: true });
          return;
        }
        if (result.status === "infected") {
          setState({ status: "error", message: result.message, locked: true });
          return;
        }
      } catch {
        // The accepted DB record remains authoritative; the next bounded poll retries.
      }
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!clientValidate(form)) return;
    setState({ status: "submitting" });
    try {
      const response = await fetch("/api/career/applications", {
        method: "POST",
        headers: responseLocaleHeader(locale),
        body: new FormData(form),
      });
      const result = (await response.json()) as {
        message?: string;
        fieldErrors?: Record<string, string>;
        statusUrl?: string;
      };
      if (!response.ok) {
        setState({
          status: "error",
          message:
            result.message ??
            (locale === "tr" ? "Başvuru gönderilemedi." : "The application could not be submitted."),
          fieldErrors: result.fieldErrors,
        });
        focusSubmitResult(form, "error");
        return;
      }
      setState({ status: "success", message: result.message, locked: true });
      focusSubmitResult(form, "success");
      if (result.statusUrl) void pollCvScan(result.statusUrl, submissionId);
    } catch {
      setState({
        status: "error",
        message:
          locale === "tr"
            ? "Bağlantı kurulamadı. Lütfen tekrar deneyin."
            : "A connection could not be established. Please try again.",
      });
      focusSubmitResult(form, "error");
    }
  }

  const errors = state.fieldErrors ?? {};
  return (
    <form className="public-form public-form--career" encType="multipart/form-data" noValidate onSubmit={submit}>
      <input name="submission_id" type="hidden" value={submissionId} />
      <input name="locale" type="hidden" value={locale} />
      <Honeypot />
      <fieldset className="public-form__group">
        <legend>{locale === "tr" ? "Kişisel bilgiler" : "Personal details"}</legend>
        <div className="public-form__grid">
          <FormField error={errors.firstName} label={locale === "tr" ? "İsim" : "First Name"} name="first_name" required>
            <input aria-describedby={errors.firstName ? fieldErrorId("first_name") : undefined} aria-invalid={Boolean(errors.firstName)} autoComplete="given-name" id="first_name" maxLength={120} name="first_name" required />
          </FormField>
          <FormField error={errors.lastName} label={locale === "tr" ? "Soyisim" : "Last Name"} name="last_name" required>
            <input aria-describedby={errors.lastName ? fieldErrorId("last_name") : undefined} aria-invalid={Boolean(errors.lastName)} autoComplete="family-name" id="last_name" maxLength={120} name="last_name" required />
          </FormField>
          <FormField error={errors.phone} label={locale === "tr" ? "Telefon" : "Phone"} name="phone" required>
            <input aria-describedby={errors.phone ? fieldErrorId("phone") : undefined} aria-invalid={Boolean(errors.phone)} autoComplete="tel" id="phone" inputMode="tel" maxLength={32} name="phone" onChange={(event) => setPhone(formatPhoneForLocale(event.target.value, locale))} placeholder={locale === "tr" ? "+90 (5xx) xxx xx xx" : "+90 5xx xxx xx xx"} required type="tel" value={phone} />
          </FormField>
          <FormField error={errors.email} label={locale === "tr" ? "E-posta" : "Email"} name="email" required>
            <input aria-describedby={errors.email ? fieldErrorId("email") : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" id="email" maxLength={320} name="email" required type="email" />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="public-form__group">
        <legend>{locale === "tr" ? "Başvuru tercihleri" : "Application preferences"}</legend>
        <div className="public-form__grid">
          <FormField error={errors.departmentId} label={locale === "tr" ? "Başvurulan Departman" : "Department"} name="department_id" required>
            <select aria-describedby={errors.departmentId ? fieldErrorId("department_id") : undefined} aria-invalid={Boolean(errors.departmentId)} defaultValue="" id="department_id" name="department_id" required>
              <option disabled value="">{locale === "tr" ? "Seçiniz" : "Select"}</option>
              {options.departments.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </FormField>
          <FormField error={errors.locationKey} label={locale === "tr" ? "Başvurulan Depo" : "Target Location"} name="location_key" required>
            <select aria-describedby={errors.locationKey ? fieldErrorId("location_key") : undefined} aria-invalid={Boolean(errors.locationKey)} defaultValue="" id="location_key" name="location_key" required>
              <option disabled value="">{locale === "tr" ? "Seçiniz" : "Select"}</option>
              {options.locations.map((option) => <option key={option.id} value={option.key}>{option.label}</option>)}
            </select>
          </FormField>
          <FormField error={errors.expectedSalaryTry} label={locale === "tr" ? "Beklenen net aylık ücret (TRY)" : "Expected net monthly salary (TRY)"} name="expected_salary_try" required>
            <input aria-describedby={errors.expectedSalaryTry ? fieldErrorId("expected_salary_try") : undefined} aria-invalid={Boolean(errors.expectedSalaryTry)} id="expected_salary_try" inputMode="decimal" max="100000000" min="1" name="expected_salary_try" required step="0.01" type="number" />
          </FormField>
          <FormField error={errors.availableFrom} label={locale === "tr" ? "İşe başlayabileceğiniz tarih" : "Available start date"} name="available_from" required>
            <input aria-describedby={errors.availableFrom ? fieldErrorId("available_from") : undefined} aria-invalid={Boolean(errors.availableFrom)} id="available_from" name="available_from" required type="date" />
          </FormField>
          <FormField error={errors.knowsCompany} label={locale === "tr" ? "Şirketimizi tanıyor musunuz?" : "Do you know our company?"} name="knows_company" required>
            <select aria-describedby={errors.knowsCompany ? fieldErrorId("knows_company") : undefined} aria-invalid={Boolean(errors.knowsCompany)} id="knows_company" name="knows_company" onChange={(event) => setKnowsCompany(event.target.value)} required value={knowsCompany}>
              <option disabled value="">{locale === "tr" ? "Seçiniz" : "Select"}</option>
              <option value="yes">{locale === "tr" ? "Evet" : "Yes"}</option>
              <option value="no">{locale === "tr" ? "Hayır" : "No"}</option>
            </select>
          </FormField>
          {knowsCompany === "yes" ? (
            <FormField error={errors.knowsCompanySource} label={locale === "tr" ? "Nereden tanıyorsunuz?" : "Where from?"} name="knows_company_source" required>
              <input aria-describedby={errors.knowsCompanySource ? fieldErrorId("knows_company_source") : undefined} aria-invalid={Boolean(errors.knowsCompanySource)} id="knows_company_source" maxLength={500} name="knows_company_source" required />
            </FormField>
          ) : null}
          <FormField error={errors.aboutText} label={locale === "tr" ? "Kısaca Kendinizi Tanıtın" : "About You"} name="about_text" required wide>
            <textarea aria-describedby={errors.aboutText ? fieldErrorId("about_text") : undefined} aria-invalid={Boolean(errors.aboutText)} id="about_text" maxLength={4000} minLength={20} name="about_text" required rows={8} />
          </FormField>
          {configuration.approvalGatedCareerFieldsEnabled ? (
            <>
              <FormField error={errors.gender} label={locale === "tr" ? "Cinsiyet" : "Gender"} name="gender">
                <input aria-describedby={errors.gender ? fieldErrorId("gender") : undefined} aria-invalid={Boolean(errors.gender)} id="gender" maxLength={80} name="gender" onChange={(event) => setGender(event.target.value)} value={gender} />
              </FormField>
              <FormField error={errors.birthDate} label={locale === "tr" ? "Doğum Tarihi" : "Date of Birth"} name="birth_date">
                <input aria-describedby={errors.birthDate ? fieldErrorId("birth_date") : undefined} aria-invalid={Boolean(errors.birthDate)} id="birth_date" name="birth_date" type="date" />
              </FormField>
              <FormField error={errors.maritalStatus} label={locale === "tr" ? "Medeni Hal" : "Marital Status"} name="marital_status">
                <input aria-describedby={errors.maritalStatus ? fieldErrorId("marital_status") : undefined} aria-invalid={Boolean(errors.maritalStatus)} id="marital_status" maxLength={80} name="marital_status" />
              </FormField>
              {gender.trim().toLowerCase() === "male" ? (
                <FormField error={errors.militaryStatus} label={locale === "tr" ? "Askerlik Durumu" : "Military Status"} name="military_status" required>
                  <select aria-describedby={errors.militaryStatus ? fieldErrorId("military_status") : undefined} aria-invalid={Boolean(errors.militaryStatus)} id="military_status" name="military_status" onChange={(event) => setMilitaryStatus(event.target.value)} required value={militaryStatus}>
                    <option disabled value="">{locale === "tr" ? "Seçiniz" : "Select"}</option>
                    <option value="completed">{locale === "tr" ? "Tamamlandı" : "Completed"}</option>
                    <option value="not_completed">{locale === "tr" ? "Tamamlanmadı" : "Not Completed"}</option>
                    <option value="deferred">{locale === "tr" ? "Tecilli" : "Deferred"}</option>
                  </select>
                </FormField>
              ) : null}
              {gender.trim().toLowerCase() === "male" && militaryStatus === "deferred" ? (
                <FormField error={errors.defermentDate} label={locale === "tr" ? "Tecil Tarihi" : "Deferment Date"} name="deferment_date" required>
                  <input aria-describedby={errors.defermentDate ? fieldErrorId("deferment_date") : undefined} aria-invalid={Boolean(errors.defermentDate)} id="deferment_date" name="deferment_date" required type="date" />
                </FormField>
              ) : null}
            </>
          ) : null}
          <FormField error={errors.cv} label={locale === "tr" ? "CV" : "CV"} name="cv" required wide>
            <input accept=".pdf,application/pdf" aria-describedby={`cv-help${errors.cv ? ` ${fieldErrorId("cv")}` : ""}`} aria-invalid={Boolean(errors.cv)} id="cv" name="cv" required type="file" />
            <p className="public-form__help" id="cv-help">
              {locale === "tr"
                ? "Yalnızca PDF · En fazla 10 MB · Güvenlik taraması tamamlanana kadar erişime kapalı"
                : "PDF only · Maximum 10 MB · Inaccessible until the security scan is complete"}
            </p>
          </FormField>
        </div>
      </fieldset>
      <PrivacyFields configuration={configuration} noticeShownAt={noticeShownAt} />
      <FormStatus state={state} />
      <button className="button-primary public-form__submit" disabled={state.status === "submitting" || Boolean(state.locked)} type="submit">
        {state.status === "submitting"
          ? locale === "tr" ? "Başvuru gönderiliyor…" : "Submitting application…"
          : locale === "tr" ? "Başvuruyu gönder" : "Submit application"}
      </button>
    </form>
  );
}
