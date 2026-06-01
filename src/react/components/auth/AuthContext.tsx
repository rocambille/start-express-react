/*
  Purpose:
  Centralize authentication state and actions for the React application.

  This context:
  - Stores the currently authenticated user (or null)
  - Exposes high-level auth actions (sendMagicLink, verifyMagicLink, logout)
  - Performs an initial session check on mount (/api/me)

  Usage:
  - Wrap the app with <AuthProvider>
  - Access auth state and actions via the useAuth() hook
*/

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import { HttpError } from "../../../errors/HttpError";
import { apiMutate } from "../../helpers/mutate";

/* ************************************************************************ */
/* Types                                                                    */
/* ************************************************************************ */

type AuthContextType = {
  me: User | null;
  check: () => boolean;
  sendMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

/* ************************************************************************ */
/* Context                                                                  */
/* ************************************************************************ */

const AuthContext = createContext<AuthContextType | null>(null);

/* ************************************************************************ */
/* Provider                                                                 */
/* ************************************************************************ */

export function AuthProvider({
  children,
  initialUser,
}: PropsWithChildren<{ initialUser?: User | null }>) {
  /* ********************************************************************** */
  /* User state                                                             */
  /* ********************************************************************** */

  const [user, setUser] = useState<User | null>(initialUser ?? null);

  /* ********************************************************************** */
  /* Actions                                                                */
  /* ********************************************************************** */

  const sendMagicLink = useCallback(async (email: string) => {
    await apiMutate("/api/auth/magic-link", "post", { email });
  }, []);

  const verifyMagicLink = useCallback(async (token: string) => {
    const response = await apiMutate("/api/auth/verify", "post", { token });

    if (response.ok) {
      const data: User = await response.json();
      setUser(data);
    } else {
      throw new HttpError(
        response.status,
        "Verification of the magic link failed",
      );
    }
  }, []);

  const logout = useCallback(async () => {
    const response = await apiMutate("/api/auth/logout", "post");

    if (response.ok) {
      setUser(null);
    } else {
      throw new HttpError(response.status, "Logout failed");
    }
  }, []);

  /* ********************************************************************** */
  /* Provider value                                                         */
  /* ********************************************************************** */

  return (
    <AuthContext
      value={{
        me: user,
        check: () => user != null,
        sendMagicLink,
        verifyMagicLink,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}

/* ************************************************************************ */
/* Consumer hook                                                            */
/* ************************************************************************ */

export const useAuth = () => {
  const value = useContext(AuthContext);

  if (value == null) {
    throw new Error("useAuth has to be used within <AuthProvider />");
  }

  return value;
};
