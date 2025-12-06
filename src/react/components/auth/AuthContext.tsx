import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { csrfToken } from "../utils";

type AuthContextType = {
  user: User | null;
  check: () => boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    credentials: Credentials & { confirmPassword: string },
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

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
          setUser({ id: insertId, email: credentials.email });
        });
    },
    [],
  );

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

export const useAuth = () => {
  const value = useContext(AuthContext);

  if (value == null) {
    throw new Error("useAuth has to be used within <AuthProvider />");
  }

  return value;
};
