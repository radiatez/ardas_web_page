// @vitest-environment jsdom

import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { CareerApplicationActions } from "../../src/components/admin/admin-controls";

afterEach(() => cleanup());

describe("Milestone 7 HR admin accessibility", () => {
  it("labels status, notes and destructive confirmation without axe violations", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CareerApplicationActions
        id="00000000-0000-4000-8000-000000000001"
        currentStatus="Yeni"
        transitions={[{ value: "in_review", label: "İncelemede" }]}
        canStatus
        canNotes
        canAnonymize
        canDelete={false}
        retentionEligible
      />,
    );
    expect(
      await axe.run(container, { rules: { "color-contrast": { enabled: false } } }),
    ).toMatchObject({ violations: [] });

    const trigger = screen.getByRole("button", { name: "Kaydı anonimleştir" });
    await user.click(trigger);
    const dialog = screen.getByRole("alertdialog", { name: "İşlemi onaylayın" });
    expect(dialog).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Onayla" }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Vazgeç" }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Onayla" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
