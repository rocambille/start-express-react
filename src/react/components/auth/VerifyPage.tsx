/*
  Purpose:
  Verify a Magic Link token from the URL and establish the user session.

  Route: /verify?token=...
  - Reads the token from the query string
  - Calls verifyMagicLink from MeContext
  - Redirects to Dashboard on success
  - Shows an error message on failure
*/

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMe } from "./MeContext";

function VerifyPage() {
  const [searchParams] = useSearchParams();
  const { verifyMagicLink } = useMe();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError(true);
        return;
      }

      try {
        await verifyMagicLink(token);
        navigate("/", { replace: true });
      } catch {
        setError(true);
      }
    };
    verify();
  }, [token, verifyMagicLink, navigate]);

  if (error) {
    return (
      <article>
        <header>Invalid or expired link</header>
        <p>
          This login link is no longer valid. It may have expired or already
          been used.
        </p>
        <Link to="/">Request a new link</Link>
      </article>
    );
  }

  return <p aria-busy="true">Verification in progress...</p>;
}

export default VerifyPage;
