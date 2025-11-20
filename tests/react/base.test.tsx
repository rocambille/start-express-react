import { act, render, screen, waitFor } from "@testing-library/react";
import { createRoutesStub } from "react-router";

import Home from "../../src/react/components/Home";
import Layout from "../../src/react/components/Layout";
import { mockFetch, withErrorBoundary } from "./utils";

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React base components", () => {
  describe("<Home />", () => {
    test("should mount successfully", async () => {
      const Stub = createRoutesStub([withErrorBoundary(Home)]);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() =>
        screen.getByRole("heading", { level: 1, name: /starter/i }),
      );
    });
    test("should count the clicks", async () => {
      const Stub = createRoutesStub([withErrorBoundary(Home)]);

      render(<Stub initialEntries={["/"]} />);

      const count = screen.getByTestId("count-value");

      expect(count.textContent).toBe("0");

      act(() => {
        screen.getByRole("button", { name: /count/i }).click();
      });

      expect(count.textContent).toBe("1");
    });
  });
  describe("<Layout />", () => {
    test("should mount successfully", async () => {
      const Stub = createRoutesStub([withErrorBoundary(() => <Layout />)]);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByRole("navigation"));
    });
    test("should render its children", async () => {
      const Stub = createRoutesStub([
        withErrorBoundary(() => <Layout>hello, world!</Layout>),
      ]);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByText("hello, world!"));
    });
  });
});
