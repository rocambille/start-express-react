import { useId } from "react";

import { useAuth } from "../contexts/AuthContext";

function LoginRegisterForm() {
  const { login, register } = useAuth();

  const emailId = useId();
  const passwordId = useId();

  return (
    <form
      action={(formData) => {
        const email = formData.get("email") as string;

        const password = formData.get("password") as string;

        if (formData.get("register") != null) {
          register({ email, password });
        } else {
          login({ email, password });
        }
      }}
    >
      <p>
        <label htmlFor={emailId}>email</label>
        <input id={emailId} type="email" name="email" defaultValue="" />
      </p>

      <p>
        <label htmlFor={passwordId}>password</label>
        <input
          id={passwordId}
          type="password"
          name="password"
          defaultValue=""
        />
      </p>

      <p>
        <button type="submit" name="register" className="secondary">
          Créer mon compte
        </button>
        <button type="submit" name="login">
          Me connecter
        </button>
      </p>
    </form>
  );
}

export default LoginRegisterForm;
