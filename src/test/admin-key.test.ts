import { describe, expect, it } from "vitest";
import { adminKey, sessionSecret, signToken, verifyToken } from "@/lib/admin-token";

describe("admin password only setup", () => {
  it("derives the same write key from the same password", async () => {
    expect(await adminKey("pw-1")).toBe(await adminKey("pw-1"));
    expect(await adminKey("pw-1")).not.toBe(await adminKey("pw-2"));
  });

  it("derives a session secret from ADMIN_PASSWORD when no explicit secret is set", async () => {
    const secret = await sessionSecret(undefined, "pw-1");
    expect(secret).toBeTruthy();
    const token = await signToken(secret!, 60);
    expect(await verifyToken(secret!, token)).toBe(true);
    expect(await verifyToken((await sessionSecret(undefined, "other"))!, token)).toBe(false);
  });

  it("prefers an explicit session secret", async () => {
    expect(await sessionSecret("explicit", "pw-1")).toBe("explicit");
    expect(await sessionSecret(undefined, undefined)).toBeUndefined();
  });
});
