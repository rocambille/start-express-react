type Case = {
  only?: boolean;
  // Optional path override (useful for IDs)
  specialPath?: string;
  request: {
    body?: JsonObject;
    // Mocked JWT payload to simulate different users
    jwtPayload?: { sub: RowId | string } | null;
    // Explicitly bypass CSRF to test protection
    withoutCsrfProtection?: boolean;
  };
  response: {
    status: number;
    body?: JsonObject | JsonArray;
    // Optional hook to run extra assertions on the response
    and?: (response: { headers: { [key: string]: string } }) => void;
  };
};

type Test = {
  method: "get" | "post" | "put" | "delete";
  path: string;
  cases: Record<string, Case>;
};

type Contract = Record<string, Test>;
