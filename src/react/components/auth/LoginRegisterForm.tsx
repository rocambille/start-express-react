/*
  Purpose:
  Provide a minimal authentication form handling both login and registration.

  Design notes:
  - Collects user credentials
  - Delegates all business logic to AuthContext
  - Uses native form actions instead of controlled inputs

  Related docs:
  - https://react.dev/reference/react-dom/components/form
  - https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
*/

import { useAuth } from "./AuthContext";

function LoginRegisterForm() {
  /*
    Single form handling two intents:
    - login
    - register

    The intent is inferred from the submit button used
  */
  const { login, register } = useAuth();

  return (
    <form
      action={(formData) => {
        /*
          Form submission flow:

          1. Read raw values from FormData
          2. Perform minimal synchronous validation
          3. Trigger side effects according to the intent
        */

        const email = formData.get("email")?.toString() ?? "";
        const password = formData.get("password")?.toString() ?? "";

        /*
          Client-side validation can be done here for better UX.
          The API remains the source of truth for data integrity.

          Real-world projects should:
          - validate format
          - check password strength
          - handle client-side error messages
        */

        /*
          The presence of a submit button name determines the intent.
          This avoids conditional UI or multiple forms.
        */
        if (formData.get("register") != null) {
          const confirmPassword =
            formData.get("confirmPassword")?.toString() ?? "";

          register({ email, password, confirmPassword });
        } else {
          login({ email, password });
        }
      }}
      /*
        Minimal grid layout:
        - keeps markup readable
        - avoids CSS complexity
      */
      style={{ display: "grid", gridTemplateColumns: "1fr auto" }}
    >
      {/* Email is shared by both login and registration */}
      <input
        aria-label="Email"
        type="email"
        name="email"
        defaultValue=""
        placeholder="jdoe@mail.com"
        style={{ gridColumn: "1 / -1" }}
      />

      {/* Password field */}
      <input
        aria-label="Password"
        type="password"
        name="password"
        defaultValue=""
        placeholder="password"
        style={{ borderStartEndRadius: 0, borderEndEndRadius: 0 }}
      />

      {/* Login action */}
      <button
        type="submit"
        name="login"
        data-testid="login"
        style={{ borderStartStartRadius: 0, borderEndStartRadius: 0 }}
      >
        Log in
      </button>

      {/* Password confirmation */}
      <input
        aria-label="Confirm password"
        type="password"
        name="confirmPassword"
        defaultValue=""
        placeholder="confirm password"
        style={{ borderStartEndRadius: 0, borderEndEndRadius: 0 }}
      />

      {/* Registration action */}
      <button
        type="submit"
        name="register"
        data-testid="register"
        className="secondary"
        style={{ borderStartStartRadius: 0, borderEndStartRadius: 0 }}
      >
        Register
      </button>
    </form>
  );
}

export default LoginRegisterForm;
