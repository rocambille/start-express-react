import { useAuth } from "./AuthContext";

import LoginRegisterForm from "./LoginRegisterForm";
import LogoutForm from "./LogoutForm";

function AuthForm() {
  const auth = useAuth();

  return auth.user == null ? <LoginRegisterForm /> : <LogoutForm />;
}

export default AuthForm;
