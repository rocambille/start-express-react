import { act, screen } from "@testing-library/react";

import {
  MeProvider,
  useMe,
} from "../../../../src/react/components/auth/MeContext";
import {
  expectContractCall,
  renderHookAsync,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../../test-utils";

describe("React Components: MeContext", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("<MeProvider />", () => {
    it("should render its children", async () => {
      await renderWithStub({
        path: "/",
        Component: () => (
          <MeProvider initialUser={null}>hello, world!</MeProvider>
        ),
        initialEntries: ["/"],
        me: null,
      });

      await screen.findByText("hello, world!");
    });
  });

  describe("useMe()", () => {
    it("should be used within <MeProvider>", async () => {
      // Avoid exception noise in console
      vi.spyOn(console, "error").mockImplementationOnce(() => {});

      await expect(renderHookAsync(() => useMe())).rejects.toThrow(
        /\buseMe\b.*\bwithin\b.*\bMeProvider\b/i,
      );
    });
    it("should return a me object", async () => {
      const { result } = await renderHookAsync(() => useMe(), {
        wrapper: MeProvider,
      });

      const auth = result.current;

      expect(auth).toBeDefined();
    });
    it("should return an isAuthenticated boolean", async () => {
      const { result } = await renderHookAsync(() => useMe(), {
        wrapper: MeProvider,
      });

      const auth = result.current;

      expect(auth.isAuthenticated).toBe(auth.user != null);
    });
    it("should return a sendMagicLink function", async () => {
      const { result } = await renderHookAsync(() => useMe(), {
        wrapper: MeProvider,
      });

      const auth = result.current;

      await act(
        async () =>
          await auth.sendMagicLink(
            String(requestValue("auth", "magic_link", "success", "email")),
          ),
      );

      expectContractCall("auth", "magic_link", "success");
    });
    it("should return a verifyMagicLink function", async () => {
      const { result } = await renderHookAsync(() => useMe(), {
        wrapper: MeProvider,
      });

      const auth = result.current;

      await act(
        async () =>
          await auth.verifyMagicLink(
            String(requestValue("auth", "verify", "success", "token")),
          ),
      );

      expectContractCall("auth", "verify", "success");
    });
    it("should return a logout function", async () => {
      const { result } = await renderHookAsync(() => useMe(), {
        wrapper: MeProvider,
      });

      const auth = result.current;

      await act(async () => await auth.logout());

      expectContractCall("auth", "logout", "anyone");
    });
  });
});
