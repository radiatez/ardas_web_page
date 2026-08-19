import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const tokenCss = readFileSync(
  resolve(process.cwd(), "src/styles/tokens.css"),
  "utf8",
);
const globalCss = readFileSync(
  resolve(process.cwd(), "src/styles/global.css"),
  "utf8",
);

function tokenHex(name: string): string {
  const match = tokenCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`Missing token: ${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("design token accessibility", () => {
  it("keeps primary accent and body text at WCAG AA contrast on white", () => {
    const white = tokenHex("color-white");
    expect(contrast(tokenHex("color-accent"), white)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokenHex("color-text"), white)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokenHex("color-text-muted"), white)).toBeGreaterThanOrEqual(4.5);
  });

  it("defines every required token family", () => {
    for (const family of [
      "color-",
      "surface-",
      "type-",
      "space-",
      "grid-",
      "radius-",
      "border-",
      "motion-",
      "z-",
      "breakpoint-",
    ]) {
      expect(tokenCss).toContain(`--${family}`);
    }
  });

  it("removes non-essential movement for reduced-motion users", () => {
    expect(globalCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalCss).toContain(".corporate-media:hover .corporate-media__image");
    expect(globalCss).toContain("animation: none");
    expect(globalCss).toContain("transform: none");
  });

  it("keeps the shell mobile-first and guards against horizontal overflow", () => {
    expect(globalCss).toMatch(/body\s*\{[^}]*overflow-x:\s*clip;/s);
    expect(globalCss).toContain("grid-template-columns: repeat(var(--grid-columns-mobile)");
    expect(globalCss).toContain("@media (min-width: 40rem)");
    expect(globalCss).toContain("@media (min-width: 64rem)");
    expect(globalCss).toContain("@media (min-width: 80rem)");
    expect(globalCss).toMatch(
      /\.public-header__desktop-navigation,[\s\S]*?display:\s*none;/,
    );
    expect(globalCss).toMatch(
      /@media \(min-width: 80rem\)[\s\S]*?\.public-header__desktop-navigation,[\s\S]*?display:\s*block;/,
    );
  });

  it("gives Milestone 4 editorial layouts explicit mobile and desktop contracts", () => {
    expect(globalCss).toMatch(/\.home-impact__copy,[\s\S]*?grid-column:\s*1 \/ -1;/);
    expect(globalCss).toMatch(
      /@media \(min-width: 64rem\)[\s\S]*?\.home-impact__copy\s*\{[\s\S]*?grid-column:\s*1 \/ span 7;/,
    );
    expect(globalCss).toMatch(
      /\.home-products__grid\s*\{[\s\S]*?display:\s*grid;/,
    );
    expect(globalCss).toMatch(
      /@media \(min-width: 64rem\)[\s\S]*?\.home-products__grid\s*\{[\s\S]*?repeat\(3,/,
    );
    expect(globalCss).toContain("minmax(0, 1fr)");
  });
});
