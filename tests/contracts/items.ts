import { allItems } from "../fixtures/items";
import { barUser, fooUser } from "../fixtures/users";

export default (<Contract>{
  browse: {
    method: "get",
    path: "/api/items",
    cases: {
      success: {
        request: { headers: { Range: "items=0-9" } },
        response: {
          status: 206,
          body: allItems,
          headers: {
            "content-range": `items 0-${allItems.length - 1}/${allItems.length}`,
          },
        },
      },
      no_range: {
        request: {},
        response: { status: 400, body: {} },
      },
      out_of_range: {
        specialPath: "/api/items",
        request: { headers: { Range: "items=9999-9999" } },
        response: {
          status: 416,
          body: {},
          headers: { "content-range": `items */${allItems.length}` },
        },
      },
    },
  },
  create: {
    method: "post",
    path: "/api/items",
    cases: {
      success: {
        request: {
          body: { title: "new title" },
          jwtPayload: { sub: fooUser.id },
        },
        response: { status: 201, body: { insertId: expect.any(Number) } },
      },
      bad_request: {
        request: { body: {}, jwtPayload: { sub: fooUser.id } },
        response: { status: 400, body: expect.any(Array) },
      },
      unauthorized: {
        request: { body: { title: "new title" }, jwtPayload: null },
        response: { status: 401, body: {} },
      },
    },
  },
  delete: {
    method: "delete",
    path: `/api/items/${allItems[0].id}`,
    cases: {
      success: {
        request: { jwtPayload: { sub: fooUser.id } },
        response: { status: 204, body: {} },
      },
      unauthorized: {
        request: { jwtPayload: null },
        response: { status: 401, body: {} },
      },
      forbidden: {
        request: { jwtPayload: { sub: barUser.id } },
        response: { status: 403, body: {} },
      },
      not_found: {
        specialPath: `/api/items/${NaN}`,
        request: { jwtPayload: { sub: fooUser.id } },
        response: { status: 204, body: {} },
      },
    },
  },
  edit: {
    method: "put",
    path: `/api/items/${allItems[0].id}`,
    cases: {
      success: {
        request: {
          body: { title: "updated title" },
          jwtPayload: { sub: allItems[0].user_id },
        },
        response: { status: 204, body: {} },
      },
      forbidden: {
        request: {
          body: { title: "updated title" },
          jwtPayload: { sub: barUser.id },
        },
        response: { status: 403, body: {} },
      },
      not_found: {
        specialPath: `/api/items/${NaN}`,
        request: {
          body: { title: "updated title" },
          jwtPayload: { sub: fooUser.id },
        },
        response: { status: 404, body: {} },
      },
    },
  },
  read: {
    method: "get",
    path: `/api/items/${allItems[0].id}`,
    cases: {
      success: {
        request: {},
        response: { status: 200, body: allItems[0] },
      },
      not_found: {
        specialPath: `/api/items/${NaN}`,
        request: {},
        response: { status: 404, body: {} },
      },
    },
  },
});
