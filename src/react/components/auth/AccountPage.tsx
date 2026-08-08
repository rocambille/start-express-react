/*
  Purpose:
  Page component responsible for the account settings.

  Design notes:
  - Uses AccountDetailsForm to update user details
  - Uses LogoutForm to log out
  - Uses AccountDeleteForm to delete the account

  Related docs:
  - https://react.dev/reference/react-dom/components/form
*/

import AccountDeleteForm from "./AccountDeleteForm";
import AccountDetailsForm from "./AccountDetailsForm";
import AvatarUploadForm from "./AvatarUploadForm";
import LogoutForm from "./LogoutForm";

function AccountPage() {
  return (
    <>
      <hgroup>
        <h1>Account</h1>
        <p>Manage your personal information here.</p>
      </hgroup>

      <AccountDetailsForm />

      <AvatarUploadForm />

      <LogoutForm />

      <AccountDeleteForm />
    </>
  );
}

export default AccountPage;
