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

const csrfTokenExpiresIn = 30 * 1000; // 30s, renewable
let expires = Date.now();

export const csrfToken = async () => {
  const getToken = async () => {
    if (Date.now() > expires) {
      return crypto.randomUUID();
    } else {
      return (
        (await cookieStore.get("__Host-x-csrf-token"))?.value ??
        crypto.randomUUID()
      );
    }
  };

  const token = await getToken();

  expires = Date.now() + csrfTokenExpiresIn;

  await cookieStore.set({
    expires,
    name: "__Host-x-csrf-token",
    path: "/",
    sameSite: "strict",
    value: token,
  });

  return token;
};
