import { afterEach, describe, expect, it, vi } from "vitest";
import { retryFetch } from "./retryFetch";

const reply = (status: number) => new Response("", { status });

describe("retryFetch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retries a read after a gateway timeout", async () => {
    const f = vi.fn().mockResolvedValueOnce(reply(504)).mockResolvedValueOnce(reply(200));
    vi.stubGlobal("fetch", f);
    expect((await retryFetch("https://x/rest/v1/profiles")).status).toBe(200);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("gives up after two retries and returns the last answer", async () => {
    const f = vi.fn().mockResolvedValue(reply(503));
    vi.stubGlobal("fetch", f);
    expect((await retryFetch("https://x")).status).toBe(503);
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("never replays a write", async () => {
    const f = vi.fn().mockResolvedValue(reply(504));
    vi.stubGlobal("fetch", f);
    expect((await retryFetch("https://x/rest/v1/rpc/award_xp", { method: "POST" })).status).toBe(504);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("does not retry a real error status", async () => {
    const f = vi.fn().mockResolvedValue(reply(401));
    vi.stubGlobal("fetch", f);
    await retryFetch("https://x");
    expect(f).toHaveBeenCalledTimes(1);
  });
});
