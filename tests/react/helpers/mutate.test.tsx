import { act } from "@testing-library/react";

import { DataRefreshProvider } from "../../../src/react/components/DataRefreshContext";
import * as cache from "../../../src/react/helpers/cache";
import { apiMutate, useMutate } from "../../../src/react/helpers/mutate";
import {
  expectContractCall,
  renderHookAsync,
  requestValue,
  setupMocks,
} from "../test-utils";

describe("React Helpers: mutate", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("apiMutate()", () => {
    it("should send a mutation request with a body", async () => {
      await apiMutate(`/api/health`, "post", {
        hello: requestValue("health", "post", "success", "hello"),
      });

      expectContractCall("health", "post", "success");
    });

    it("should send a mutation request without a body", async () => {
      await apiMutate("/api/health", "delete");

      expectContractCall("health", "delete", "success");
    });
  });

  describe("useMutate()", () => {
    it("should throw an error when used outside of RefreshProvider", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(renderHookAsync(() => useMutate())).rejects.toThrow(
        "useRefresh must be used within a DataRefreshProvider",
      );
    });

    it("should return a mutate function", async () => {
      const { result } = await renderHookAsync(() => useMutate(), {
        wrapper: DataRefreshProvider,
      });

      const mutate = result.current;

      expectTypeOf(mutate).toBeFunction();
    });

    it("should return a mutate function that sends a mutation request and invalidates the cache", async () => {
      const invalidateCacheMock = vi.spyOn(cache, "invalidateCache");
      const { result } = await renderHookAsync(() => useMutate(), {
        wrapper: DataRefreshProvider,
      });

      const mutate = result.current;

      await act(() => mutate("/api/health", "delete", null, ["/api/health"]));

      expectContractCall("health", "delete", "success");
      expect(invalidateCacheMock).toHaveBeenCalledWith("/api/health");
    });

    it("should return a mutate function that does not invalidate the cache when the request fails", async () => {
      const invalidateCacheMock = vi.spyOn(cache, "invalidateCache");
      const { result } = await renderHookAsync(() => useMutate(), {
        wrapper: DataRefreshProvider,
      });

      const mutate = result.current;

      await expect(() => mutate("/api/500", "post")).rejects.toThrow(/500/i);

      expect(invalidateCacheMock).not.toHaveBeenCalled();
    });
  });
});
