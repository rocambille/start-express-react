import { useAuth } from "./AuthContext";

function LoginRegisterForm() {
  const { login, register } = useAuth();

  return (
    <form
      action={(formData) => {
        const email = formData.get("email")?.toString() ?? "";
        const password = formData.get("password")?.toString() ?? "";

        // Data should be validated here

        if (formData.get("register") != null) {
          const confirmPassword =
            formData.get("confirmPassword")?.toString() ?? "";

          register({ email, password, confirmPassword });
        } else {
          login({ email, password });
        }
      }}
      style={{ display: "grid", gridTemplateColumns: "1fr auto" }}
    >
      <input
        aria-label="Email"
        type="email"
        name="email"
        defaultValue=""
        placeholder="jdoe@mail.com"
        style={{ gridColumn: "1 / -1" }}
      />

      <input
        aria-label="Password"
        type="password"
        name="password"
        defaultValue=""
        placeholder="password"
        style={{ borderStartEndRadius: 0, borderEndEndRadius: 0 }}
      />

      <button
        type="submit"
        name="login"
        data-testid="login"
        style={{ borderStartStartRadius: 0, borderEndStartRadius: 0 }}
      >
        Me connecter
      </button>

      <input
        aria-label="Confirm password"
        type="password"
        name="confirmPassword"
        defaultValue=""
        placeholder="confirm password"
        style={{ borderStartEndRadius: 0, borderEndEndRadius: 0 }}
      />

      <button
        type="submit"
        name="register"
        data-testid="register"
        className="secondary"
        style={{ borderStartStartRadius: 0, borderEndStartRadius: 0 }}
      >
        Créer mon compte
      </button>
    </form>
  );
}

export default LoginRegisterForm;
