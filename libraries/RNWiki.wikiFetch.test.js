import { wikiFetch } from "./RNWiki.js";

// Helper: a fetch mock response with configurable ok/status/headers/body.
const makeResponse = ({ ok = true, status = 200, retryAfter = null, body = {} }) => ({
  ok,
  status,
  headers: { get: (name) => (name === "retry-after" ? retryAfter : null) },
  json: async () => body,
});

beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  delete global.fetch;
});

describe("wikiFetch: URL building with valid/invalid inputs", () => {
  it("builds the default search URL when no params are given", async () => {
    global.fetch.mockResolvedValue(makeResponse({ body: { query: {} } }));

    await wikiFetch("Pragmatism");

    const [calledUrl] = global.fetch.mock.calls[0];
    expect(calledUrl).toContain(`gsrsearch=${encodeURIComponent("Pragmatism")}`);
    expect(calledUrl).toContain("maxlag=5");
  });

  it("handles a null/undefined searchTerm without throwing", async () => {
    global.fetch.mockResolvedValue(makeResponse({ body: { query: {} } }));

    await expect(wikiFetch(null)).resolves.toBeDefined();
    await expect(wikiFetch(undefined)).resolves.toBeDefined();
  });

  it("FIXED: a non-object params value falls back to using the search term", async () => {
    global.fetch.mockResolvedValue(makeResponse({ body: { query: {} } }));

    // Previously: an array/string params silently collapsed to `{}`,
    // dropping searchTerm entirely and sending an almost-empty query.
    // Now: anything that isn't a real object falls back to the same
    // search-term branch used when params is omitted.
    await wikiFetch("Pragmatism", ["not", "an", "object"]);
    let [calledUrl] = global.fetch.mock.calls[0];
    expect(calledUrl).toContain(`gsrsearch=${encodeURIComponent("Pragmatism")}`);

    global.fetch.mockClear();
    await wikiFetch("Pragmatism", "also not an object");
    [calledUrl] = global.fetch.mock.calls[0];
    expect(calledUrl).toContain(`gsrsearch=${encodeURIComponent("Pragmatism")}`);

    global.fetch.mockClear();
    await wikiFetch("Pragmatism", null); // explicit null, not just omitted
    [calledUrl] = global.fetch.mock.calls[0];
    expect(calledUrl).toContain(`gsrsearch=${encodeURIComponent("Pragmatism")}`);
  });

  it("FIXED: guards the realistic mistake of passing a results array as params", async () => {
    global.fetch.mockResolvedValue(makeResponse({ body: { query: {} } }));

    // The realistic way this bug actually gets reintroduced: a future
    // refactor grabs the wrong variable -- e.g. an array of category-member
    // objects from a previous response -- and passes it where a params
    // object belongs. This must never silently swallow the search term.
    const categoryMembers = [
      { pageid: 1, title: "Pragmatism" },
      { pageid: 2, title: "Instrumentalism" },
    ];

    await wikiFetch("Dewey", categoryMembers);

    const [calledUrl] = global.fetch.mock.calls[0];
    expect(calledUrl).toContain(`gsrsearch=${encodeURIComponent("Dewey")}`);
  });

  it("adds default maxlag=5 to valid params that don't specify one", async () => {
    global.fetch.mockResolvedValue(makeResponse({ body: { query: {} } }));

    await wikiFetch("x", { action: "query", titles: "Dewey" });

    const [calledUrl] = global.fetch.mock.calls[0];
    expect(calledUrl).toContain("titles=Dewey");
    expect(calledUrl).toContain("maxlag=5");
  });
});

describe("wikiFetch: retry / backoff behavior", () => {
  it("retries once on a retryable (retry-after) error, then succeeds", async () => {
    global.fetch
      .mockResolvedValueOnce(
        makeResponse({ ok: false, status: 503, retryAfter: "0" }),
      )
      .mockResolvedValueOnce(makeResponse({ body: { query: { pages: {} } } }));

    const promise = wikiFetch("Pragmatism");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ query: { pages: {} } });
  });

  it("does NOT retry a non-retryable error (no retry-after header)", async () => {
    global.fetch.mockResolvedValue(
      makeResponse({ ok: false, status: 404, retryAfter: null }),
    );

    const promise = wikiFetch("Pragmatism");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("error");
  });

  it("gives up after maxRetries (3) and returns a status:error object", async () => {
    // Always retryable, so it should exhaust every attempt: 0,1,2,3 -> 4 calls.
    global.fetch.mockResolvedValue(
      makeResponse({ ok: false, status: 503, retryAfter: "0" }),
    );

    const promise = wikiFetch("Pragmatism");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(result).toEqual({
      status: "error",
      error: "HTTP error 503",
    });
  });

  it("FIXED: a 503 with a non-JSON body (e.g. an HTML error page) still retries via retry-after", async () => {
    // Simulates a real outage/CDN-error-page scenario: the server returns a
    // non-2xx status AND a body that isn't valid JSON. Before the reorder,
    // response.json() was attempted first, threw, and this got misclassified
    // as a permanent client error -- even though the 503 + retry-after is a
    // clear, correct retry signal the code already knows how to use.
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: { get: (name) => (name === "retry-after" ? "0" : null) },
        json: async () => {
          throw new Error("Unexpected token '<'"); // stand-in for an HTML error page
        },
      })
      .mockResolvedValueOnce(makeResponse({ body: { query: { pages: {} } } }));

    const promise = wikiFetch("Pragmatism");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(2); // it DID retry, and recovered
    expect(result).toEqual({ query: { pages: {} } });
  });

  it("FIXED: an invalid JSON body fails fast, without retrying", async () => {
    // Previously: the JSON-parse-failure path threw a plain Error without
    // ever setting `.retryAfter`, so `retryable = error.retryAfter !== null`
    // was accidentally true for `undefined` too -- burning through all
    // maxRetries attempts on an error that parses identically every time.
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => {
        throw new Error("Unexpected token");
      },
    });

    const promise = wikiFetch("Pragmatism");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("error");
  });

  it("FIXED (structural): ANY error missing .retryAfter fails safe, not just the JSON-parse one", async () => {
    // This guards the general fix (`typeof error.retryAfter === "number"`),
    // not just the one call site above. If a future throw site in this file
    // forgets to set `.retryAfter` -- the exact mistake that caused this bug
    // originally -- it should still fail fast by default, not retry blindly.
    global.fetch.mockImplementation(() => {
      throw new Error("some totally unrelated failure, no .retryAfter set");
    });

    const promise = wikiFetch("Pragmatism");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("error");
  });
});

describe("wikiFetch: semaphore serializes concurrent calls", () => {
  it("blocks a second call's fetch until the first call finishes", async () => {
    let resolveFirst;
    const firstFetchPromise = new Promise((resolve) => {
      resolveFirst = () => resolve(makeResponse({ body: { query: {}, first: true } }));
    });

    global.fetch
      .mockImplementationOnce(() => firstFetchPromise)
      .mockResolvedValueOnce(makeResponse({ body: { query: {}, second: true } }));

    const callA = wikiFetch("A");
    const callB = wikiFetch("B");

    // Let call A's synchronous setup run and call B enter its semaphore
    // wait-loop, without letting A's fetch resolve yet.
    await jest.advanceTimersByTimeAsync(300);
    expect(global.fetch).toHaveBeenCalledTimes(1); // only A has actually fetched

    resolveFirst();
    await jest.advanceTimersByTimeAsync(300); // let B's next semaphore check run

    const [resultA, resultB] = await Promise.all([callA, callB]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(resultA).toEqual({ query: {}, first: true });
    expect(resultB).toEqual({ query: {}, second: true });
  });
});
