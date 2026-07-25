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
      const data = await getOrFetch("/api/health");
      expect(data).toEqual({ hello: "world" });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/health`);
    });

    it("should not fetch again when data is cached", async () => {
      const data = await getOrFetch(`/api/health`);
      const data2 = await getOrFetch(`/api/health`);
      expect(data2).toEqual(data);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw error when data is not available", async () => {
      await expect(() => getOrFetch("/api/404")).rejects.toThrow(/404/i);
    });
  });

  describe("forget()", () => {
    it("should forget cached entries", async () => {
      const data = await getOrFetch("/api/health");

      forget("/api/health");

      const data2 = await getOrFetch(`/api/health`);
      expect(data2).toEqual(data);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(2, `/api/health`);
    });

    it("should forget all cached entries when '*' is provided", async () => {
      const data = await getOrFetch("/api/health");
      const data2 = await getOrFetch("/api/users/me");

      forget("*");

      const data3 = await getOrFetch(`/api/health`);
      expect(data3).toEqual(data);
      const data4 = await getOrFetch(`/api/users/me`);
      expect(data4).toEqual(data2);

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

      const data = await getOrFetch(`/api/health`);
      expect(data).toEqual({ hello: "world" });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
