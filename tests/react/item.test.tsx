import { act, render } from "@testing-library/react";
import * as ReactRouter from "react-router";

import * as AuthContext from "../../src/react/components/auth/AuthContext";

import ItemCreate from "../../src/react/components/item/ItemCreate";
import ItemEdit from "../../src/react/components/item/ItemEdit";
import ItemList from "../../src/react/components/item/ItemList";
import ItemShow from "../../src/react/components/item/ItemShow";

const authContextValue = {
  user: null,
  check: () => false,
  login: () => {},
  logout: () => {},
  register: () => {},
};

beforeEach(() => {
  globalThis.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve([{ id: 1 }]),
    }),
  );

  vi.spyOn(window, "alert").mockImplementation(() => {});

  vi.spyOn(ReactRouter, "useParams").mockImplementation(() => ({ id: "1" }));

  vi.spyOn(AuthContext, "useAuth").mockImplementation(() => authContextValue);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React item components", () => {
  test("<ItemCreate />", async () => {
    await act(async () => {
      render(<ItemCreate />, { wrapper: ReactRouter.BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemEdit />", async () => {
    await act(async () => {
      render(<ItemEdit />, { wrapper: ReactRouter.BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemList />", async () => {
    await act(async () => {
      render(<ItemList />, { wrapper: ReactRouter.BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemShow />", async () => {
    await act(async () => {
      render(<ItemShow />, { wrapper: ReactRouter.BrowserRouter });
    });

    expect(true).toBeTruthy();
  });
});
