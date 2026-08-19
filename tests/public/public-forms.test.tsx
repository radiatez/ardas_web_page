// @vitest-environment jsdom

import axe from "axe-core";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CareerApplicationForm,
  ContactForm,
} from "../../src/components/public/public-forms";
import { temporaryPrivacyNotices } from "../../src/content/temporary-legal-content";

function configuration(kind: "career" | "contact", locale: "tr" | "en" = "tr") {
  const privacyNotice = temporaryPrivacyNotices[kind][locale];
  return {
  locale,
  privacyNoticeVersion: privacyNotice.legal_version,
  privacyNotice,
  privacyAcknowledgementRequired: true,
  approvalGatedCareerFieldsEnabled: false,
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("public form accessibility and interaction", () => {
  it("associates career labels, CV help and the company-source conditional", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CareerApplicationForm
        configuration={configuration("career")}
        noticeShownAt="2026-08-19T08:00:00.000Z"
        options={{
          departments: [{ id: "00000000-0000-4000-8000-000000000001", key: "sales", label: "Satış Temsilcisi" }],
          locations: [{ id: "00000000-0000-4000-8000-000000000002", key: "istanbul", label: "İstanbul" }],
        }}
        submissionId="00000000-0000-4000-8000-000000000003"
      />,
    );

    expect((screen.getByLabelText(/^İsim/) as HTMLInputElement).required).toBe(true);
    expect(screen.getByLabelText(/^CV/).getAttribute("accept")).toBe(".pdf,application/pdf");
    expect(container.querySelector("#cv-help")?.textContent).toMatch(/En fazla 10 MB/);
    expect(screen.queryByLabelText("Nereden tanıyorsunuz?")).toBeNull();
    await user.selectOptions(screen.getByLabelText(/^Şirketimizi tanıyor musunuz\?/), "yes");
    expect((screen.getByLabelText(/^Nereden tanıyorsunuz\?/) as HTMLInputElement).required).toBe(true);

    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });

  it("focuses the first server-invalid field after a failed contact submit", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message: "Formdaki alanları kontrol edin.",
          fieldErrors: { email: "Geçerli bir değer girin." },
        }),
      }),
    );
    render(
      <ContactForm
        configuration={configuration("contact")}
        noticeShownAt="2026-08-19T08:00:00.000Z"
        submissionId="00000000-0000-4000-8000-000000000004"
      />,
    );
    await user.type(screen.getByLabelText(/^Ad Soyad/), "Test Kullanıcı");
    await user.type(screen.getByLabelText(/^E-posta/), "test@example.com");
    await user.type(screen.getByLabelText(/^Konu/), "Kurumsal talep");
    await user.type(screen.getByLabelText(/^Mesaj/), "Kurumsal iletişim talebi hakkında bilgi almak istiyorum.");
    await user.click(screen.getByLabelText("KVKK Aydınlatma Metni'ni okudum."));
    await user.click(screen.getByRole("button", { name: "Mesajı gönder" }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText(/^E-posta/)));
    expect(screen.getByLabelText(/^E-posta/).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain("Formdaki alanları kontrol edin.");
  });

  it("announces a successful contact submission", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Mesajınız güvenli şekilde alındı." }),
      }),
    );
    render(
      <ContactForm
        configuration={configuration("contact")}
        noticeShownAt="2026-08-19T08:00:00.000Z"
        submissionId="00000000-0000-4000-8000-000000000005"
      />,
    );
    await user.type(screen.getByLabelText(/^Ad Soyad/), "Test Kullanıcı");
    await user.type(screen.getByLabelText(/^E-posta/), "test@example.com");
    await user.type(screen.getByLabelText(/^Konu/), "Kurumsal talep");
    await user.type(screen.getByLabelText(/^Mesaj/), "Kurumsal iletişim talebi hakkında bilgi almak istiyorum.");
    await user.click(screen.getByLabelText("KVKK Aydınlatma Metni'ni okudum."));
    await user.click(screen.getByRole("button", { name: "Mesajı gönder" }));

    expect((await screen.findByRole("status")).textContent).toContain("Mesajınız güvenli şekilde alındı.");
    expect((screen.getByRole("button", { name: "Mesajı gönder" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("uses the same approval-gated military and deferment conditions in the client", async () => {
    const user = userEvent.setup();
    render(
      <CareerApplicationForm
        configuration={{ ...configuration("career"), approvalGatedCareerFieldsEnabled: true }}
        noticeShownAt="2026-08-19T08:00:00.000Z"
        options={{
          departments: [{ id: "00000000-0000-4000-8000-000000000001", key: "sales", label: "Satış Temsilcisi" }],
          locations: [{ id: "00000000-0000-4000-8000-000000000002", key: "istanbul", label: "İstanbul" }],
        }}
        submissionId="00000000-0000-4000-8000-000000000006"
      />,
    );

    expect(screen.queryByLabelText(/^Askerlik Durumu/)).toBeNull();
    await user.type(screen.getByLabelText("Cinsiyet"), "Male");
    const military = screen.getByLabelText(/^Askerlik Durumu/) as HTMLSelectElement;
    expect(military.required).toBe(true);
    await user.selectOptions(military, "deferred");
    expect(
      (screen.getByLabelText(/^Tecil Tarihi/) as HTMLInputElement).required,
    ).toBe(true);
  });

  it("uses notice acknowledgement rather than treating it as explicit consent", () => {
    const { rerender } = render(
      <ContactForm
        configuration={configuration("contact")}
        noticeShownAt="2026-08-19T08:00:00.000Z"
        submissionId="00000000-0000-4000-8000-000000000007"
      />,
    );
    expect(screen.getByLabelText("KVKK Aydınlatma Metni'ni okudum.")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/açık rıza veriyorum/i);

    rerender(
      <ContactForm
        configuration={configuration("contact", "en")}
        noticeShownAt="2026-08-19T08:00:00.000Z"
        submissionId="00000000-0000-4000-8000-000000000008"
      />,
    );
    expect(screen.getByLabelText(/I have read the Data Protection Notice/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/I consent/i);
  });
});
