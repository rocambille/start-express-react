import { useAuth } from "./AuthContext";

function LoginRegisterForm() {
  const { login, register } = useAuth();

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
      style={{ display: "grid", gridTemplateColumns: "1fr auto" }}
    >
      <input
        aria-label="Email"
        type="email"
        name="email"
        defaultValue=""
        placeholder="jdoe@mail.com"
        style={{ borderStartEndRadius: 0, borderEndEndRadius: 0 }}
      />

      <input
        aria-label="Password"
        type="password"
        name="password"
        defaultValue=""
        placeholder="******"
        style={{ borderStartEndRadius: 0, borderEndEndRadius: 0 }}
      />

      <button
        type="submit"
        name="login"
        style={{ borderStartStartRadius: 0, borderEndStartRadius: 0 }}
      >
        Me connecter
      </button>

      <button
        type="submit"
        name="register"
        className="secondary"
        style={{
          borderStartStartRadius: 0,
          borderEndStartRadius: 0,
          gridRow: 1,
          gridColumn: 2,
        }}
      >
        Créer mon compte
      </button>
    </form>
  );
}

export default LoginRegisterForm;
