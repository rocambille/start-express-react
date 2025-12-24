/*
  Purpose:
  Act as the authentication switch for the UI.

  This component:
  - Reads authentication state from AuthContext
  - Chooses which form to render based on that state
  - Contains no business logic and no side effects
*/

import { useAuth } from "./AuthContext";

import LoginRegisterForm from "./LoginRegisterForm";
import LogoutForm from "./LogoutForm";

function AuthForm() {
  const auth = useAuth();

  /*
    Rendering flow:

    - If the user is authenticated, show the logout action
    - Otherwise, show the login / registration form
  */
  return auth.check() ? <LogoutForm /> : <LoginRegisterForm />;
}

export default AuthForm;
