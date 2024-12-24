const cache = new Map();

export const fetchData = (url: string) => {
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
