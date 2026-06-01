import { act, screen } from "@testing-library/react";

import {
  AuthProvider,
  useAuth,
} from "../../../../src/react/components/auth/AuthContext";
import {
  expectContractCall,
  renderHookAsync,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../../test-utils";

describe("React Components: AuthContext", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("<AuthProvider />", () => {
    it("should render its children", async () => {
      await renderWithStub({
        path: "/",
        Component: () => (
          <AuthProvider initialUser={null}>hello, world!</AuthProvider>
        ),
        initialEntries: ["/"],
        me: null,
      });

      await screen.findByText("hello, world!");
    });
  });

  describe("useAuth()", () => {
    it("should be used within <AuthProvider>", async () => {
      // Avoid exception noise in console
      vi.spyOn(console, "error").mockImplementationOnce(() => {});

      await expect(renderHookAsync(() => useAuth())).rejects.toThrow(
        /\buseAuth\b.*\bwithin\b.*\bAuthProvider\b/i,
      );
    });
    it("should return an auth object", async () => {
      const { result } = await renderHookAsync(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const auth = result.current;

      expect(auth).toBeDefined();
    });
    it("should return a check function", async () => {
      const { result } = await renderHookAsync(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const auth = result.current;

      expect(auth.check()).toBe(auth.me != null);
    });
    it("should return a sendMagicLink function", async () => {
      const { result } = await renderHookAsync(() => useAuth(), {
        wrapper: AuthProvider,
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
      const { result } = await renderHookAsync(() => useAuth(), {
        wrapper: AuthProvider,
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
      const { result } = await renderHookAsync(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const auth = result.current;

      await act(async () => await auth.logout());

      expectContractCall("auth", "logout", "anyone");
    });
    it("should throw when logout fails", async () => {
      setupMocks({
        force500: [
          {
            path: "/api/auth/logout",
            method: "post",
          },
        ],
      });

      const { result } = await renderHookAsync(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const auth = result.current;

      await expect(auth.logout()).rejects.toThrow(/logout/i);

      expectContractCall("auth", "logout", "anyone");
    });
  });
});
