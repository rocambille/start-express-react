import { render, screen, waitFor } from "@testing-library/react";
import { createRoutesStub } from "react-router";

import {
  AuthProvider,
  useAuth,
} from "../../src/react/components/auth/AuthContext";
import mockFetch from "./mockFetch";

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
        {
          path: "/",
          Component: () => <AuthProvider>hello, world!</AuthProvider>,
          ErrorBoundary: ({ error }) => {
            throw error;
          },
        },
      ]);

      expect(() => render(<Stub initialEntries={["/"]} />)).not.toThrow();

      await waitFor(() => screen.getByText("hello, world!"));
    });
  });
  describe("useAuth()", () => {
    test("should be used within <AuthProvider>", async () => {
      vi.spyOn(console, "error").mockImplementation(() => null);

      const Consumer = () => {
        useAuth();

        return "hello, world!";
      };

      const Stub = createRoutesStub([
        {
          path: "/",
          Component: () => <Consumer />,
          ErrorBoundary: ({ error }) => {
            throw error;
          },
        },
      ]);

      expect(() => render(<Stub initialEntries={["/"]} />)).toThrowError(
        "useAuth has to be used within <AuthProvider />",
      );
    });
    test("should return auth object", async () => {
      const Consumer = () => {
        const auth = useAuth();

        expect(auth).toBeDefined();
        expect(auth.check).toBeDefined();
        expect(auth.login).toBeDefined();
        expect(auth.logout).toBeDefined();

        return "hello, world!";
      };

      const Stub = createRoutesStub([
        {
          path: "/",
          Component: () => (
            <AuthProvider>
              <Consumer />
            </AuthProvider>
          ),
          ErrorBoundary: ({ error }) => {
            throw error;
          },
        },
      ]);

      expect(() => render(<Stub initialEntries={["/"]} />)).not.toThrow();

      await waitFor(() => screen.getByText("hello, world!"));
    });
  });
});
