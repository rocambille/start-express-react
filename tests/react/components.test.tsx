/**
 * @jest-environment jsdom
 */
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(global, { TextDecoder, TextEncoder });

import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import "@testing-library/jest-dom";

import * as AuthContext from "../../src/react/components/AuthContext";
import { AuthProvider } from "../../src/react/components/AuthContext";
import { ItemProvider } from "../../src/react/components/ItemContext";
import Layout from "../../src/react/components/Layout";

const authContextValue = {
  user: null,
  login: () => {},
  logout: () => {},
  register: () => {},
};

beforeEach(() => {
  globalThis.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve([]),
    }),
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("React Components", () => {
  test("<AuthProvider />", async () => {
    await act(async () => {
      render(<AuthProvider>hello, world!</AuthProvider>, {
        wrapper: BrowserRouter,
      });
    });

    expect(true).toBeTruthy();
  });

  test("<ItemProvider />", async () => {
    jest
      .spyOn(AuthContext, "useAuth")
      .mockImplementation(() => authContextValue);

    await act(async () => {
      render(<ItemProvider>hello, world!</ItemProvider>, {
        wrapper: BrowserRouter,
      });
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
