/*
  Purpose:
  Provide a CSRF token helper designed for stateless servers and 
  a mutative fetch wrapper.

  Related docs:
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
*/

import { useRefresh } from "../components/DataRefreshContext";
import { forget } from "./cache";

/* ************************************************************************ */
/* CSRF Token                                                               */
/* ************************************************************************ */

const csrfTokenExpiresIn = 30 * 1000;
let csrfTokenExpiresAt = Date.now();

/*
  csrfToken():
  - Returns a valid CSRF token
  - Renews or regenerates it if needed
  - Persists it in a secure cookie
*/
export const csrfToken = async () => {
  const getToken = async () => {
    // Return a new token if expiration date is reached
    if (Date.now() > csrfTokenExpiresAt) {
      return crypto.randomUUID();
    }

    // Get the stored token if it exists
    const token = (await cookieStore.get("__Host-x-csrf-token"))?.value;

    // Return a new token if not found in cookies
    if (token == null) {
      return crypto.randomUUID();
    }

    // Return the stored unexpired token otherwise
    return token;
  };

  const token = await getToken();

  // Update the expiration date for the token
  csrfTokenExpiresAt = Date.now() + csrfTokenExpiresIn;

  // Set/update the token in a secure cookie
  await cookieStore.set({
    name: "__Host-x-csrf-token",
    value: token,
    path: "/",
    sameSite: "strict",
    expires: csrfTokenExpiresAt,
  });

  return token;
};

/* ************************************************************************ */
/* API Mutation                                                             */
/* ************************************************************************ */

/*
  apiMutate(url, method, body):
  - Performs a mutative fetch (POST, PUT, DELETE)
  - Automatically attaches CSRF token
  - Returns the Response for status checking
*/
export const apiMutate = async (
  url: string,
  method: "post" | "put" | "delete",
  body?: unknown,
) => {
  const headers: Record<string, string> = {
    "X-CSRF-Token": await csrfToken(),
  };

  const init: RequestInit = { method, headers };

  if (body != null) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response;
};

/* ************************************************************************ */
/* Hooks                                                                    */
/* ************************************************************************ */

/*
  useMutate():
  - Returns a function that performs a mutation and refreshes the UI
  - Combines apiMutate() + forget() + refresh()
  - Keeps components declarative

  Usage:
    const mutate = useMutate();
    await mutate("/api/items/1", "put", { title: "New" }, ["/api/items"]);
*/
export function useMutate() {
  const { refresh } = useRefresh();

  return async (
    url: string,
    method: "post" | "put" | "delete",
    body?: unknown,
    pathsToForget: string[] = [],
  ) => {
    const response = await apiMutate(url, method, body);

    for (const path of pathsToForget) {
      forget(path);
    }
    refresh();

    return response;
  };
}
