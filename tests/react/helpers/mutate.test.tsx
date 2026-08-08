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

    it("should send a mutation request with a FormData body", async () => {
      const formData = new FormData();
      formData.append("avatar", "test");

      await apiMutate(`/api/users/me/avatar`, "post", formData);

      expectContractCall("users", "upload_me_avatar", "as_me");
    });

    it("should send a mutation request without a body", async () => {
      await apiMutate("/api/health", "delete");

      expectContractCall("health", "delete", "success");
    });

    it("should reuse CSRF token", async () => {
      const storedValue = {
        value: "csrf-token-value",
      };
      const getMock = vi.fn().mockReturnValue(storedValue);
      vi.stubGlobal("cookieStore", { get: getMock, set: vi.fn() });

      // first call sets expiration time + 30 seconds
      await apiMutate("/api/health", "delete");
      // second call should reuse CSRF token
      await apiMutate("/api/health", "delete");

      expect(getMock).toHaveBeenCalledWith("__Host-x-csrf-token");
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

    it("should return a mutate function that sends a mutation request and forgets matching cache entries", async () => {
      const forgetMock = vi.spyOn(cache, "forget");
      const { result } = await renderHookAsync(() => useMutate(), {
        wrapper: DataRefreshProvider,
      });

      const mutate = result.current;

      await act(() => mutate("/api/health", "delete", null, ["/api/health"]));

      expectContractCall("health", "delete", "success");
      expect(forgetMock).toHaveBeenCalledWith("/api/health");
    });

    it("should return a mutate function that does not forget cache entries when the request fails", async () => {
      const forgetMock = vi.spyOn(cache, "forget");
      const { result } = await renderHookAsync(() => useMutate(), {
        wrapper: DataRefreshProvider,
      });

      const mutate = result.current;

      await expect(() => mutate("/api/500", "post")).rejects.toThrow(/500/i);

      expect(forgetMock).not.toHaveBeenCalled();
    });
  });
});
