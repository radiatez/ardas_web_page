// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { publicShellCopy } from "../../src/content/public-shell";
import { MobileMenu } from "../../src/components/public/mobile-menu";

afterEach(() => cleanup());

function renderMenu() {
  const copy = publicShellCopy.tr;
  return render(
    <MobileMenu
      closeLabel={copy.menuCloseLabel}
      dealerPortal={{
        enabled: true,
        source: "environment",
        url: "https://online.bsdotomotiv.com/web",
      }}
      dealerPortalLabel={copy.dealerPortalLabel}
      dealerPortalUnavailableLabel={copy.dealerPortalUnavailableLabel}
      locale="tr"
      navigation={copy.navigation}
      navigationLabel={copy.navigationLabel}
      openLabel={copy.menuOpenLabel}
    />,
  );
}

describe("mobile menu accessibility", () => {
  it("traps focus, closes with Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "Menüyü aç" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Ana navigasyon" });
    const close = within(dialog).getByRole("button", { name: "Menüyü kapat" });
    await waitFor(() => expect(document.activeElement).toBe(close));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(
      dialog.querySelector('a[href="https://online.bsdotomotiv.com/web"]'),
    );

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
  });

  it("exposes expanded state and closes after a navigation choice", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "Menüyü aç" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    const corporateLink = screen.getByRole("link", { name: "Kurumsal" });
    corporateLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(corporateLink);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
