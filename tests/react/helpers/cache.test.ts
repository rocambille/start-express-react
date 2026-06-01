// @vitest-environment jsdom

import { cache, invalidateCache } from "../../../src/react/helpers/cache";
import { allItems, fooUser, setupMocks } from "../test-utils";

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
      const data = await cache(`/api/items/${allItems[0].id}`);
      expect(data).toEqual(allItems[0]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should not fetch again when data is cached", async () => {
      invalidateCache(`/api/items/${allItems[0].id}`);

      const data = await cache(`/api/items/${allItems[0].id}`);
      expect(data).toEqual(allItems[0]);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const data2 = await cache(`/api/items/${allItems[0].id}`);
      expect(data2).toEqual(allItems[0]);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        `/api/items/${allItems[0].id}`,
      );
    });

    it("should return null when data is not available", async () => {
      const data = await cache("/api/404");
      expect(data).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("invalidateCache()", () => {
    it("should invalidate cache", async () => {
      invalidateCache(`/api/items/${allItems[0].id}`);

      const data = await cache(`/api/items/${allItems[0].id}`);
      expect(data).toEqual(allItems[0]);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      invalidateCache(`/api/items/${allItems[0].id}`);

      const data2 = await cache(`/api/items/${allItems[0].id}`);
      expect(data2).toEqual(allItems[0]);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `/api/items/${allItems[0].id}`,
      );
    });

    it("should invalidate all cache when '*' is provided", async () => {
      const data = await cache(`/api/items/${allItems[0].id}`);
      expect(data).toEqual(allItems[0]);
      const data2 = await cache(`/api/users/${fooUser.id}`);
      expect(data2).toEqual(fooUser);

      expect(global.fetch).toHaveBeenCalledTimes(2);

      invalidateCache("*");

      const data3 = await cache(`/api/users/${fooUser.id}`);
      expect(data3).toEqual(fooUser);

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        `/api/users/${fooUser.id}`,
      );
    });

    it("should not invalidate cache for paths that do not match", async () => {
      const data = await cache(`/api/items/${allItems[0].id}`);
      expect(data).toEqual(allItems[0]);
      const data2 = await cache(`/api/users/${fooUser.id}`);
      expect(data2).toEqual(fooUser);

      expect(global.fetch).toHaveBeenCalledTimes(2);

      invalidateCache("/api/items");

      const data3 = await cache(`/api/users/${fooUser.id}`);
      expect(data3).toEqual(fooUser);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
