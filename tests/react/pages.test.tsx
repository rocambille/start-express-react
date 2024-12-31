/**
 * @jest-environment jsdom
 */
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(global, { TextDecoder, TextEncoder });

import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import "@testing-library/jest-dom";

import * as utils from "../../src/react/utils";

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
  const item: Item = { id: 1, user_id: 1, title: "foo" };
  const cachedItem = Promise.resolve(item);

  // Mock the implementation of utils.get
  jest.spyOn(utils, "get").mockImplementation(() => cachedItem);

  await act(async () => {
    render(<ItemDetail />, { wrapper: BrowserRouter });
  });

  expect(true).toBeTruthy();
});

import ItemEdit from "../../src/react/pages/ItemEdit";

test("<ItemEdit />", async () => {
  const item: Item = { id: 1, user_id: 1, title: "foo" };
  const cachedItem = Promise.resolve(item);

  // Mock the implementation of utils.get
  jest.spyOn(utils, "get").mockImplementation(() => cachedItem);

  await act(async () => {
    render(<ItemEdit />, { wrapper: BrowserRouter });
  });

  expect(true).toBeTruthy();
});

import ItemIndex from "../../src/react/pages/ItemIndex";

test("<ItemIndex />", async () => {
  const items: Item[] = [{ id: 1, user_id: 1, title: "foo" }];
  const cachedItems = Promise.resolve(items);

  // Mock the implementation of utils.get
  jest.spyOn(utils, "get").mockImplementation(() => cachedItems);

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
