import {
  type PropsWithChildren,
  createContext,
  useContext,
  useState,
} from "react";

type AuthContextType = {
  user: User | null;
  login: (credentials: Credentials) => void;
  logout: () => void;
  register: (credentials: Credentials & { confirmPassword: string }) => void;
};

const AuthContext = createContext(null as AuthContextType | null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState(null as User | null);

  const login = (credentials: Credentials) => {
    fetch("/api/access-token", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
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
  };

  const logout = () => {
    fetch("/api/access-token", {
      method: "delete",
    }).then((response) => {
      if (response.status === 204) {
        setUser(null);
      }
    });
  };

  const register = (credentials: Credentials & { confirmPassword: string }) => {
    fetch("/api/users", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
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
  };

  return (
    <AuthContext value={{ user, login, logout, register }}>
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
