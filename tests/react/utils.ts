import { act, render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";

import * as AuthContext from "../../src/react/components/auth/AuthContext";

export const mockedItems = [{ id: 1, title: "foo", user_id: 1 }];

export const mockedInsertId = 42;

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

      if (path === "/api/access-token" && method === "post") {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 1, email: "foo@mail.com" }), {
            status: 201,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      }
      if (path === "/api/access-token" && method === "delete") {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (path === "/api/items" && method === "get") {
        return Promise.resolve(
          new Response(JSON.stringify(mockedItems), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      }
      if (path === "/api/items" && method === "post") {
        return Promise.resolve(
          new Response(JSON.stringify({ insertId: mockedInsertId }), {
            status: 201,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      }
      if (path.match(/\/api\/items\/\d+/) && method === "put") {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (path.match(/\/api\/items\/\d+/) && method === "delete") {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
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
      if (path === "/api/users" && method === "post") {
        return Promise.resolve(
          new Response(JSON.stringify({ insertId: mockedInsertId }), {
            status: 201,
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

export const mockAuth = (user: User | null) => {
  vi.spyOn(AuthContext, "useAuth").mockImplementation((() => ({
    user,
    check: () => user != null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  })) as typeof AuthContext.useAuth);
};

type StubRouteObject = Parameters<typeof createRoutesStub>[0][number];

export const stubRoute = (
  path: StubRouteObject["path"],
  Component: StubRouteObject["Component"],
) =>
  createRoutesStub([
    {
      path,
      Component,
      ErrorBoundary:
        // Catch component errors and report them to the test runner
        ({ error }) => {
          throw error;
        },
    },
  ]);

const getByRole = <T extends HTMLElement>(
  role: string,
  callback: (element: T) => boolean,
) => {
  const found = (screen.queryAllByRole(role) as T[]).filter(callback);

  if (found.length === 0) {
    throw new Error(
      `No elements with role '${role}' satisfying ${callback.toString()}`,
    );
  }
  if (found.length > 1) {
    throw new Error(
      `Several elements with role '${role}' satisfying ${callback.toString()}`,
    );
  }

  return found[0];
};

export const getSubmit = (name?: string) =>
  getByRole<HTMLButtonElement>(
    "button",
    (element) =>
      element.type === "submit" && (name == null || element.name === name),
  );

export const getByHref = (href: string | RegExp) =>
  getByRole<HTMLAnchorElement>(
    "link",
    (element) => (element as HTMLAnchorElement).href.match(href) != null,
  );

type RenderParameters = Parameters<typeof render>;

export const renderAsync = async (
  ui: RenderParameters[0],
  options?: RenderParameters[1],
) => {
  // Wrapping render in act is required here because useItems is suspending
  // see https://github.com/testing-library/react-testing-library/issues/1375#issuecomment-2582198933
  await act(async () => {
    render(ui, options);
  });
};
