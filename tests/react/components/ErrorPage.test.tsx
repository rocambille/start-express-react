import { screen } from "@testing-library/react";
import { data } from "react-router";

import ErrorPage from "../../../src/react/components/ErrorPage";
import { renderWithStub, setupMocks } from "../test-utils";

const Hello = () => <p>hello, world!</p>;

const Thrower = () => {
  throw new Error("Test error");
};

describe("<ErrorPage />", () => {
  beforeEach(() => {
    setupMocks();
    // Avoid exception noise in console
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    await renderWithStub({
      path: "/",
      Component: ErrorPage,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("heading", { level: 1 });
  });

  it("should handle a route error response", async () => {
    await renderWithStub({
      path: "/",
      Component: Hello,
      loader: () => {
        throw data("Test error", { status: 404 });
      },
      ErrorBoundary: ErrorPage,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("heading", { level: 1 });
    await screen.findByText("Test error");
  });

  it("should handle a standard error", async () => {
    await renderWithStub({
      path: "/",
      Component: Thrower,
      ErrorBoundary: ErrorPage,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("heading", { level: 1 });
    await screen.findByText("Test error");
  });
});
