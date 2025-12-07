import { act, render, renderHook } from "@testing-library/react";
import { createRoutesStub } from "react-router";

import * as AuthContext from "../../src/react/components/auth/AuthContext";
import * as itemHooks from "../../src/react/components/item/hooks";

export const mockedRandomUUID = "a-b-c-d-e";

export const mockCsrfToken = () => {
  vi.stubGlobal("cookieStore", { get: vi.fn(), set: vi.fn() });
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => mockedRandomUUID);
};

export const mockedItems = [{ id: 1, title: "foo", user_id: 1 }];

export const mockedInsertId = 42;

export const mockFetch = (
  custom?: (path: string, method: string) => Promise<Response> | undefined,
) => {
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

      if (custom) {
        const customResult = custom(path, method);

        if (customResult != null) {
          return customResult;
        }
      }
      if (path === "/api/access-tokens" && method === "post") {
        return Promise.resolve().then(
          () =>
            new Response(JSON.stringify({ id: 1, email: "foo@mail.com" }), {
              status: 201,
              headers: {
                "Content-Type": "application/json",
              },
            }),
        );
      }
      if (path === "/api/access-tokens" && method === "delete") {
        return Promise.resolve().then(
          () => new Response(null, { status: 204 }),
        );
      }
      if (path === "/api/items" && method === "get") {
        return Promise.resolve().then(
          () =>
            new Response(JSON.stringify(mockedItems), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            }),
        );
      }
      if (path === "/api/items" && method === "post") {
        return Promise.resolve().then(
          () =>
            new Response(JSON.stringify({ insertId: mockedInsertId }), {
              status: 201,
              headers: {
                "Content-Type": "application/json",
              },
            }),
        );
      }
      if (path.match(/\/api\/items\/\d+/) && method === "put") {
        return Promise.resolve().then(
          () => new Response(null, { status: 204 }),
        );
      }
      if (path.match(/\/api\/items\/\d+/) && method === "delete") {
        return Promise.resolve().then(
          () => new Response(null, { status: 204 }),
        );
      }
      if (path === "/api/me" && method === "get") {
        return Promise.resolve().then(
          () =>
            new Response(JSON.stringify({ id: 1, email: "foo@mail.com" }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            }),
        );
      }
      if (path === "/api/users" && method === "post") {
        return Promise.resolve().then(
          () =>
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

export const mockUseAuth = (user: User | null) => {
  const auth: ReturnType<typeof AuthContext.useAuth> = {
    user,
    check: () => user != null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  };

  const spy = vi.spyOn(AuthContext, "useAuth").mockImplementation(() => auth);

  const result: [typeof auth, typeof spy] = [auth, spy];

  return result;
};

export const mockUseItems = (params?: { id: string }) => {
  const itemsStuff: ReturnType<typeof itemHooks.useItems> = {
    items: mockedItems,
    item: mockedItems.find((item) => item.id === Number(params?.id)),
    editItem: vi.fn(),
    addItem: vi.fn(),
    deleteItem: vi.fn(),
  };

  const spy = vi
    .spyOn(itemHooks, "useItems")
    .mockImplementation(() => itemsStuff);

  const result: [typeof itemsStuff, typeof spy] = [itemsStuff, spy];

  return result;
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

// Wrapping render in act is required here because useItems is suspending
// see https://github.com/testing-library/react-testing-library/issues/1375#issuecomment-2582198933
export const renderAsync = async (
  ui: Parameters<typeof render>[0],
  options?: Parameters<typeof render>[1],
) => await act(async () => render(ui, options));

// Wrapping render in act is required here because useItems is suspending
// see https://github.com/testing-library/react-testing-library/issues/1375#issuecomment-2582198933
export const renderHookAsync = async <
  Result,
  Props,
  RenderHookParameters extends Parameters<typeof renderHook<Result, Props>>,
>(
  render: RenderHookParameters[0],
  options?: RenderHookParameters[1],
) => await act(async () => renderHook<Result, Props>(render, options));
