/**
 * @jest-environment jsdom
 */
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(global, { TextDecoder, TextEncoder });

import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import "@testing-library/jest-dom";

import App from "../../src/react/App";

afterEach(() => {
  jest.restoreAllMocks();
});

test("<App />", async () => {
  await act(async () => {
    render(<App />, { wrapper: BrowserRouter });
  });

  expect(true).toBeTruthy();
});
