import * as cache from "../../../src/react/helpers/cache";
import { mutate } from "../../../src/react/helpers/mutate";
import { expectContractCall, requestValue, setupMocks } from "../test-utils";

describe("React Helpers: mutate", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("mutate()", () => {
    it("should send a mutation request with a body", async () => {
      await mutate(`/api/health`, "post", {
        hello: requestValue("health", "post", "success", "hello"),
      });

      expectContractCall("health", "post", "success");
    });

    it("should send a mutation request with a FormData body", async () => {
      // Tested on mutate itself, not on an upload endpoint of the API
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(null, { status: 204 }),
      );

      const formData = new FormData();
      formData.append("file", "test");

      await mutate("/api/upload", "post", formData);

      const [url, init] = vi.mocked(globalThis.fetch).mock.calls.at(-1) ?? [];
      const headers = new Headers(init?.headers);

      expect(url).toBe("/api/upload");
      expect(init?.body).toBe(formData);
      // The browser sets the multipart Content-Type (with its boundary)
      expect(headers.has("Content-Type")).toBe(false);
      expect(headers.has("X-CSRF-Token")).toBe(true);
    });

    it("should send a mutation request without a body", async () => {
      await mutate("/api/health", "delete");

      expectContractCall("health", "delete", "success");
    });

    it("should reuse CSRF token", async () => {
      const storedValue = {
        value: "csrf-token-value",
      };
      const getMock = vi.fn().mockReturnValue(storedValue);
      vi.stubGlobal("cookieStore", { get: getMock, set: vi.fn() });

      // first call sets expiration time + 30 seconds
      await mutate("/api/health", "delete");
      // second call should reuse CSRF token
      await mutate("/api/health", "delete");

      expect(getMock).toHaveBeenCalledWith("__Host-x-csrf-token");
    });

    it("should refresh matching cache entries when paths are provided", async () => {
      const refreshMock = vi.spyOn(cache, "refresh");

      await mutate("/api/health", "delete", null, ["/api/health"]);

      expectContractCall("health", "delete", "success");
      expect(refreshMock).toHaveBeenCalledWith(["/api/health"]);
    });

    it("should not refresh cache entries when paths are omitted", async () => {
      const refreshMock = vi.spyOn(cache, "refresh");

      await mutate("/api/health", "delete");

      expectContractCall("health", "delete", "success");
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("should throw an error and not refresh cache entries when the request fails", async () => {
      const refreshMock = vi.spyOn(cache, "refresh");

      await expect(() =>
        mutate("/api/500", "post", null, ["/api/health"]),
      ).rejects.toThrow(/500/i);

      expect(refreshMock).not.toHaveBeenCalled();
    });
  });
});
