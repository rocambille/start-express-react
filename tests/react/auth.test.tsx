import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  AuthProvider,
  useAuth,
} from "../../src/react/components/auth/AuthContext";
import LoginRegisterForm from "../../src/react/components/auth/LoginRegisterForm";
import LogoutForm from "../../src/react/components/auth/LogoutForm";

import {
  mockCsrfToken,
  mockedRandomUUID,
  mockFetch,
  mockUseAuth,
  stubRoute,
} from "./utils";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("React auth components", () => {
  describe("<AuthProvider />", () => {
    beforeEach(() => {
      mockCsrfToken();
      mockFetch();
    });
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
    beforeEach(() => {
      mockCsrfToken();
      mockFetch();
    });
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

      await act(
        async () =>
          await auth.login({ email: "foo@mail.com", password: "secret" }),
      );

      expect(globalThis.cookieStore.set).toHaveBeenCalledWith({
        expires: expect.any(Number),
        name: "__Host-x-csrf-token",
        path: "/",
        sameSite: "strict",
        value: mockedRandomUUID,
      });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/access-tokens",
        expect.objectContaining({
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": mockedRandomUUID,
          },
          body: JSON.stringify({ email: "foo@mail.com", password: "secret" }),
        }),
      );
    });
    it("should return a logout function", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      const auth = result.current;

      expect(typeof auth.logout).toBe("function");

      await act(async () => await auth.logout());

      expect(globalThis.cookieStore.set).toHaveBeenCalledWith({
        expires: expect.any(Number),
        name: "__Host-x-csrf-token",
        path: "/",
        sameSite: "strict",
        value: mockedRandomUUID,
      });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/access-tokens",
        expect.objectContaining({
          method: "delete",
          headers: {
            "X-CSRF-Token": mockedRandomUUID,
          },
        }),
      );
    });
    it("should return a register function", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      const auth = result.current;

      expect(typeof auth.register).toBe("function");

      await act(
        async () =>
          await auth.register({
            email: "foo@mail.com",
            password: "secret",
            confirmPassword: "secret",
          }),
      );

      expect(globalThis.cookieStore.set).toHaveBeenCalledWith({
        expires: expect.any(Number),
        name: "__Host-x-csrf-token",
        path: "/",
        sameSite: "strict",
        value: mockedRandomUUID,
      });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/users",
        expect.objectContaining({
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": mockedRandomUUID,
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
      mockUseAuth(null);

      const Stub = stubRoute("/", LoginRegisterForm);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByTestId("login"));
      await waitFor(() => screen.getByTestId("register"));
    });
    it("should submit form login", async () => {
      const [auth] = mockUseAuth(null);

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
      const [auth] = mockUseAuth(null);

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
      mockUseAuth({ id: 1, email: "foo@mail.com" });

      const Stub = stubRoute("/", LogoutForm);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByRole("button"));
    });
    it("should submit form logout", async () => {
      const [auth] = mockUseAuth({ id: 1, email: "foo@mail.com" });

      const Stub = stubRoute("/", LogoutForm);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByRole("button"));

      const user = userEvent.setup();

      await user.click(screen.getByRole("button"));

      expect(auth.logout).toHaveBeenCalled();
    });
  });
});
