import { allUsers, barUser, deletedUser, fooUser } from "../fixtures/users";

export default (<Contract>{
  browse: {
    method: "get",
    path: "/api/users",
    cases: {
      success: {
        request: {},
        response: {
          status: 200,
          body: allUsers.filter((user) => user.id !== deletedUser.id),
        },
      },
    },
  },
  delete: {
    method: "delete",
    path: `/api/users/${fooUser.id}`,
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
        specialPath: `/api/users/${NaN}`,
        request: { jwtPayload: { sub: fooUser.id } },
        response: { status: 204, body: {} },
      },
    },
  },
  edit: {
    method: "put",
    path: `/api/users/${fooUser.id}`,
    cases: {
      success: {
        request: {
          body: { email: "updated@mail.com", name: "updated" },
          jwtPayload: { sub: fooUser.id },
        },
        response: { status: 204, body: {} },
      },
      forbidden: {
        request: {
          body: { email: "updated@mail.com", name: "updated" },
          jwtPayload: { sub: barUser.id },
        },
        response: { status: 403, body: {} },
      },
      not_found: {
        specialPath: `/api/users/${NaN}`,
        request: {
          body: { email: "updated@mail.com", name: "updated" },
          jwtPayload: { sub: fooUser.id },
        },
        response: { status: 404, body: {} },
      },
    },
  },
  read: {
    method: "get",
    path: `/api/users/${fooUser.id}`,
    cases: {
      success: {
        request: {},
        response: { status: 200, body: fooUser },
      },
      not_found: {
        specialPath: `/api/users/${NaN}`,
        request: {},
        response: { status: 404, body: {} },
      },
    },
  },
});
