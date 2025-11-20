import { render, screen, waitFor } from "@testing-library/react";
import { createRoutesStub } from "react-router";

import Home from "../../src/react/components/Home";
import Layout from "../../src/react/components/Layout";
import mockFetch from "./mockFetch";

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React base components", () => {
  describe("<Home />", () => {
    test("should mount successfully", async () => {
      const Stub = createRoutesStub([
        {
          path: "/",
          Component: Home,
          ErrorBoundary: ({ error }) => {
            throw error;
          },
        },
      ]);

      expect(() => render(<Stub initialEntries={["/"]} />)).not.toThrow();

      await waitFor(() => screen.getByText(/starter/i));
    });
    test("should count the clicks", async () => {
      const Stub = createRoutesStub([
        {
          path: "/",
          Component: Home,
          ErrorBoundary: ({ error }) => {
            throw error;
          },
        },
      ]);

      expect(() => render(<Stub initialEntries={["/"]} />)).not.toThrow();

      await waitFor(() => screen.getByText("0"));

      screen.getByRole("button", { name: /count/i }).click();

      await waitFor(() => screen.getByText("1"));
    });
  });
  describe("<Layout />", () => {
    test("should render its children", async () => {
      const Stub = createRoutesStub([
        {
          path: "/",
          Component: () => <Layout>hello, world!</Layout>,
          ErrorBoundary: ({ error }) => {
            throw error;
          },
        },
      ]);

      expect(() => render(<Stub initialEntries={["/"]} />)).not.toThrow();

      await waitFor(() => screen.getByText("hello, world!"));
    });
  });
});
