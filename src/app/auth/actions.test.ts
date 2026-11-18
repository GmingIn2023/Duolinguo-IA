import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/rateLimit";

vi.mock("server-only", () => ({}));

const { signInWithPassword, redirectMock } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));

// `redirect` throws in Next; the test does the same so a success is observable.
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signInWithPassword } }),
}));

import { login } from "./actions";

const originalNodeEnv = process.env.NODE_ENV;
// Next types NODE_ENV as read-only; the test needs the production limits, not the dev relaxation.
const mutableEnv = process.env as Record<string, string | undefined>;

const credentials = () => {
  const form = new FormData();
  form.set("email", "camille@example.fr");
  form.set("password", "motdepasse");
  return form;
};

/** redirect() throws: turn it into a value instead of a failed assertion. */
const attempt = async () => {
  try {
    return await login({ error: null }, credentials());
  } catch (error) {
    return { redirected: (error as Error).message };
  }
};

beforeEach(() => {
  resetRateLimits();
  signInWithPassword.mockReset();
  redirectMock.mockReset();
  redirectMock.mockImplementation((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  });
  // The limiter relaxes limits outside production; this test exercises the real ones.
  mutableEnv.NODE_ENV = "production";
});

afterAll(() => {
  mutableEnv.NODE_ENV = originalNodeEnv;
});

describe("login — throttle", () => {
  it("bloque après dix échecs, sans rappeler Supabase", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });

    for (let i = 0; i < 10; i++) {
      const result = await attempt();
      expect(result).toMatchObject({ error: expect.stringContaining("Email ou mot de passe incorrect") });
    }

    const blocked = await attempt();

    expect(blocked).toMatchObject({ error: expect.stringContaining("Trop de tentatives de connexion") });
    expect(signInWithPassword).toHaveBeenCalledTimes(10);
  });

  it("ne compte pas les connexions réussies", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    for (let i = 0; i < 9; i++) await attempt();

    signInWithPassword.mockResolvedValue({ error: null });
    for (let i = 0; i < 5; i++) {
      expect(await attempt()).toMatchObject({ redirected: "REDIRECT:/learn" });
    }

    // Nine failures plus one more is still within the window: the five successes cost nothing.
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    expect(await attempt()).toMatchObject({ error: expect.stringContaining("Email ou mot de passe incorrect") });

    const before = signInWithPassword.mock.calls.length;
    expect(await attempt()).toMatchObject({ error: expect.stringContaining("Trop de tentatives de connexion") });
    expect(signInWithPassword.mock.calls.length).toBe(before);
  });

  it("ne bloque jamais une adresse qui ne rate rien", async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    for (let i = 0; i < 25; i++) {
      expect(await attempt()).toMatchObject({ redirected: "REDIRECT:/learn" });
    }
  });

  it("ne compte pas une panne réseau", async () => {
    signInWithPassword.mockRejectedValue(new Error("fetch failed"));
    for (let i = 0; i < 15; i++) {
      expect(await attempt()).toMatchObject({ error: expect.stringContaining("Connexion impossible") });
    }

    signInWithPassword.mockResolvedValue({ error: null });
    expect(await attempt()).toMatchObject({ redirected: "REDIRECT:/learn" });
  });
});
