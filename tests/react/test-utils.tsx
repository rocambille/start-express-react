import { act, render, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";

import { AuthProvider } from "../../src/react/components/auth/AuthContext";
import { DataRefreshProvider } from "../../src/react/components/DataRefreshContext";
import { invalidateCache } from "../../src/react/helpers/cache";
import { type Contract, contracts, type Json, type Test } from "../contracts";

export * from "../data";

// -------------------------
// Fetch mock (contract-based)
// -------------------------

const respond = (body: unknown, status: number) => {
  const json = JSON.stringify(body);

  if (json === "{}") {
    return Promise.resolve(new Response(null, { status }));
  }

  return Promise.resolve(
    new Response(json, {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
};

const isDeepEqual = (a: Json, b: Json): boolean => {
  if (a === b) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (!Array.isArray(a) && !Array.isArray(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key) || !isDeepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
};

const mockFetch = (
  custom?: (
    path: string,
    method: string,
    init?: RequestInit,
  ) => Promise<Response> | undefined,
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

      // Allow per-test overrides
      if (custom) {
        const customResult = custom(path, method);
        if (customResult != null) return customResult;
      }

      const parseBody = (body?: RequestInit["body"]): Json | undefined => {
        if (body == null) {
          return;
        }
        return JSON.parse(body.toString());
      };

      const parsedBody = parseBody(init?.body);

      // --- From contracts ---
      for (const [_contractName, contract] of Object.entries(contracts)) {
        for (const [_testName, test] of Object.entries(contract)) {
          for (const [_caseName, c] of Object.entries(test.cases)) {
            if (
              path === (c.specialPath ?? test.path) &&
              method === test.method
            ) {
              if (isDeepEqual(parsedBody, c.request.body)) {
                return respond(c.response.body, c.response.status);
              }
            }
          }
        }
      }

      if (path === "/api/404" && method === "get") {
        return respond(null, 404);
      }

      throw new Error(
        `[Contract Mock] Unhandled fetch: ${method.toUpperCase()} ${path} with ${JSON.stringify(init)}`,
      );
    });
};

// Wrapping renderHook() in act() because React's use() is suspending
// see https://github.com/testing-library/react-testing-library/issues/1375#issuecomment-2582198933
export const renderHookAsync = async <
  Result,
  Props,
  RenderHookParameters extends Parameters<typeof renderHook<Result, Props>>,
>(
  render: RenderHookParameters[0],
  options?: RenderHookParameters[1],
) => await act(async () => renderHook<Result, Props>(render, options));

type StubRouteObject = Parameters<typeof createRoutesStub>[0][number];

// Wrapping render() in act() because React's use() is suspending
// see https://github.com/testing-library/react-testing-library/issues/1375#issuecomment-2582198933
export const renderWithStub = async ({
  path,
  Component,
  ErrorBoundary,
  loader,
  initialEntries,
  me,
}: {
  path: NonNullable<StubRouteObject["path"]>;
  Component: NonNullable<StubRouteObject["Component"]>;
  ErrorBoundary?: StubRouteObject["ErrorBoundary"];
  loader?: StubRouteObject["loader"];
  initialEntries: string[];
  me: User | null;
}) => {
  const Stub = createRoutesStub([
    {
      path,
      HydrateFallback: () => null,
      Component: () => (
        <AuthProvider initialUser={me}>
          <DataRefreshProvider>
            <Component />
          </DataRefreshProvider>
        </AuthProvider>
      ),
      ErrorBoundary:
        ErrorBoundary ??
        (({ error }: { error: unknown }) => {
          throw error;
        }),
      loader,
    },
  ]);
  const view = await act(async () =>
    render(<Stub initialEntries={initialEntries} />),
  );
  return { ...view, user: userEvent.setup() };
};

const mockedRandomUUID = "a-b-c-d-e";

export const setupMocks = ({
  forceCases,
  force500,
}: {
  forceCases?: Record<`${string}.${string}`, keyof Test["cases"]>;
  force500?: { path: string; method: "get" | "post" | "put" | "delete" }[];
} = {}) => {
  vi.stubGlobal("cookieStore", { get: vi.fn(), set: vi.fn() });
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => mockedRandomUUID);

  const customFetch = (path: string, method: string) => {
    if (force500?.some((f) => f.path === path && f.method === method)) {
      return respond(null, 500);
    }
    if (forceCases) {
      for (const [key, caseName] of Object.entries(forceCases)) {
        const [contractName, testName] = key.split(".");
        if (contractName in contracts && testName in contracts[contractName]) {
          const test = contracts[contractName][testName];
          const c = test.cases[caseName];
          if (
            c &&
            path === (c.specialPath ?? test.path) &&
            method === test.method
          ) {
            return respond(c.response.body, c.response.status);
          }
        }
      }
    }
  };

  mockFetch(customFetch);

  invalidateCache("*");
};

export const requestValue = (
  contractName: keyof typeof contracts,
  testName: keyof Contract,
  caseName: keyof Test["cases"],
  field: string,
) => {
  const body = contracts[contractName][testName].cases[caseName].request.body;
  if (body != null && typeof body === "object" && !Array.isArray(body)) {
    return body[field];
  }
  throw new Error(`Case body is not an object: ${JSON.stringify(body)}`);
};

export const responseValue = (
  contractName: keyof typeof contracts,
  testName: keyof Contract,
  caseName: keyof Test["cases"],
  field: string,
) => {
  const body = contracts[contractName][testName].cases[caseName].response.body;
  if (body != null && typeof body === "object" && !Array.isArray(body)) {
    return JSON.parse(JSON.stringify(body[field]));
  }
  throw new Error(`Case body is not an object: ${JSON.stringify(body)}`);
};

export const expectContractCall = (
  contractName: keyof typeof contracts,
  testName: keyof Contract,
  caseName: keyof Test["cases"],
) => {
  const test = contracts[contractName][testName];
  const c = test.cases[caseName];

  const headers: Record<string, string> = {};

  if (test.method !== "get") {
    expect(globalThis.cookieStore.set).toHaveBeenCalledWith({
      expires: expect.any(Number),
      name: "__Host-x-csrf-token",
      path: "/",
      sameSite: "strict",
      value: mockedRandomUUID,
    });

    headers["X-CSRF-Token"] = mockedRandomUUID;
  }
  if (c.request.body) {
    headers["Content-Type"] = "application/json";
  }

  const init = {
    ...(test.method !== "get" ? { method: test.method } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    ...(c.request.body ? { body: JSON.stringify(c.request.body) } : {}),
  };

  const fetchArgs: Parameters<typeof globalThis.fetch> = [
    c.specialPath ?? test.path,
  ];

  if (Object.keys(init).length > 0) {
    fetchArgs.push(init);
  }

  expect(globalThis.fetch).toHaveBeenCalledWith(...fetchArgs);
};
