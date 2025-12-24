/*
  Purpose:
  Provide low-level client utilities shared across the application.

  This file intentionally contains:
  - A minimal cache layer compatible with React `use`
  - A CSRF token helper designed for stateless servers

  Design notes:
  - No external dependencies
  - Explicit behavior over abstraction
  - Made to audit and reason about

  Related docs:
  - https://react.dev/reference/react/use
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
  - https://github.com/Psifi-Solutions/csrf-csrf/blob/main/FAQ.md
*/

/* ************************************************************************ */
/* Cache                                                                    */
/* ************************************************************************ */

/*
  In-memory cache used by React `use`.

  Key points:
  - Values stored are Promises, not resolved data
  - This is required for Suspense-compatible data fetching
  - Cache lifetime matches the page lifetime
*/
const cacheData = new Map<string, ReturnType<typeof Response.prototype.json>>();

/*
  cache(url):
  - Returns a cached Promise for the given URL
  - Fetch is triggered only once per URL
  - Subsequent calls reuse the same Promise
*/
export const cache = (url: string) => {
  if (!cacheData.has(url)) {
    /*
      Important:
      Promises must be cached, not resolved values.
      React `use` relies on Promise identity to suspend correctly.
    */
    cacheData.set(
      url,
      fetch(url).then((response) => response.json()),
    );
  }

  // biome-ignore lint/style/noNonNullAssertion: cacheData is set before get
  return cacheData.get(url)!;
};

/*
  invalidateCache(basePath):
  - Removes all cached entries matching a path prefix
  - Used after mutations to force refetch on next render
*/
export const invalidateCache = (basePath: string) => {
  cacheData.forEach((_value, key) => {
    if (key.startsWith(basePath)) {
      cacheData.delete(key);
    }
  });
};

/* ************************************************************************ */
/* CSRF Token                                                               */
/* ************************************************************************ */

/*
  CSRF token strategy:

  Goal:
  - Mimic session-cookie behavior in a stateless server environment
  - Token stays valid while actively used
  - Token expires shortly after inactivity

  Rationale:
  - No server-side session storage
  - Explicit expiration is required
  - Renewal happens transparently on usage
*/

/*
  Token lifetime:
  - 30 seconds
  - Renewed on each call
*/
const csrfTokenExpiresIn = 30 * 1000;

/*
  Local expiration timestamp:
  - Shared across calls
  - Drives token regeneration
*/
let expires = Date.now();

/*
  csrfToken():
  - Returns a valid CSRF token
  - Renews or regenerates it if needed
  - Persists it in a secure cookie
*/
export const csrfToken = async () => {
  const getToken = async () => {
    /*
      If the token expired:
      - Generate a new one
    */
    if (Date.now() > expires) {
      return crypto.randomUUID();
    }

    /*
      Otherwise:
      - Reuse the existing cookie value if present
      - Fallback to a new token if missing
    */
    return (
      (await cookieStore.get("__Host-x-csrf-token"))?.value ??
      crypto.randomUUID()
    );
  };

  const token = await getToken();

  /*
    Renew expiration on each access:
    - Keeps token alive while the app is active
  */
  expires = Date.now() + csrfTokenExpiresIn;

  /*
    Persist token in a host-only, same-site cookie
    - Path "/" ensures availability across the app
    - SameSite strict prevents cross-site usage
  */
  await cookieStore.set({
    name: "__Host-x-csrf-token",
    value: token,
    path: "/",
    sameSite: "strict",
    expires,
  });

  return token;
};
