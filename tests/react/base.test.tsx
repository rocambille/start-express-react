import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";

import * as AuthContext from "../../src/react/components/auth/AuthContext";

import Home from "../../src/react/components/Home";
import Layout from "../../src/react/components/Layout";

const authContextValue = {
  user: null,
  check: () => false,
  login: () => {},
  logout: () => {},
  register: () => {},
};

beforeEach(() => {
  vi.spyOn(AuthContext, "useAuth").mockImplementation(() => authContextValue);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React base components", () => {
  test("<Home />", async () => {
    await act(async () => {
      render(<Home />, { wrapper: BrowserRouter });
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
