const cacheData = new Map();

export const cache = (url: string) => {
  if (!cacheData.has(url)) {
    // Promises should be cached for React `use` to work

    cacheData.set(
      url,
      fetch(url).then((response) => response.json()),
    );
  }

  return cacheData.get(url);
};

export const invalidateCache = (basePath: string) => {
  cacheData.forEach((_value, key: string) => {
    if (key.startsWith(basePath)) {
      cacheData.delete(key);
    }
  });
};
