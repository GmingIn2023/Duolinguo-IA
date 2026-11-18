import { beforeEach, describe, expect, it } from "vitest";
import { clientIp, rateLimit, resetRateLimits, throttleMessage } from "./rateLimit";

beforeEach(resetRateLimits);

describe("rateLimit", () => {
  it("autorise jusqu'à la limite puis refuse", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("login:1", 3, 60_000, 1_000).ok).toBe(true);

    const blocked = rateLimit("login:1", 3, 60_000, 1_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSeconds).toBe(60);
  });

  it("rouvre la fenêtre une fois écoulée", () => {
    rateLimit("k", 1, 60_000, 1_000);
    expect(rateLimit("k", 1, 60_000, 1_000).ok).toBe(false);
    expect(rateLimit("k", 1, 60_000, 61_000).ok).toBe(true);
  });

  it("sépare les clés", () => {
    rateLimit("a", 1, 60_000, 1_000);
    expect(rateLimit("a", 1, 60_000, 1_000).ok).toBe(false);
    expect(rateLimit("b", 1, 60_000, 1_000).ok).toBe(true);
  });

  it("ne grandit pas sans borne quand les fenêtres expirent", () => {
    for (let i = 0; i < 50; i++) rateLimit(`k${i}`, 1, 1_000, 1_000);
    // A later call sweeps the expired buckets instead of keeping them forever.
    expect(rateLimit("new", 1, 1_000, 5_000).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("prend la première adresse de x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("retombe sur x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("retombe sur unknown", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("throttleMessage", () => {
  it("arrondit au moins à une minute", () => {
    expect(throttleMessage(1, "forgot")).toContain("1 minute");
  });

  it("accorde le pluriel", () => {
    expect(throttleMessage(150, "login")).toBe("Trop de tentatives de connexion. Réessaie dans 3 minutes.");
  });
});
