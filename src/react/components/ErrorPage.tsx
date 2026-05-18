/**
 * Purpose:
 * Root error boundary for the application.
 *
 * Responsibilities:
 * - Catch and display routing errors (404)
 * - Catch and display application crashes (500)
 * - Provide a way back to the home page
 */

import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();

  let title = "Oops!";
  let message = "An unexpected error has occurred.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "404 - Page Not Found";
      message =
        "The page you are looking for does not exist or has been moved.";
    } else if (error.status === 401) {
      title = "401 - Unauthorized";
      message = "You must be logged in to access this page.";
    } else if (error.status === 503) {
      title = "503 - Service Unavailable";
      message = "The server is temporarily overloaded. Please try again later.";
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

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
