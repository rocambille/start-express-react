// @vitest-environment jsdom

import { act } from "@testing-library/react";

import {
  DEFAULT_TTL,
  getOrFetch,
  refresh,
  subscribe,
  useRefresh,
} from "../../../src/react/helpers/cache";
import { renderHookAsync, setupMocks } from "../test-utils";

describe("React Helpers: cache", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("getOrFetch()", () => {
    it("should export a default TTL of 5 minutes", () => {
      expect(DEFAULT_TTL).toBe(300_000);
    });

    it("should fetch data when not cached", async () => {
      const result = await getOrFetch("/api/health");

      expect(result).toEqual({ hello: "world" });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("/api/health");
    });

    it("should return cached Promise on second call with same URL", async () => {
      const firstCall = getOrFetch("/api/health");
      const secondCall = getOrFetch("/api/health");

      expect(firstCall).toBe(secondCall);

      const [firstResult, secondResult] = await Promise.all([
        firstCall,
        secondCall,
      ]);
      expect(firstResult).toEqual(secondResult);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should use custom parse function when provided", async () => {
      const customParse = vi.fn().mockResolvedValue({ parsed: true });

      const result = await getOrFetch("/api/health", { parse: customParse });

      expect(customParse).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ parsed: true });
    });

    it("should treat different headers as different cache keys", async () => {
      const firstCall = getOrFetch("/api/items", {
        headers: { Range: "items=0-9" },
      });
      const secondCall = getOrFetch("/api/items", {
        headers: { Range: "items=10-19" },
      });

      expect(firstCall).not.toBe(secondCall);

      await Promise.all([firstCall, secondCall]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should return same cached Promise for identical headers", async () => {
      const firstCall = getOrFetch("/api/items", {
        headers: { Range: "items=0-9" },
      });
      const secondCall = getOrFetch("/api/items", {
        headers: { Range: "items=0-9" },
      });

      expect(firstCall).toBe(secondCall);

      await Promise.all([firstCall, secondCall]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw error when response is not ok", async () => {
      await expect(() => getOrFetch("/api/404")).rejects.toThrow(/404/i);
    });

    it("should automatically evict rejected promises so subsequent calls retry fetch", async () => {
      await expect(() => getOrFetch("/api/404")).rejects.toThrow(/404/i);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Allow the eviction tick to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Calling it again should trigger a fresh fetch attempt, not reuse the rejected promise
      await expect(() => getOrFetch("/api/404")).rejects.toThrow(/404/i);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should evict entry after custom TTL expires", async () => {
      vi.useFakeTimers();

      const firstCall = await getOrFetch("/api/health", { ttl: 1000 });
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance time within TTL
      vi.advanceTimersByTime(500);
      const cachedCall = await getOrFetch("/api/health", { ttl: 1000 });
      expect(cachedCall).toEqual(firstCall);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance time past TTL
      vi.advanceTimersByTime(600);
      const expiredCall = await getOrFetch("/api/health", { ttl: 1000 });
      expect(expiredCall).toEqual(firstCall);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should not expire entries when ttl is Infinity", async () => {
      vi.useFakeTimers();

      await getOrFetch("/api/health", { ttl: Infinity });
      expect(global.fetch).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(10 * 365 * 24 * 60 * 60 * 1000); // 10 years
      await getOrFetch("/api/health", { ttl: Infinity });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should deduplicate in-flight requests but evict on resolution when ttl is 0", async () => {
      const call1 = getOrFetch("/api/health", { ttl: 0 });
      const call2 = getOrFetch("/api/health", { ttl: 0 });

      expect(call1).toBe(call2);
      await Promise.all([call1, call2]);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Once resolved, subsequent call fetches anew
      await getOrFetch("/api/health", { ttl: 0 });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("refresh() cache eviction", () => {
    it("should evict cached entries", async () => {
      const firstFetchResult = await getOrFetch("/api/health");

      refresh("/api/health");

      const refetchResult = await getOrFetch(`/api/health`);
      expect(refetchResult).toEqual(firstFetchResult);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(2, `/api/health`);
    });

    it("should evict all cached entries when '*' is provided", async () => {
      const healthFirstFetchResult = await getOrFetch("/api/health");
      const usersFirstFetchResult = await getOrFetch("/api/users/me");

      refresh("*");

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

    it("should evict all cached entries by default when called with no arguments", async () => {
      await getOrFetch("/api/health");
      await getOrFetch("/api/users/me");

      refresh();

      await getOrFetch(`/api/health`);
      await getOrFetch(`/api/users/me`);

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it("should evict multiple cached paths when an array of paths is provided", async () => {
      await getOrFetch("/api/health");
      await getOrFetch("/api/users/me");
      await getOrFetch("/api/items");

      refresh(["/api/health", "/api/users/me"]);

      await getOrFetch("/api/health");
      await getOrFetch("/api/users/me");
      await getOrFetch("/api/items");

      // health and users/me were re-fetched; items was cached (total 3 + 2 = 5)
      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it("should not evict cached entries for paths that do not match", async () => {
      await getOrFetch("/api/health");
      await getOrFetch("/api/users/me");

      refresh("/api/users/me");

      const refetchResult = await getOrFetch(`/api/health`);
      expect(refetchResult).toEqual({ hello: "world" });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should evict entries cached with headers when the base path matches", async () => {
      await getOrFetch("/api/items", { headers: { Range: "items=0-9" } });
      await getOrFetch("/api/items", { headers: { Range: "items=10-19" } });

      refresh("/api/items");

      await getOrFetch("/api/items", { headers: { Range: "items=0-9" } });

      // Both paged entries cleared; only the re-fetch on the first page occurs
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("refresh() and subscribe()", () => {
    it("should evict cache entries when refresh is called", async () => {
      const firstResult = await getOrFetch("/api/health");

      refresh("/api/health");

      const secondResult = await getOrFetch("/api/health");
      expect(secondResult).toEqual(firstResult);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should evict all cache entries and notify wildcard subscribers when refresh is called with no arguments", async () => {
      await getOrFetch("/api/health");
      const callback = vi.fn();
      const unsubscribe = subscribe("*", callback);

      refresh();

      expect(callback).toHaveBeenCalledTimes(1);
      await getOrFetch("/api/health");
      expect(global.fetch).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it("should notify matching subscribers", () => {
      const callback = vi.fn();
      const unsubscribe = subscribe("/api/items", callback);

      refresh("/api/items");
      expect(callback).toHaveBeenCalledTimes(1);

      refresh("/api/users");
      expect(callback).toHaveBeenCalledTimes(1); // not called for users

      unsubscribe();
      refresh("/api/items");
      expect(callback).toHaveBeenCalledTimes(1); // not called after unsubscribe
    });

    it("should notify subscribers registered with an array of paths", () => {
      const callback = vi.fn();
      const unsubscribe = subscribe(["/api/items", "/api/users"], callback);

      refresh("/api/items");
      expect(callback).toHaveBeenCalledTimes(1);

      refresh("/api/users");
      expect(callback).toHaveBeenCalledTimes(2);

      refresh("/api/other");
      expect(callback).toHaveBeenCalledTimes(2); // not called for unrelated

      unsubscribe();
    });

    it("should notify subscribers when refresh is called with an array of paths", () => {
      const itemsCb = vi.fn();
      const usersCb = vi.fn();
      const otherCb = vi.fn();
      const unsub1 = subscribe("/api/items", itemsCb);
      const unsub2 = subscribe("/api/users", usersCb);
      const unsub3 = subscribe("/api/other", otherCb);

      refresh(["/api/items", "/api/users"]);

      expect(itemsCb).toHaveBeenCalledTimes(1);
      expect(usersCb).toHaveBeenCalledTimes(1);
      expect(otherCb).toHaveBeenCalledTimes(0);

      unsub1();
      unsub2();
      unsub3();
    });

    it("should notify subscribers with wildcard '*'", () => {
      const callback = vi.fn();
      const unsubscribe = subscribe("*", callback);

      refresh("/api/any-path");
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
    });

    it("should notify prefix subscribers", () => {
      const callback = vi.fn();
      const unsubscribe = subscribe("/api/items", callback);

      refresh("/api/items/42");
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
    });
  });

  describe("useRefresh()", () => {
    it("should work with zero context provider wrapper and re-render on refresh", async () => {
      let renderCount = 0;
      await renderHookAsync(() => {
        renderCount++;
        useRefresh();
      });

      expect(renderCount).toBe(1);

      act(() => refresh());
      expect(renderCount).toBe(2);
    });

    it("should only re-render components subscribed to the modified path", async () => {
      let itemsRenders = 0;
      let usersRenders = 0;

      await renderHookAsync(() => {
        itemsRenders++;
        useRefresh("/api/items");
      });

      await renderHookAsync(() => {
        usersRenders++;
        useRefresh("/api/users");
      });

      expect(itemsRenders).toBe(1);
      expect(usersRenders).toBe(1);

      act(() => refresh("/api/items"));

      expect(itemsRenders).toBe(2);
      expect(usersRenders).toBe(1);
    });

    it("should support an array of paths in useRefresh", async () => {
      let renders = 0;
      await renderHookAsync(() => {
        renders++;
        useRefresh(["/api/items", "/api/users"]);
      });

      expect(renders).toBe(1);

      act(() => refresh("/api/items"));
      expect(renders).toBe(2);

      act(() => refresh("/api/users"));
      expect(renders).toBe(3);

      act(() => refresh("/api/other"));
      expect(renders).toBe(3);
    });

    it("should support prefix matching in useRefresh", async () => {
      let renders = 0;
      await renderHookAsync(() => {
        renders++;
        useRefresh("/api/items");
      });

      expect(renders).toBe(1);

      act(() => refresh("/api/items/99"));

      expect(renders).toBe(2);
    });
  });
});
