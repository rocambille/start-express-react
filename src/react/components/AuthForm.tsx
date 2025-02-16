import { useAuth } from "./AuthContext";

import LoginRegisterForm from "./LoginRegisterForm";
import LogoutForm from "./LogoutForm";

function AuthForm() {
  const { user } = useAuth();

  return user == null ? <LoginRegisterForm /> : <LogoutForm />;
}

export default AuthForm;
