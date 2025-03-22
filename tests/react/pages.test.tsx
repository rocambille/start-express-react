/**
 * @jest-environment jsdom
 */
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(global, { TextDecoder, TextEncoder });

import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import "@testing-library/jest-dom";

import * as AuthContext from "../../src/react/components/AuthContext";
import * as ItemContext from "../../src/react/components/ItemContext";

import Home from "../../src/react/pages/Home";
import ItemEdit from "../../src/react/pages/ItemEdit";
import ItemIndex from "../../src/react/pages/ItemIndex";
import ItemNew from "../../src/react/pages/ItemNew";
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
  jest.spyOn(AuthContext, "useAuth").mockImplementation(() => authContextValue);

  jest
    .spyOn(ItemContext, "useItems")
    .mockImplementation(() => itemContextValue);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("React Pages", () => {
  test("<Home />", async () => {
    await act(async () => {
      render(<Home />, { wrapper: BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemEdit />", async () => {
    await act(async () => {
      render(<ItemEdit />, { wrapper: BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemIndex />", async () => {
    await act(async () => {
      render(<ItemIndex />, { wrapper: BrowserRouter });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemNew />", async () => {
    await act(async () => {
      render(<ItemNew />, { wrapper: BrowserRouter });
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
