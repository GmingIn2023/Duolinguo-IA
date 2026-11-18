import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { verifyOtp, exchangeCodeForSession } = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { verifyOtp, exchangeCodeForSession } }),
}));

import { NextRequest } from "next/server";
import { GET } from "./route";

const siteUrl = process.env.SITE_URL;

/** The proxy hands the route an internal host; only SITE_URL should reach the Location header. */
const call = (query: string) => GET(new NextRequest(`https://internal.local/auth/confirm${query}`));

beforeEach(() => {
  verifyOtp.mockReset().mockResolvedValue({ error: null });
  exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
  process.env.SITE_URL = "https://gusgus.test";
});

afterAll(() => {
  if (siteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = siteUrl;
});

describe("/auth/confirm — recovery", () => {
  it("sans destination, renvoie vers le formulaire de mot de passe", async () => {
    const res = await call("?token_hash=abc&type=recovery");

    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "abc", type: "recovery" });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://gusgus.test/login/reset");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it.each([
    "//evil.com",
    "https://evil.com/login/reset",
    "/\\evil.com",
    "https://gusgus.test.evil.com",
  ])("refuse la destination externe %s", async (next) => {
    const res = await call(`?token_hash=abc&type=recovery&next=${encodeURIComponent(next)}`);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://gusgus.test/login/reset");
  });

  it("garde une destination interne explicite", async () => {
    const res = await call("?token_hash=abc&type=recovery&next=%2Freview");

    expect(res.headers.get("location")).toBe("https://gusgus.test/review");
  });

  it("renvoie sur le formulaire quand le lien est mort", async () => {
    verifyOtp.mockResolvedValue({ error: new Error("otp_expired") });

    const res = await call("?token_hash=used&type=recovery&next=%2Flearn");

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://gusgus.test/login/reset");
  });
});

describe("/auth/confirm — autres liens", () => {
  it("garde /learn comme destination par défaut hors recovery", async () => {
    const res = await call("?token_hash=abc&type=email");

    expect(res.headers.get("location")).toBe("https://gusgus.test/learn");
  });

  it("échange encore les anciens codes PKCE", async () => {
    const res = await call("?code=old-code&next=%2Flearn");

    expect(verifyOtp).not.toHaveBeenCalled();
    expect(exchangeCodeForSession).toHaveBeenCalledWith("old-code");
    expect(res.headers.get("location")).toBe("https://gusgus.test/learn");
  });
});
