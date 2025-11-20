import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { createRoutesStub } from "react-router";

import {
  AuthProvider,
  useAuth,
} from "../../src/react/components/auth/AuthContext";
import { mockFetch, withErrorBoundary } from "./utils";

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React auth components", () => {
  describe("<AuthProvider />", () => {
    test("should render its children", async () => {
      const Stub = createRoutesStub([
        withErrorBoundary(() => <AuthProvider>hello, world!</AuthProvider>),
      ]);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByText("hello, world!"));
    });
    test("should fetch /api/me on mount", async () => {
      const Stub = createRoutesStub([
        withErrorBoundary(() => <AuthProvider>hello, world!</AuthProvider>),
      ]);

      render(<Stub initialEntries={["/"]} />);

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/me");
    });
  });
  describe("useAuth()", () => {
    test("should be used within <AuthProvider>", async () => {
      // Avoid exception noise in console
      const silence = vi.spyOn(console, "error").mockImplementation(() => {});

      try {
        renderHook(useAuth);

        throw new Error("should have thrown");
      } catch (err) {
        expect((err as Error).message).toMatch(
          /useAuth[\s\S]*within[\s\S]*AuthProvider/i,
        );
      } finally {
        silence.mockRestore();
      }
    });
    test("should return an auth object", async () => {
      const Consumer = () => {
        const auth = useAuth();

        expect(auth).toBeDefined();
        expect(typeof auth.check).toBe("function");
        expect(typeof auth.login).toBe("function");
        expect(typeof auth.logout).toBe("function");

        return "hello, world!";
      };

      const Stub = createRoutesStub([
        withErrorBoundary(() => (
          <AuthProvider>
            <Consumer />
          </AuthProvider>
        )),
      ]);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByText("hello, world!"));
    });
  });
});
