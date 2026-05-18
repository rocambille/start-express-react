import { act } from "@testing-library/react";

import {
  DataRefreshProvider,
  useRefresh,
} from "../../../src/react/components/DataRefreshContext";
import { renderHookAsync, setupMocks } from "../test-utils";

describe("React Components: DataRefreshContext", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
