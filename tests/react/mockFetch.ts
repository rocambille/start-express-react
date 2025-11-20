const mockFetch = () => {
  globalThis.fetch = vi
    .fn()
    .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (
        input === "/api/me" &&
        (init?.method == null || init?.method.toLowerCase() === "get")
      ) {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 1, email: "foo@mail.com" }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      }

      throw new Error(`Unhandled fetch call to ${input}`);
    });
};

export default mockFetch;
