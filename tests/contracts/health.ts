export default (<Contract>{
  get: {
    method: "get",
    path: "/api/health",
    cases: {
      success: {
        request: {},
        response: { status: 200, body: { hello: "world" } },
      },
    },
  },
  post: {
    method: "post",
    path: "/api/health",
    cases: {
      success: {
        request: { body: { hello: "world" } },
        response: { status: 200, body: { hello: "world" } },
      },
      unauthorized: {
        request: { body: { hello: "world" }, withoutCsrfProtection: true },
        response: { status: 401, body: {} },
      },
    },
  },
  delete: {
    method: "delete",
    path: "/api/health",
    cases: {
      success: {
        request: {},
        response: { status: 204, body: {} },
      },
      unauthorized: {
        request: { withoutCsrfProtection: true },
        response: { status: 401, body: {} },
      },
    },
  },
});
