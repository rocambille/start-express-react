/**
 * @jest-environment jsdom
 */
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(global, { TextDecoder, TextEncoder });

import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import "@testing-library/jest-dom";

import * as AuthContext from "../../src/react/contexts/AuthContext";
import * as ItemContext from "../../src/react/contexts/ItemContext";

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

import Home from "../../src/react/pages/Home";

test("<Home />", async () => {
  await act(async () => {
    render(<Home />, { wrapper: BrowserRouter });
  });

  expect(true).toBeTruthy();
});

import ItemDetail from "../../src/react/pages/ItemDetail";

test("<ItemDetail />", async () => {
  await act(async () => {
    render(<ItemDetail />, { wrapper: BrowserRouter });
  });

  expect(true).toBeTruthy();
});

import ItemEdit from "../../src/react/pages/ItemEdit";

test("<ItemEdit />", async () => {
  await act(async () => {
    render(<ItemEdit />, { wrapper: BrowserRouter });
  });

  expect(true).toBeTruthy();
});

import ItemIndex from "../../src/react/pages/ItemIndex";

test("<ItemIndex />", async () => {
  await act(async () => {
    render(<ItemIndex />, { wrapper: BrowserRouter });
  });

  expect(true).toBeTruthy();
});

import ItemNew from "../../src/react/pages/ItemNew";

test("<ItemNew />", async () => {
  await act(async () => {
    render(<ItemNew />, { wrapper: BrowserRouter });
  });

  expect(true).toBeTruthy();
});
