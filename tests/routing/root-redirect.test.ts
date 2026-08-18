import { describe, expect, it } from "vitest";

import { rootRedirect } from "../../next.config";

describe("root redirect", () => {
  it("routes the unprefixed root to the Turkish locale", () => {
    expect(rootRedirect).toEqual({
      source: "/",
      destination: "/tr",
      permanent: false,
    });
  });
});
