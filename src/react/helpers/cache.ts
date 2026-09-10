/*
  Purpose:
  Provide a minimal cache layer and targeted reactivity compatible with React `use`.

  Design notes:
  - Promises must be cached, not resolved values.
  - React `use` relies on Promise identity to suspend correctly.
  - refresh(paths) evicts stale promises and notifies subscribed components.
  - useRefresh(paths) subscribes a component to updates for those path(s).
*/

import { useEffect, useState } from "react";

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
  - Subsequent calls reuse the same Promise unless `refresh` is called

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

  // In browser, check the cache for an existing Promise
  if (typeof window !== "undefined") {
    const cachedPromise = promisesByUrl.get(cacheKey);
    if (cachedPromise) return cachedPromise as Promise<T>;
  }

  // Fetch new data
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

  // In browser, cache the Promise
  if (typeof window !== "undefined") {
    promisesByUrl.set(cacheKey, promise);
  }

  return promise;
};

/* ************************************************************************ */
/* Reactivity & Invalidation                                                */
/* ************************************************************************ */

type Listener = () => void;

type Subscription = {
  paths: string[];
  callback: Listener;
};

const subscriptions = new Set<Subscription>();

/*
  subscribe(paths, callback):
  - Registers a listener to be notified when `paths` are refreshed
  - Returns an unregister function
*/
export const subscribe = (paths: string | string[], callback: Listener) => {
  const newSubscription: Subscription = {
    paths: Array.isArray(paths) ? paths : [paths],
    callback,
  };

  subscriptions.add(newSubscription);

  return () => {
    subscriptions.delete(newSubscription);
  };
};

/*
  refresh(paths?):
  - Evicts cached promises matching path prefix(es)
  - Notifies active subscribers watching matching paths
  - Works for both plain URL keys and URL\0headers keys because \0 is
    not a valid URL character, so prefix matching on the URL still holds
*/
export const refresh = (paths: string | string[] = "*") => {
  const pathList = Array.isArray(paths) ? paths : [paths];
  const isWildcard = pathList.includes("*") || pathList.length === 0;

  // 1. Evict stale entries from cache
  if (isWildcard) {
    promisesByUrl.clear();
  } else {
    promisesByUrl.forEach((_, url) => {
      if (pathList.some((path) => url.startsWith(path))) {
        promisesByUrl.delete(url);
      }
    });
  }

  // 2. Notify matching subscribers
  for (const subscription of subscriptions) {
    if (
      isWildcard ||
      subscription.paths.includes("*") ||
      subscription.paths.some((subPath) =>
        pathList.some(
          (path) => path.startsWith(subPath) || subPath.startsWith(path),
        ),
      )
    ) {
      subscription.callback();
    }
  }
};

/*
  useRefresh(paths?):
  - Subscribes the caller to refresh notifications for `paths` (defaulting to "*")
*/
export const useRefresh = (paths: string | string[] = "*"): void => {
  const [, setRefreshCounter] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe(paths, () => {
      setRefreshCounter((counter) => counter + 1);
    });

    return unsubscribe;
  }, [paths]);
};
