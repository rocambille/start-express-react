import { act } from "@testing-library/react";
import {
  DataRefreshProvider,
  useRefresh,
} from "../../../src/react/components/DataRefreshContext";
import { apiMutate, useMutate } from "../../../src/react/helpers/mutate";
import {
  allItems,
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
      const { id, user_id, ...itemFields } = allItems[0];

      await apiMutate(`/api/items/${allItems[0].id}`, "put", {
        ...itemFields,
        title: requestValue("items", "edit", "success", "title"),
      });

      expectContractCall("items", "edit", "success");
    });

    it("should send a mutation request without a body", async () => {
      await apiMutate(`/api/items/${allItems[0].id}`, "delete");

      expectContractCall("items", "delete", "success");
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

      await act(() =>
        mutate(`/api/items/${allItems[0].id}`, "delete", null, ["/api/items"]),
      );

      expectContractCall("items", "delete", "success");
    });
  });

  describe("useRefresh()", () => {
    it("should throw an error when used outside of RefreshProvider", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(renderHookAsync(() => useRefresh())).rejects.toThrow(
        "useRefresh must be used within a DataRefreshProvider",
      );
    });

    it("should return a refresh function", async () => {
      const { result } = await renderHookAsync(() => useRefresh(), {
        wrapper: DataRefreshProvider,
      });

      const { refresh, tick: initialTick } = result.current;

      act(() => refresh());

      await renderHookAsync(() => useRefresh(), {
        wrapper: DataRefreshProvider,
      });

      const { tick } = result.current;

      expect(tick).toBe(initialTick + 1);
    });
  });
});
