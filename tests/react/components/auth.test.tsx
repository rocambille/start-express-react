import { act, fireEvent, screen } from "@testing-library/react";
import * as ReactRouter from "react-router";

import {
  AuthProvider,
  useAuth,
} from "../../../src/react/components/auth/AuthContext";
import LogoutForm from "../../../src/react/components/auth/LogoutForm";
import MagicLinkForm from "../../../src/react/components/auth/MagicLinkForm";
import VerifyPage from "../../../src/react/components/auth/VerifyPage";
import {
  expectContractCall,
  fooUser,
  renderHookAsync,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../test-utils";

describe("React auth components", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("<AuthProvider />", () => {
    it("should render its children", async () => {
      await renderWithStub(
        "/",
        () => <AuthProvider initialUser={null}>hello, world!</AuthProvider>,
        ["/"],
        { me: null },
      );

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
            requestValue("auth", "magic_link", "success", "email"),
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
            requestValue("auth", "verify", "success", "token"),
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
      setupMocks({ force500: true });

      const { result } = await renderHookAsync(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const auth = result.current;

      await expect(auth.logout()).rejects.toThrow(/logout/i);

      expectContractCall("auth", "logout", "anyone");
    });
  });

  describe("<MagicLinkForm />", () => {
    it("should mount successfully", async () => {
      await renderWithStub("/", MagicLinkForm, ["/"], { me: null });
      await screen.findByRole("form");
    });
    it("should submit email and show confirmation", async () => {
      const { user } = await renderWithStub("/", MagicLinkForm, ["/"], {
        me: null,
      });

      await user.type(
        screen.getByLabelText(/^email$/i),
        requestValue("auth", "magic_link", "success", "email"),
      );
      await user.click(screen.getByRole("button"));

      expectContractCall("auth", "magic_link", "success");
    });
    it("should fail when email is invalid", async () => {
      vi.spyOn(globalThis, "alert").mockImplementationOnce(() => {});

      await renderWithStub("/", MagicLinkForm, ["/"], {
        me: null,
      });

      await fireEvent.submit(screen.getByRole("form"));

      expect(alert).toHaveBeenCalled();
    });
  });

  describe("<LogoutForm />", () => {
    it("should mount successfully", async () => {
      await renderWithStub("/", LogoutForm, ["/"], {
        me: fooUser,
      });
      await screen.findByRole("button");
    });
    it("should submit form logout", async () => {
      const { user } = await renderWithStub("/", LogoutForm, ["/"], {
        me: fooUser,
      });
      await screen.findByRole("button");

      await user.click(screen.getByRole("button"));

      expectContractCall("auth", "logout", "anyone");
    });
  });

  describe("<VerifyPage />", () => {
    it("should mount successfully", async () => {
      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});
      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );

      await renderWithStub(
        "/verify",
        VerifyPage,
        [`/verify?token=${requestValue("auth", "verify", "success", "token")}`],
        { me: null },
      );

      await screen.findByText(/in progress/i);
    });
    it("should verify token and redirect to dashboard when valid", async () => {
      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});
      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );

      await renderWithStub(
        "/verify",
        VerifyPage,
        [`/verify?token=${requestValue("auth", "verify", "success", "token")}`],
        { me: null },
      );

      expectContractCall("auth", "verify", "success");

      expect(mockedNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
    it("should display error when token is invalid", async () => {
      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});
      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );

      await renderWithStub(
        "/verify",
        VerifyPage,
        [
          `/verify?token=${requestValue("auth", "verify", "unauthorized", "token")}`,
        ],
        { me: null },
      );

      await screen.findByText(/invalid/i);

      expectContractCall("auth", "verify", "unauthorized");
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
    it("should display error when token is missing", async () => {
      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});
      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );

      await renderWithStub("/verify", VerifyPage, ["/verify"], { me: null });

      await screen.findByText(/invalid/i);

      expect(globalThis.fetch).not.toHaveBeenCalledWith(
        "/api/auth/verify",
        expect.objectContaining({
          method: "post",
        }),
      );
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });
});
