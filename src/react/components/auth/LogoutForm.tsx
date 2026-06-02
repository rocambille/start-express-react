/*
  Purpose:
  Minimal form component responsible for triggering logout.

  Design notes:
  - Use a native <form> to keep semantics explicit
  - Delegates all side effects to the useAuth hook

  Related docs:
  - https://react.dev/reference/react-dom/components/form
*/

import { useAuth } from "./AuthContext";

function LogoutForm() {
  const { logout } = useAuth();

  return (
    <form action={logout}>
      <hgroup>
        <h2>Log out</h2>
        <p>You will be logged out of your account.</p>
      </hgroup>

      <button className="secondary" type="submit">
        Log out
      </button>
    </form>
  );
}

export default LogoutForm;
