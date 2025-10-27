import { useAuth } from "./AuthContext";

import LoginRegisterForm from "./LoginRegisterForm";
import LogoutForm from "./LogoutForm";

function AuthForm() {
  const auth = useAuth();

  return auth.check() ? <LogoutForm /> : <LoginRegisterForm />;
}

export default AuthForm;
