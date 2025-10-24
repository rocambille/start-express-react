import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";

import * as AuthContext from "../../src/react/components/auth/AuthContext";

import * as ItemContext from "../../src/react/components/item/ItemContext";
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

const itemContextValue = {
  items: [{ id: 1, user_id: 1, title: "foo" }],
  item: { id: 1, user_id: 1, title: "foo" },
  addItem: () => {},
  editItem: () => {},
  deleteItem: () => {},
};

beforeEach(() => {
  globalThis.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve([]),
    }),
  );

  vi.spyOn(window, "alert").mockImplementation(() => {});

  vi.spyOn(AuthContext, "useAuth").mockImplementation(() => authContextValue);

  vi.spyOn(ItemContext, "useItems").mockImplementation(() => itemContextValue);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React item components", () => {
  test("<ItemProvider />", async () => {
    const Consumer = () => {
      const { addItem, editItem, deleteItem } = ItemContext.useItems();

      addItem({ title: "hello, world!" });
      editItem({ title: "hello, world!" });
      deleteItem();

      return <p>hello, world!</p>;
    };

    await act(async () => {
      render(
        <ItemContext.ItemProvider>
          <Consumer />
        </ItemContext.ItemProvider>,
        {
          wrapper: BrowserRouter,
        },
      );
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
