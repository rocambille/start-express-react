/*
  Purpose:
  Centralize authentication state and actions for the React application.

  This context:
  - Stores the currently authenticated user (or null)
  - Exposes high-level auth actions (login, logout, register)
  - Performs an initial session check on mount (/api/me)

  Design notes:
  - One source of truth for authentication state
  - Side effects live at the edge (fetch, cookies, CSRF)
  - Consumers interact with intent-based methods, not HTTP details

  Usage:
  - Wrap the app with <AuthProvider>
  - Access auth state and actions via the useAuth() hook

  Related docs:
  - https://react.dev/learn/passing-data-deeply-with-context
  - https://react.dev/learn/scaling-up-with-reducer-and-context#moving-all-wiring-into-a-single-file
*/

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { csrfToken } from "../utils";

/* ************************************************************************ */
/* Types                                                                    */
/* ************************************************************************ */

type AuthContextType = {
  user: User | null;

  /*
    Synchronous helper:
    Returns true when a user is authenticated.
    Useful for conditional rendering.
  */
  check: () => boolean;

  /*
    Auth actions:
    Each method encapsulates:
    - HTTP call
    - CSRF handling
    - State updates
  */
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    credentials: Credentials & { confirmPassword: string },
  ) => Promise<void>;
};

/* ************************************************************************ */
/* Context                                                                  */
/* ************************************************************************ */

/*
  The context starts as null to enforce correct usage.
  Consumers must be wrapped in <AuthProvider>.
*/
const AuthContext = createContext<AuthContextType | null>(null);

/* ************************************************************************ */
/* Provider                                                                 */
/* ************************************************************************ */

export function AuthProvider({ children }: PropsWithChildren) {
  /*
    user represents the authenticated session.
    - null: not authenticated
    - User: authenticated
  */
  const [user, setUser] = useState<User | null>(null);

  /* ********************************************************************** */
  /* Initial session check                                                 */
  /* ********************************************************************** */

  /*
    On first render, ask the backend if a session already exists.
    The auth cookie is sent automatically by the browser.
  */
  useEffect(() => {
    fetch("/api/me")
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        }
      })
      .then((user: User) => {
        setUser(user);
      });
  }, []);

  /* ********************************************************************** */
  /* Actions                                                                */
  /* ********************************************************************** */

  const login = useCallback(async (credentials: Credentials) => {
    fetch("/api/access-tokens", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": await csrfToken(),
      },
      body: JSON.stringify(credentials),
    })
      .then((response) => {
        if (response.status === 201) {
          return response.json();
        }
      })
      .then((user: User) => {
        setUser(user);
      });
  }, []);

  const logout = useCallback(async () => {
    fetch("/api/access-tokens", {
      method: "delete",
      headers: {
        "X-CSRF-Token": await csrfToken(),
      },
    }).then((response) => {
      if (response.status === 204) {
        setUser(null);
      }
    });
  }, []);

  const register = useCallback(
    async (credentials: Credentials & { confirmPassword: string }) => {
      fetch("/api/users", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": await csrfToken(),
        },
        body: JSON.stringify(credentials),
      })
        .then((response) => {
          if (response.status === 201) {
            return response.json();
          }
        })
        .then(({ insertId }) => {
          // Backend creates the user and authenticates implicitly
          setUser({ id: insertId, email: credentials.email });
        });
    },
    [],
  );

  /* ********************************************************************** */
  /* Provider value                                                         */
  /* ********************************************************************** */

  return (
    <AuthContext
      value={{
        user,
        check: () => user != null,
        login,
        logout,
        register,
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

  /*
    Fail fast if the hook is used outside the provider.
    This prevents silent bugs and undefined behavior.
  */
  if (value == null) {
    throw new Error("useAuth has to be used within <AuthProvider />");
  }

  return value;
};
