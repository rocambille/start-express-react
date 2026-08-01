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
*/
const promisesByUrl = new Map<string, Promise<Json>>();

/*
  getOrFetch(url):
  - Returns a cached Promise for the given URL
  - Fetch is triggered only once per URL
  - Subsequent calls reuse the same Promise unless `forget` is called for the given base path
*/
export const getOrFetch = <T extends Json>(url: string): Promise<T> => {
  // Try to get a cached Promise

  const cachedPromise = promisesByUrl.get(url);

  if (cachedPromise) {
    return cachedPromise as Promise<T>;
  }

  // Or fetch a new one and cache it

  const promise: Promise<T> = fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  });

  promisesByUrl.set(url, promise);

  return promise;
};

/*
  forget(basePath):
  - Removes all cached entries matching a path prefix
  - Used after mutations to force refetch on next render
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
