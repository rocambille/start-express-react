import { screen } from "@testing-library/react";
import { data } from "react-router";

import { HttpError, NotFoundError } from "../../../src/errors/HttpError";
import ErrorPage from "../../../src/react/components/ErrorPage";
import { renderWithStub, setupMocks } from "../test-utils";

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
      Component: () => <ErrorPage />,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("heading", { level: 1 });
  });

  it("should handle a route error response", async () => {
    await renderWithStub({
      path: "/",
      Component: () => <p>hello, world!</p>,
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

  it("should handle a 404 error", async () => {
    await renderWithStub({
      path: "/",
      Component: () => {
        throw new NotFoundError();
      },
      ErrorBoundary: ErrorPage,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("heading", { level: 1 });
    await screen.findByText("Not Found");
  });

  it("should handle an HTTP error response", async () => {
    await renderWithStub({
      path: "/",
      Component: () => {
        throw new HttpError(418, "I'm a teapot");
      },
      ErrorBoundary: ErrorPage,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("heading", { level: 1 });
    await screen.findByText("I'm a teapot");
  });

  it("should handle a standard error", async () => {
    await renderWithStub({
      path: "/",
      Component: () => {
        throw new Error("Test error");
      },
      ErrorBoundary: ErrorPage,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("heading", { level: 1 });
    await screen.findByText("Test error");
  });
});
