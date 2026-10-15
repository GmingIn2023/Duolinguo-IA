/**
 * fetch for the server-side Supabase clients: a read (GET/HEAD) that hits a transient gateway error
 * (502, 503, 504) or a network failure is retried twice with a short pause, so a passing hiccup does not
 * turn into an error page. Writes are never retried here: replaying one could apply it twice.
 */
const TRANSIENT = new Set([502, 503, 504]);
const PAUSES_MS = [150, 400];

export const retryFetch: typeof fetch = async (input, init) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (method !== "GET" && method !== "HEAD") return fetch(input, init);
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(input, init);
      if (!TRANSIENT.has(res.status) || attempt >= PAUSES_MS.length) return res;
    } catch (e) {
      if (attempt >= PAUSES_MS.length || init?.signal?.aborted) throw e;
    }
    await new Promise((r) => setTimeout(r, PAUSES_MS[attempt]));
  }
};
