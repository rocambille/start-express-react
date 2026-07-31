// @vitest-environment jsdom

import { forget, getOrFetch } from "../../../src/react/helpers/cache";
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
  });
});
