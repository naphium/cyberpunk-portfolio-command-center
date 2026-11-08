import { describe, expect, it } from "vitest";
import { faviconForUrl } from "@/lib/favicon";

describe("faviconForUrl", () => {
  it("fetches the favicon for the entered link's domain", () => {
    expect(faviconForUrl("https://github.com/naphium/project?tab=readme")).toBe(
      "https://www.google.com/s2/favicons?domain=github.com&sz=128",
    );
  });

  it("rejects invalid and non-web URLs", () => {
    expect(faviconForUrl("not a url")).toBeNull();
    expect(faviconForUrl("javascript:alert(1)")).toBeNull();
  });
});
