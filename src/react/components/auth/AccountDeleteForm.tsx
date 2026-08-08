/*
  Purpose:
  Minimal form component responsible for triggering account deletion.

  Design notes:
  - Use a native <form> to keep semantics explicit
  - Delegates all side effects to the useMe hook

  Related docs:
  - https://react.dev/reference/react-dom/components/form
*/

import { useMe } from "./MeContext";

function AccountDeleteForm() {
  const { deleteMe } = useMe();

  return (
    <form
      action={() => {
        if (confirm("Are you sure you want to delete your account?")) {
          deleteMe();
        }
      }}
    >
      <hgroup>
        <h2>Account deletion</h2>
        <p>
          You can ask an admin to restore it later. You can ask for a permanent
          deletion if you wish. In any case, your account will be deleted and
          you will no longer be able to log in.
        </p>
      </hgroup>

      <button className="contrast" type="submit">
        Delete my account
      </button>
    </form>
  );
}

export default AccountDeleteForm;
