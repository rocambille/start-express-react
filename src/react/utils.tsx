import { Suspense } from "react";
import type { ComponentType, ReactNode } from "react";

const cache = new Map();

export const get = (url: string) => {
  if (!cache.has(url)) {
    // Promises should be cached for React `use` to work

    cache.set(
      url,
      fetch(url).then((response) => response.json()),
    );
  }

  return cache.get(url);
};

export const invalidateCache = (basePath: string) => {
  cache.forEach((_value, key: string) => {
    if (key.startsWith(basePath)) {
      cache.delete(key);
    }
  });
};

export const withSuspense =
  (Suspendable: ComponentType, fallback: ReactNode = <p>loading...</p>) =>
  () => (
    <Suspense fallback={fallback}>
      <Suspendable />
    </Suspense>
  );
