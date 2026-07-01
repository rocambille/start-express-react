// @vitest-environment jsdom

import { cache, invalidateCache } from "../../../src/react/helpers/cache";
import { setupMocks } from "../test-utils";

describe("React Helpers: cache", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("cache()", () => {
    it("should return cached data", async () => {
      const data = await cache("/api/health");
      expect(data).toEqual({ hello: "world" });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/health`);
    });

    it("should not fetch again when data is cached", async () => {
      const data = await cache(`/api/health`);
      const data2 = await cache(`/api/health`);
      expect(data2).toEqual(data);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw error when data is not available", async () => {
      await expect(() => cache("/api/404")).rejects.toThrow(/404/i);
    });
  });

  describe("invalidateCache()", () => {
    it("should invalidate cache", async () => {
      const data = await cache("/api/health");

      invalidateCache("/api/health");

      const data2 = await cache(`/api/health`);
      expect(data2).toEqual(data);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(2, `/api/health`);
    });

    it("should invalidate all cache when '*' is provided", async () => {
      const data = await cache("/api/health");
      const data2 = await cache("/api/users/me");

      invalidateCache("*");

      const data3 = await cache(`/api/health`);
      expect(data3).toEqual(data);
      const data4 = await cache(`/api/users/me`);
      expect(data4).toEqual(data2);

      expect(global.fetch).toHaveBeenCalledTimes(4);
      expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/health`);
      expect(global.fetch).toHaveBeenNthCalledWith(2, `/api/users/me`);
      expect(global.fetch).toHaveBeenNthCalledWith(3, `/api/health`);
      expect(global.fetch).toHaveBeenNthCalledWith(4, `/api/users/me`);
    });

    it("should not invalidate cache for paths that do not match", async () => {
      await cache("/api/health");
      await cache("/api/users/me");

      invalidateCache("/api/users/me");

      const data = await cache(`/api/health`);
      expect(data).toEqual({ hello: "world" });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
