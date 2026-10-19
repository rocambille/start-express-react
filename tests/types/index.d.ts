type Case = {
  only?: boolean;
  // Optional path override (useful for IDs)
  specialPath?: string;
  request: {
    body?: JsonObject;
    headers?: Record<string, string>;
    attach?: {
      name: string;
      file: Buffer | string;
      options?: { filename?: string; contentType?: string } | string;
    };
    // Mocked JWT payload to simulate different users
    jwtPayload?: { sub: User["id"] | string } | null;
    // Explicitly bypass CSRF to test protection
    withoutCsrfProtection?: boolean;
  };
  response: {
    status: number;
    body?: JsonObject | JsonArray;
    headers?: Record<string, string>;
    // Optional hook to add supertest assertions to the request before it
    // is sent, e.g. (test) => test.expect(cookies.set({ name: "x" })):
    // supertest runs them on the response, and fails the case if one fails
    and?: (test: import("supertest").Test) => void;
  };
};

type Test = {
  method: "get" | "post" | "put" | "delete";
  path: string;
  cases: Record<string, Case>;
};

type Contract = Record<string, Test>;
