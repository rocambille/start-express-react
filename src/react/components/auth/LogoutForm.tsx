/*
  Purpose:
  Minimal form component responsible for triggering logout.

  Design notes:
  - Use a native <form> to keep semantics explicit
  - Delegates all side effects to the useMe hook

  Related docs:
  - https://react.dev/reference/react-dom/components/form
*/

import { useMe } from "./MeContext";

function LogoutForm() {
  const { logout } = useMe();

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
