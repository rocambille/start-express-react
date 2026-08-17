/*
  Purpose:
  Provide a minimal cache layer compatible with React `use`.

  Design notes:
  - Promises must be cached, not resolved values.
  - React `use` relies on Promise identity to suspend correctly.
*/

/* ************************************************************************ */
/* Cache                                                                    */
/* ************************************************************************ */

/*
  In-memory cache compatible with React `use`.

  Notes:
  - Stores Promises, not resolved values
  - React `use` relies on Promise identity for correct suspension
  - Cache key includes serialised request headers when provided, so that
    different Range headers on the same URL produce separate cache entries
*/
const promisesByUrl = new Map<string, Promise<unknown>>();

/*
  getOrFetch(url, options?):
  - Returns a cached Promise for the given URL (+ headers if any)
  - Fetch is triggered only once per cache key
  - Subsequent calls reuse the same Promise unless `forget` is called

  options.parse — custom response parser; defaults to response.json()
  options.headers — request headers forwarded to fetch (e.g. Range)

  Note: the cache key is url + serialised headers. The same URL must always
  be called with the same parse function to avoid shape mismatches on cache hits.
*/
export const getOrFetch = <T>(
  url: string,
  options?: {
    parse?: (response: Response) => Promise<T>;
    headers?: Record<string, string>;
  },
): Promise<T> => {
  // Null byte (\0) is never valid in a URL — safe as a separator
  const cacheKey = options?.headers
    ? `${url}\0${JSON.stringify(options.headers)}`
    : url;

  // Try to get a cached Promise
  const cachedPromise = promisesByUrl.get(cacheKey);

  if (cachedPromise) {
    return cachedPromise as Promise<T>;
  }

  // Or fetch a new one and cache it

  const parse: NonNullable<NonNullable<typeof options>["parse"]> =
    options?.parse ?? ((response: Response) => response.json());

  const promise: Promise<T> = (
    options?.headers ? fetch(url, { headers: options.headers }) : fetch(url)
  ).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return parse(response);
  });

  promisesByUrl.set(cacheKey, promise);

  return promise;
};

/*
  forget(basePath):
  - Removes all cached entries matching a path prefix
  - Used after mutations to force refetch on next render
  - Works for both plain URL keys and URL\0headers keys because \0 is
    not a valid URL character, so prefix matching on the URL still holds
*/
export const forget = (basePath: string) => {
  if (basePath === "*") {
    promisesByUrl.clear();
    return;
  }

  promisesByUrl.forEach((_, url) => {
    if (url.startsWith(basePath)) {
      promisesByUrl.delete(url);
    }
  });
};

/* ************************************************************************ */
/* Helpers                                                                  */
/* ************************************************************************ */

/*
  parseContentRangeTotal(header):
  - Extracts the total count from a Content-Range response header
  - "items 0-9/42" → 42
  - Returns 0 if the header is absent or malformed
*/
export const parseContentRangeTotal = (header: string | null): number => {
  const match = /\/(\d+)$/.exec(header ?? "");
  return match ? Number(match[1]) : 0;
};
