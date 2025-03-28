import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";

import * as AuthContext from "../../src/react/components/AuthContext";
import * as ItemContext from "../../src/react/components/ItemContext";

import Home from "../../src/react/pages/Home";
import ItemCreate from "../../src/react/pages/ItemCreate";
import ItemEdit from "../../src/react/pages/ItemEdit";
import ItemList from "../../src/react/pages/ItemList";
import ItemShow from "../../src/react/pages/ItemShow";

const authContextValue = {
  user: null,
  login: () => {},
  logout: () => {},
  register: () => {},
};

const itemContextValue = {
  items: [{ id: 1, user_id: 1, title: "foo" }],
  item: { id: 1, user_id: 1, title: "foo" },
  addItem: () => {},
  editItem: () => {},
  deleteItem: () => {},
};

beforeEach(() => {
  vi.spyOn(AuthContext, "useAuth").mockImplementation(() => authContextValue);

  vi.spyOn(ItemContext, "useItems").mockImplementation(() => itemContextValue);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React Pages", () => {
  test("<Home />", async () => {
    await act(async () => {
      render(<Home />, { wrapper: BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemCreate />", async () => {
    await act(async () => {
      render(<ItemCreate />, { wrapper: BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemEdit />", async () => {
    await act(async () => {
      render(<ItemEdit />, { wrapper: BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemList />", async () => {
    await act(async () => {
      render(<ItemList />, { wrapper: BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemShow />", async () => {
    await act(async () => {
      render(<ItemShow />, { wrapper: BrowserRouter });
    });

    expect(true).toBeTruthy();
  });
});
