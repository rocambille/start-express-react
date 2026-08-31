import { act, render, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";

import { MeProvider } from "../../src/react/components/auth/MeContext";
import { DataRefreshProvider } from "../../src/react/components/DataRefreshContext";
import { forget } from "../../src/react/helpers/cache";
import contracts from "../contracts";

// -------------------------
// Deep equal helper
// -------------------------

const isDeepEqual = (a: Json | undefined, b: Json | undefined): boolean => {
  // a and b may be string | number | boolean | null | undefined
  // or reference the same object or array

  // check strict equality first (covers primitives and same object/array)
  if (a === b) return true;

  // not strictly equal, so they must both be objects to be equal
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  // at this point, a and b are both objects, they can be:
  // - null (which is of type object in javascript)
  // - arrays
  // - plain objects

  if (a === null || b === null) {
    // one of them is null, so they are unequal
    // (strict equality check failed)

    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    // both are arrays, their values must be deeply equal

    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (!Array.isArray(a) && !Array.isArray(b)) {
    // both are plain objects, their values must be deeply equal

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      // check key exists in b to cover edge cases like
      // a = { x: undefined }
      // b = { y: undefined }
      // a["x"] is undefined because it was explicitly set to undefined
      // b["x"] is undefined because it was never set
      // a["x"] === b["x"] is true
      // but ("x" in b) is false
      // so we must check ("x" in b) to return false

      if (!(key in b) || !isDeepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  // one is an array, the other is a plain object, so they are unequal

  return false;
};

// -------------------------
// Fetch mock (contract-based)
// -------------------------

const mockResponse = (
  body: unknown,
  status: number,
  headers?: Record<string, string>,
) => {
  const json = JSON.stringify(body);
  const isNull = json === "{}";

  return Promise.resolve(
    new Response(isNull ? null : json, {
      status,
      headers: {
        ...(isNull ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
    }),
  );
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
        if (body == null || typeof body !== "string") {
          return;
        }
        try {
          return JSON.parse(body);
        } catch {}
      };

      const parsedBody = parseBody(init?.body);

      // --- From contracts ---
      for (const [_contractName, contract] of Object.entries(contracts)) {
        for (const [_testName, test] of Object.entries(contract)) {
          for (const [_caseName, caseDetails] of Object.entries(test.cases)) {
            if (
              path === (caseDetails.specialPath ?? test.path) &&
              method === test.method
            ) {
              if (isDeepEqual(parsedBody, caseDetails.request.body)) {
                return mockResponse(
                  caseDetails.response.body,
                  caseDetails.response.status,
                  caseDetails.response.headers,
                );
              }
            }
          }
        }
      }

      if (path === "/api/404") {
        return mockResponse(null, 404);
      }

      if (path === "/api/500") {
        return mockResponse(null, 500);
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
        <MeProvider initialUser={me}>
          <DataRefreshProvider>
            <Component />
          </DataRefreshProvider>
        </MeProvider>
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
}: {
  forceCases?: Record<`${string}.${string}`, keyof Test["cases"]>;
} = {}) => {
  vi.stubGlobal("cookieStore", { get: vi.fn(), set: vi.fn() });
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => mockedRandomUUID);

  const customFetch = (path: string, method: string) => {
    if (forceCases) {
      for (const [key, caseName] of Object.entries(forceCases)) {
        const [contractName, testName] = key.split(".");
        if (contractName in contracts && testName in contracts[contractName]) {
          const test = contracts[contractName][testName];
          const caseDetails = test.cases[caseName];
          if (
            caseDetails &&
            path === (caseDetails.specialPath ?? test.path) &&
            method === test.method
          ) {
            return mockResponse(
              caseDetails.response.body,
              caseDetails.response.status,
              caseDetails.response.headers,
            );
          }
        }
      }
    }
  };

  mockFetch(customFetch);

  forget("*");
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
  const caseDetails = test.cases[caseName];

  const headers: Record<string, string> = {
    ...caseDetails.request.headers,
  };

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
  if (caseDetails.request.body) {
    headers["Content-Type"] = "application/json";
  }

  const init = {
    ...(test.method !== "get" ? { method: test.method } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    ...(caseDetails.request.body
      ? { body: JSON.stringify(caseDetails.request.body) }
      : {}),
    ...(caseDetails.request.attach ? { body: expect.any(FormData) } : {}),
  };

  const fetchArgs: Parameters<typeof globalThis.fetch> = [
    caseDetails.specialPath ?? test.path,
  ];

  if (Object.keys(init).length > 0) {
    fetchArgs.push(init);
  }

  expect(globalThis.fetch).toHaveBeenCalledWith(...fetchArgs);
};
