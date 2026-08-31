/*
  Purpose:
  Centralize current user (me) session state and actions for the React application.

  This context:
  - Stores the currently authenticated user (or null)
  - Exposes authentication actions (sendMagicLink, verifyMagicLink, logout)
  - Exposes profile management actions (updateMe, deleteMe, uploadMeAvatar)

  Usage:
  - Wrap the app with <MeProvider>
  - Access user state and actions via the useMe() hook
*/

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import { forget, getOrFetch } from "../../helpers/cache";
import { apiMutate } from "../../helpers/mutate";

/* ************************************************************************ */
/* Types                                                                    */
/* ************************************************************************ */

type MeContextType = {
  user: User | null;
  isAuthenticated: boolean;
  sendMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateMe: (
    newMe: Omit<User, "id" | "created_at" | "deleted_at" | "avatar_url">,
  ) => Promise<void>;
  updateMeAvatar: (fileOrNull: File | null) => Promise<void>;
  deleteMe: () => Promise<void>;
};

/* ************************************************************************ */
/* Context                                                                  */
/* ************************************************************************ */

const MeContext = createContext<MeContextType | null>(null);

/* ************************************************************************ */
/* Provider                                                                 */
/* ************************************************************************ */

export function MeProvider({
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
    const data: User = await response.json();
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await apiMutate("/api/auth/logout", "post");

    setUser(null);
  }, []);

  const updateMe = useCallback(
    async (
      newMe: Omit<User, "id" | "created_at" | "deleted_at" | "avatar_url">,
    ) => {
      await apiMutate("/api/users/me", "put", newMe);

      forget("/api/users/me");
      setUser(await getOrFetch<User | null>("/api/users/me"));
    },
    [],
  );

  const updateMeAvatar = useCallback(async (fileOrNull: File | null) => {
    if (fileOrNull == null) {
      await apiMutate("/api/users/me/avatar", "delete");
    } else {
      const formData = new FormData();
      formData.append("avatar", fileOrNull);

      await apiMutate("/api/users/me/avatar", "post", formData);
    }

    forget("/api/users/me");
    setUser(await getOrFetch<User | null>("/api/users/me"));
  }, []);

  const deleteMe = useCallback(async () => {
    await apiMutate("/api/users/me", "delete");

    setUser(null);
  }, []);

  /* ********************************************************************** */
  /* Provider value                                                         */
  /* ********************************************************************** */

  return (
    <MeContext
      value={{
        user,
        isAuthenticated: user != null,
        sendMagicLink,
        verifyMagicLink,
        logout,
        updateMe,
        updateMeAvatar,
        deleteMe,
      }}
    >
      {children}
    </MeContext>
  );
}

/* ************************************************************************ */
/* Consumer hook                                                            */
/* ************************************************************************ */

export const useMe = () => {
  const value = useContext(MeContext);

  if (value == null) {
    throw new Error("useMe has to be used within <MeProvider />");
  }

  return value;
};
