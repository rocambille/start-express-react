/**
 * Purpose:
 * Root error boundary for the application.
 *
 * Responsibilities:
 * - Catch and display errors
 * - Provide a way back to the home page
 */

import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { HttpError } from "../../errors/HttpError";

const getTitleAndMessage = (error: unknown): [string, string] => {
  if (isRouteErrorResponse(error)) {
    return [String(error.status), String(error.data)];
  }

  if (error instanceof HttpError) {
    return [String(error.status), error.message];
  }

  if (error instanceof Error) {
    return ["Oops!", error.message];
  }

  return ["Oops!", "An unexpected error has occurred."];
};

export default function ErrorPage() {
  const [title, message] = getTitleAndMessage(useRouteError());

  return (
    <main
      className="container"
      style={{ textAlign: "center", padding: "4rem 0" }}
    >
      <hgroup>
        <h1>{title}</h1>
        <p>{message}</p>
      </hgroup>
      <p>
        <Link to="/">Back to Home</Link>
      </p>
    </main>
  );
}
