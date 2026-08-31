// @vitest-environment jsdom

import {
  forget,
  getOrFetch,
  parseContentRangeTotal,
} from "../../../src/react/helpers/cache";
import { setupMocks } from "../test-utils";

describe("React Helpers: cache", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("getOrFetch()", () => {
    it("should return cached data", async () => {
      const firstFetchResult = await getOrFetch("/api/health");
      expect(firstFetchResult).toEqual({ hello: "world" });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/health`);
    });

    it("should not fetch again when data is cached", async () => {
      const firstFetchResult = await getOrFetch(`/api/health`);
      const refetchResult = await getOrFetch(`/api/health`);
      expect(refetchResult).toEqual(firstFetchResult);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw error when data is not available", async () => {
      await expect(() => getOrFetch("/api/404")).rejects.toThrow(/404/i);
    });

    it("should use a custom parse function when provided", async () => {
      const result = await getOrFetch("/api/health", {
        parse: async (res) => {
          const data: { hello: string } = await res.json();
          return data.hello;
        },
      });

      expect(result).toBe("world");
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/health");
    });

    it("should pass request headers to fetch when provided", async () => {
      await getOrFetch("/api/health", {
        headers: { Range: "items=0-9" },
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/health", {
        headers: { Range: "items=0-9" },
      });
    });

    it("should cache by url + headers so different ranges are separate entries", async () => {
      await getOrFetch("/api/health", { headers: { Range: "items=0-9" } });
      await getOrFetch("/api/health", { headers: { Range: "items=10-19" } });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should not re-fetch when same url + headers are requested again", async () => {
      await getOrFetch("/api/health", { headers: { Range: "items=0-9" } });
      await getOrFetch("/api/health", { headers: { Range: "items=0-9" } });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("forget()", () => {
    it("should forget cached entries", async () => {
      const firstFetchResult = await getOrFetch("/api/health");

      forget("/api/health");

      const refetchResult = await getOrFetch(`/api/health`);
      expect(refetchResult).toEqual(firstFetchResult);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(2, `/api/health`);
    });

    it("should forget all cached entries when '*' is provided", async () => {
      const healthFirstFetchResult = await getOrFetch("/api/health");
      const usersFirstFetchResult = await getOrFetch("/api/users/me");

      forget("*");

      const healthRefetchResult = await getOrFetch(`/api/health`);
      expect(healthRefetchResult).toEqual(healthFirstFetchResult);

      const usersRefetchResult = await getOrFetch(`/api/users/me`);
      expect(usersRefetchResult).toEqual(usersFirstFetchResult);

      expect(global.fetch).toHaveBeenCalledTimes(4);
      expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/health`);
      expect(global.fetch).toHaveBeenNthCalledWith(2, `/api/users/me`);
      expect(global.fetch).toHaveBeenNthCalledWith(3, `/api/health`);
      expect(global.fetch).toHaveBeenNthCalledWith(4, `/api/users/me`);
    });

    it("should not forget cached entries for paths that do not match", async () => {
      await getOrFetch("/api/health");
      await getOrFetch("/api/users/me");

      forget("/api/users/me");

      const refetchResult = await getOrFetch(`/api/health`);
      expect(refetchResult).toEqual({ hello: "world" });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should forget entries cached with headers when the base path matches", async () => {
      await getOrFetch("/api/items", { headers: { Range: "items=0-9" } });
      await getOrFetch("/api/items", { headers: { Range: "items=10-19" } });

      forget("/api/items");

      await getOrFetch("/api/items", { headers: { Range: "items=0-9" } });

      // Both paged entries cleared; only the re-fetch on the first page occurs
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("parseContentRangeTotal()", () => {
    it("should extract the total from a valid Content-Range header", () => {
      expect(parseContentRangeTotal("items 0-9/42")).toBe(42);
    });

    it("should handle single-page results", () => {
      expect(parseContentRangeTotal("items 0-1/2")).toBe(2);
    });

    it("should return 0 for a null header", () => {
      expect(parseContentRangeTotal(null)).toBe(0);
    });

    it("should return 0 for a malformed header", () => {
      expect(parseContentRangeTotal("bytes 0-9/42")).toBe(42); // different unit, total still parseable
      expect(parseContentRangeTotal("invalid")).toBe(0);
    });
  });
});
