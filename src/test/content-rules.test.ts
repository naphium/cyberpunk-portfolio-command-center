import { describe, expect, it } from "vitest";
import { mergeData, TAB_IDS } from "@/lib/content";
import { signToken, verifyToken, passwordMatches } from "@/lib/admin-token";
import { pushHistory, undoHistory, redoHistory, HISTORY_LIMIT, type HistoryState } from "@/hooks/use-history-state";

describe("mergeData", () => {
  it("fills every one of the 16 tabs for an empty document", () => {
    const d = mergeData({});
    expect(d.tabs.map((t) => t.id)).toEqual([...TAB_IDS]);
    expect(d.tabs).toHaveLength(16);
  });

  it("keeps saved tab order, labels and visibility, and appends tabs missing from old data", () => {
    const d = mergeData({ tabs: [{ id: "faq", label: "Q&A", visible: false }, { id: "about", label: "Me", visible: true }] });
    expect(d.tabs[0]).toEqual({ id: "faq", label: "Q&A", visible: false });
    expect(d.tabs[1]?.label).toBe("Me");
    expect(d.tabs).toHaveLength(16);
  });

  it("keeps saved values and backfills new nested settings", () => {
    const d = mergeData({ profile: { name: "Someone Else" }, settings: { effects: { scanlines: true } } });
    expect(d.profile.name).toBe("Someone Else");
    expect(d.profile.handle).toBe("naphium");
    expect(d.settings.effects.scanlines).toBe(true);
    expect(d.settings.effects.fpsCounter).toBe(true);
  });

  it("defaults the owner to Md. Nafim Muttaki", () => {
    expect(mergeData(null).profile.name).toBe("Md. Nafim Muttaki");
  });

  it("backfills an empty favicon on links saved before favicon support", () => {
    const d = mergeData({ links: [{ id: "old", title: "Site", url: "https://example.com", category: "other", handle: "" }] });
    expect(d.links[0]?.favicon).toBe("");
  });
});

describe("admin token", () => {
  const secret = "test-secret-value-that-is-long-enough";
  it("accepts a fresh token signed with the server secret", async () => {
    const t = await signToken(secret, 60);
    expect(await verifyToken(secret, t)).toBe(true);
  });
  it("rejects a token signed with another secret", async () => {
    const t = await signToken("other-secret", 60);
    expect(await verifyToken(secret, t)).toBe(false);
  });
  it("rejects an expired token", async () => {
    const t = await signToken(secret, 60, Date.now() - 120_000);
    expect(await verifyToken(secret, t)).toBe(false);
  });
  it("rejects a token with a tampered expiry", async () => {
    const t = await signToken(secret, 60);
    const [a, , sig] = t.split(".");
    expect(await verifyToken(secret, `${a}.9999999999.${sig}`)).toBe(false);
  });
  it("matches only the exact password", async () => {
    expect(await passwordMatches("hunter2", "hunter2")).toBe(true);
    expect(await passwordMatches("hunter3", "hunter2")).toBe(false);
  });
});

describe("undo history", () => {
  it("keeps at most 50 undo steps", () => {
    let s: HistoryState<number> = { past: [], present: 0, future: [] };
    for (let i = 1; i <= 80; i++) s = pushHistory(s, i, false);
    expect(HISTORY_LIMIT).toBe(50);
    expect(s.past).toHaveLength(50);
  });
  it("undo then redo restores the value", () => {
    let s: HistoryState<number> = { past: [], present: 0, future: [] };
    s = pushHistory(s, 1, false);
    s = pushHistory(s, 2, false);
    s = undoHistory(s);
    expect(s.present).toBe(1);
    s = redoHistory(s);
    expect(s.present).toBe(2);
  });
});
