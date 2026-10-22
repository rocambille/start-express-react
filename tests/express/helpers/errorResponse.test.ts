/*
  Purpose:
  Unit tests for the final error handler (src/express/helpers/errorResponse.ts).

  Strategy:
  - A tiny Express app whose routes throw, in production and development
*/

import express from "express";
import { MulterError } from "multer";
import supertest from "supertest";

import { createErrorResponse } from "../../../src/express/helpers/errorResponse";

const appWith = (isProduction: boolean) => {
  const app = express();

  app.get("/server-error", () => {
    throw new Error("connect ECONNREFUSED 127.0.0.1:2525");
  });

  app.get("/client-error", () => {
    throw Object.assign(new Error("Invalid file type: text/plain"), {
      status: 400,
    });
  });

  app.get("/too-large", () => {
    throw new MulterError("LIMIT_FILE_SIZE");
  });

  app.use(createErrorResponse(isProduction));

  return supertest(app);
};

describe("createErrorResponse", () => {
  describe("in production", () => {
    const api = appWith(true);

    it("hides the message of server errors", async () => {
      const response = await api.get("/server-error");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal Server Error" });
    });

    it("keeps the message of client errors, without stack", async () => {
      const response = await api.get("/client-error");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Invalid file type: text/plain",
      });
    });

    it("answers 400 to files over the size limit", async () => {
      const response = await api.get("/too-large");

      expect(response.status).toBe(400);
    });
  });

  describe("in development", () => {
    const api = appWith(false);

    it("shows the message and stack of server errors", async () => {
      const response = await api.get("/server-error");

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        message: "connect ECONNREFUSED 127.0.0.1:2525",
        stack: expect.stringContaining("Error:"),
      });
    });
  });
});
