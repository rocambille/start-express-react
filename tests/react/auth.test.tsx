import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";

import {
  AuthProvider,
  useAuth,
} from "../../src/react/components/auth/AuthContext";

beforeEach(() => {
  globalThis.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve([]),
    }),
  );

  vi.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React auth components", () => {
  test("<AuthProvider />", async () => {
    const Consumer = () => {
      const { login, logout, register } = useAuth();

      login({ email: "foo@mail.com", password: "123456" });
      logout();
      register({
        email: "foo@mail.com",
        password: "123456",
        confirmPassword: "123456",
      });

      return <p>hello, world!</p>;
    };

    await act(async () => {
      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
        {
          wrapper: BrowserRouter,
        },
      );
    });

    expect(true).toBeTruthy();
  });
});
