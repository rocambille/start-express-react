import { render, renderHook, screen, waitFor } from "@testing-library/react";

import {
  AuthProvider,
  useAuth,
} from "../../src/react/components/auth/AuthContext";

import { mockFetch, stubRoute } from "./utils";

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React auth components", () => {
  describe("<AuthProvider />", () => {
    test("should render its children", async () => {
      const Stub = stubRoute("/", () => (
        <AuthProvider>hello, world!</AuthProvider>
      ));

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByText("hello, world!"));
    });
    test("should fetch /api/me on mount", async () => {
      const Stub = stubRoute("/", () => (
        <AuthProvider>hello, world!</AuthProvider>
      ));

      render(<Stub initialEntries={["/"]} />);

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/me");
    });
  });
  describe("useAuth()", () => {
    test("should be used within <AuthProvider>", async () => {
      // Avoid exception noise in console
      const spy = vi.spyOn(console, "error");
      spy.mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow(/\buseAuth\b.*\bwithin\b.*\bAuthProvider\b/i);

      spy.mockRestore();
    });
    test("should return an auth object", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      const auth = result.current;

      expect(auth).toBeDefined();
      expect(typeof auth.check).toBe("function");
      expect(typeof auth.login).toBe("function");
      expect(typeof auth.logout).toBe("function");
    });
  });
});
