import { act } from "@testing-library/react";

import { DataRefreshProvider } from "../../../src/react/components/DataRefreshContext";
import * as cache from "../../../src/react/helpers/cache";
import { apiMutate, useMutate } from "../../../src/react/helpers/mutate";
import {
  expectContractCall,
  fooUser,
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
      await apiMutate(`/api/users/${fooUser.id}`, "put", {
        email: requestValue("users", "edit", "success", "email"),
        name: requestValue("users", "edit", "success", "name"),
      });

      expectContractCall("users", "edit", "success");
    });

    it("should send a mutation request without a body", async () => {
      await apiMutate(`/api/users/${fooUser.id}`, "delete");

      expectContractCall("users", "delete", "success");
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

      await act(() =>
        mutate(`/api/users/${fooUser.id}`, "delete", null, ["/api/users"]),
      );

      expectContractCall("users", "delete", "success");
      expect(invalidateCacheMock).toHaveBeenCalledWith("/api/users");
    });

    it("should return a mutate function that does not invalidate the cache when the request fails", async () => {
      setupMocks({
        force500: [{ path: `/api/users/${fooUser.id}`, method: "delete" }],
      });

      const invalidateCacheMock = vi.spyOn(cache, "invalidateCache");
      const { result } = await renderHookAsync(() => useMutate(), {
        wrapper: DataRefreshProvider,
      });

      const mutate = result.current;

      await act(() =>
        mutate(`/api/users/${fooUser.id}`, "delete", null, ["/api/users"]),
      );

      expectContractCall("users", "delete", "success");
      expect(invalidateCacheMock).not.toHaveBeenCalled();
    });
  });
});
