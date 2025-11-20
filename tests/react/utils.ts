import type { createRoutesStub } from "react-router";

export const mockFetch = () => {
  globalThis.fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const path =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : input.url;

      const method = init?.method?.toLowerCase() ?? "get";

      if (path === "/api/me" && method === "get") {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 1, email: "foo@mail.com" }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      }

      throw new Error(
        `Unhandled fetch call to ${input}${init ? ` with: ${JSON.stringify(init)}` : ""}`,
      );
    });
};

type StubRouteObject = Parameters<typeof createRoutesStub>[0][number];

export const withErrorBoundary = (
  Component: StubRouteObject["Component"],
  path: StubRouteObject["path"] = "/",
): StubRouteObject => ({
  path,
  Component,
  ErrorBoundary:
    // Catch component errors and report them to the test runner
    ({ error }) => {
      throw error;
    },
});
