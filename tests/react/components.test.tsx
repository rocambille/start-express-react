import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";

import * as AuthContext from "../../src/react/components/AuthContext";
import { AuthProvider, useAuth } from "../../src/react/components/AuthContext";
import { ItemProvider, useItems } from "../../src/react/components/ItemContext";
import Layout from "../../src/react/components/Layout";

const authContextValue = {
  user: null,
  login: () => {},
  logout: () => {},
  register: () => {},
};

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

describe("React Components", () => {
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

  test("<ItemProvider />", async () => {
    vi.spyOn(AuthContext, "useAuth").mockImplementation(() => authContextValue);

    const Consumer = () => {
      const { addItem, editItem, deleteItem } = useItems();

      addItem({ title: "hello, world!" });
      editItem({ title: "hello, world!" });
      deleteItem();

      return <p>hello, world!</p>;
    };

    await act(async () => {
      render(
        <ItemProvider>
          <Consumer />
        </ItemProvider>,
        {
          wrapper: BrowserRouter,
        },
      );
    });

    expect(true).toBeTruthy();
  });

  test("<Layout />", async () => {
    await act(async () => {
      render(<Layout>hello, world!</Layout>, {
        wrapper: BrowserRouter,
      });
    });

    expect(true).toBeTruthy();
  });
});
