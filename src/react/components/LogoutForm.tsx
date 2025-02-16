import { useAuth } from "./AuthContext";

function LogoutForm() {
  const { logout } = useAuth();

  return (
    <form action={logout}>
      <button type="submit">Me déconnecter</button>
    </form>
  );
}

export default LogoutForm;
