import { describe, it, expect } from "vitest";
import { signSessionToken, verifySessionToken, getAdminCredentials } from "./lib/auth";

describe("auth helpers", () => {
  it("generates and verifies valid session tokens", async () => {
    const token = await signSessionToken({ username: "testadmin", role: "admin" });
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.username).toBe("testadmin");
    expect(payload?.role).toBe("admin");
  });

  it("returns null for invalid or tampered tokens", async () => {
    const payload = await verifySessionToken("invalid.token.structure");
    expect(payload).toBeNull();
  });

  it("retrieves default admin credentials", () => {
    const creds = getAdminCredentials();
    expect(creds.username).toBeDefined();
    expect(creds.password).toBeDefined();
  });
});
