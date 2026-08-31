import { barUser, corruptedUser, fooUser } from "../fixtures/users";

const dummyImageBuffer = Buffer.from(
  "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=",
  "base64",
);

export default (<Contract>{
  read_me: {
    method: "get",
    path: "/api/users/me",
    cases: {
      as_me: {
        request: {
          jwtPayload: { sub: fooUser.id },
        },
        response: {
          status: 200,
          body: fooUser,
        },
      },
      as_user_with_avatar: {
        request: {
          jwtPayload: { sub: barUser.id },
        },
        response: {
          status: 200,
          body: barUser,
        },
      },
      corrupted_avatar_url: {
        request: { jwtPayload: { sub: corruptedUser.id } },
        response: { status: 401, body: {} },
      },
      unauthorized: {
        request: {},
        response: { status: 401, body: {} },
      },
      invalid_user_id: {
        request: { jwtPayload: { sub: NaN } },
        response: { status: 401, body: {} },
      },
    },
  },
  edit_me: {
    method: "put",
    path: "/api/users/me",
    cases: {
      as_me: {
        request: {
          body: { email: "updated@mail.com", name: "updated" },
          jwtPayload: { sub: fooUser.id },
        },
        response: { status: 204, body: {} },
      },
    },
  },
  delete_me: {
    method: "delete",
    path: "/api/users/me",
    cases: {
      as_me: {
        request: { jwtPayload: { sub: fooUser.id } },
        response: { status: 204, body: {} },
      },
      unauthorized: {
        request: { jwtPayload: null },
        response: { status: 401, body: {} },
      },
    },
  },
  upload_me_avatar: {
    method: "post",
    path: "/api/users/me/avatar",
    cases: {
      as_me: {
        request: {
          jwtPayload: { sub: fooUser.id },
          attach: {
            name: "avatar",
            file: dummyImageBuffer,
            options: { filename: "avatar.webp", contentType: "image/webp" },
          },
        },
        response: {
          status: 201,
          body: {
            avatar_url: expect.stringMatching(/^\/uploads\/avatars\/.*\.webp$/),
          },
        },
      },
      invalid_file_type: {
        request: {
          jwtPayload: { sub: fooUser.id },
          attach: {
            name: "avatar",
            file: Buffer.from("plain text"),
            options: { filename: "doc.txt", contentType: "text/plain" },
          },
        },
        response: {
          status: 400,
          body: { message: expect.stringMatching(/Invalid file type/i) },
        },
      },
      no_attached_file: {
        request: { jwtPayload: { sub: fooUser.id } },
        response: {
          status: 400,
          body: { message: expect.stringMatching(/No file attached/i) },
        },
      },
      unauthorized: {
        request: { jwtPayload: null },
        response: { status: 401, body: {} },
      },
    },
  },
  delete_me_avatar: {
    method: "delete",
    path: "/api/users/me/avatar",
    cases: {
      as_me: {
        request: { jwtPayload: { sub: fooUser.id } },
        response: { status: 204, body: {} },
      },
      unauthorized: {
        request: { jwtPayload: null },
        response: { status: 401, body: {} },
      },
    },
  },
});
