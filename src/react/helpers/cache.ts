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
  In-memory cache used by React `use`.
*/
const cacheData = new Map<string, Promise<Json>>();

/*
  getOrFetch(url):
  - Returns a cached Promise for the given URL
  - Fetch is triggered only once per URL
  - Subsequent calls reuse the same Promise
*/
export const getOrFetch = <T extends Json>(url: string): Promise<T> => {
  if (!cacheData.has(url)) {
    cacheData.set(
      url,
      fetch(url).then<T>((response) => {
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        return response.json();
      }),
    );
  }

  return cacheData.get(url) as Promise<T>;
};

/*
  forget(basePath):
  - Removes all cached entries matching a path prefix
  - Used after mutations to force refetch on next render
*/
export const forget = (basePath: string) => {
  if (basePath === "*") {
    cacheData.clear();
    return;
  }

  cacheData.forEach((_value, key) => {
    if (key.startsWith(basePath)) {
      cacheData.delete(key);
    }
  });
};
