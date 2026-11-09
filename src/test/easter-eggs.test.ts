import { describe, expect, it } from "vitest";
import { advanceSequence, avatarCombo, INTERACTION_EGGS } from "@/lib/easter-eggs";
import { mergeData } from "@/lib/content";

describe("secret interaction rules", () => {
  it("triggers only the full matrix word and allows repeating", () => {
    let buffer = ""; let count = 0;
    for (const key of "matriXmatrix") { const result = advanceSequence(buffer, key); buffer = result.buffer; if (result.triggered) count++; }
    expect(count).toBe(2);
    expect(advanceSequence("matr", "q").triggered).toBe(false);
  });
  it("requires five avatar taps within two seconds", () => {
    expect(avatarCombo([0, 400, 800, 1200], 2000).triggered).toBe(true);
    expect(avatarCombo([0, 400, 800, 1200], 2001).triggered).toBe(false);
    expect(avatarCombo([0, 400, 800], 1200).triggered).toBe(false);
  });
  it("keeps full motion on by default for older saved documents", () => {
    expect(mergeData({ settings: { effects: {} } }).settings.effects.reducedMotion).toBe(false);
    expect(mergeData({ settings: { effects: { reducedMotion: true } } }).settings.effects.reducedMotion).toBe(true);
  });
  it("includes all seven uploaded interactions", () => { expect(INTERACTION_EGGS).toHaveLength(7); });
});