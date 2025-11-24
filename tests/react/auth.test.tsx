import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  AuthProvider,
  useAuth,
} from "../../src/react/components/auth/AuthContext";
import LoginRegisterForm from "../../src/react/components/auth/LoginRegisterForm";
import LogoutForm from "../../src/react/components/auth/LogoutForm";

import { mockAuth, mockFetch, stubRoute } from "./utils";

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React auth components", () => {
  describe("<AuthProvider />", () => {
    it("should render its children", async () => {
      const Stub = stubRoute("/", () => (
        <AuthProvider>hello, world!</AuthProvider>
      ));

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByText("hello, world!"));
    });
    it("should fetch /api/me on mount", async () => {
      const Stub = stubRoute("/", () => (
        <AuthProvider>hello, world!</AuthProvider>
      ));

      render(<Stub initialEntries={["/"]} />);

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/me");
    });
  });
  describe("useAuth()", () => {
    it("should be used within <AuthProvider>", async () => {
      // Avoid exception noise in console
      vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow(/\buseAuth\b.*\bwithin\b.*\bAuthProvider\b/i);
    });
    it("should return an auth object", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      const auth = result.current;

      expect(auth).toBeDefined();
    });
    it("should return a check function", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      const auth = result.current;

      expect(typeof auth.check).toBe("function");

      expect(auth.check()).toBe(auth.user != null);
    });
    it("should return a login function", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      const auth = result.current;

      expect(typeof auth.login).toBe("function");

      auth.login({ email: "foo@mail.com", password: "secret" });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/access-tokens",
        expect.objectContaining({
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: "foo@mail.com", password: "secret" }),
        }),
      );
    });
    it("should return a logout function", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      const auth = result.current;

      expect(typeof auth.logout).toBe("function");

      auth.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/access-tokens",
        expect.objectContaining({
          method: "delete",
        }),
      );
    });
    it("should return a register function", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      const auth = result.current;

      expect(typeof auth.register).toBe("function");

      auth.register({
        email: "foo@mail.com",
        password: "secret",
        confirmPassword: "secret",
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/users",
        expect.objectContaining({
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "foo@mail.com",
            password: "secret",
            confirmPassword: "secret",
          }),
        }),
      );
    });
  });
  describe("<LoginRegisterForm />", () => {
    it("should mount successfully", async () => {
      mockAuth(null);

      const Stub = stubRoute("/", LoginRegisterForm);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByTestId("login"));
      await waitFor(() => screen.getByTestId("register"));
    });
    it("should submit form login", async () => {
      const [auth] = mockAuth(null);

      const Stub = stubRoute("/", LoginRegisterForm);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByTestId("login"));

      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/^email$/i), "foo@mail.com");
      await user.type(screen.getByLabelText(/^password$/i), "secret");
      await user.click(screen.getByTestId("login"));

      expect(auth.login).toHaveBeenCalledWith({
        email: "foo@mail.com",
        password: "secret",
      });
    });
    it("should submit form register", async () => {
      const [auth] = mockAuth(null);

      const Stub = stubRoute("/", LoginRegisterForm);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByTestId("register"));

      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/^email$/i), "foo@mail.com");
      await user.type(screen.getByLabelText(/^password$/i), "secret");
      await user.type(screen.getByLabelText(/^confirm\spassword$/i), "secret");
      await user.click(screen.getByTestId("register"));

      expect(auth.register).toHaveBeenCalledWith({
        email: "foo@mail.com",
        password: "secret",
        confirmPassword: "secret",
      });
    });
  });
  describe("<LogoutForm />", () => {
    it("should mount successfully", async () => {
      mockAuth({ id: 1, email: "foo@mail.com" });

      const Stub = stubRoute("/", LogoutForm);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByRole("button"));
    });
    it("should submit form logout", async () => {
      const [auth] = mockAuth({ id: 1, email: "foo@mail.com" });

      const Stub = stubRoute("/", LogoutForm);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByRole("button"));

      const user = userEvent.setup();

      await user.click(screen.getByRole("button"));

      expect(auth.logout).toHaveBeenCalled();
    });
  });
});
