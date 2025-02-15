import { type ReactNode, createContext, use, useContext } from "react";
import { useNavigate, useParams } from "react-router";

import { get, invalidateCache } from "../utils";
import { useAuth } from "./AuthContext";

interface ItemContextType {
  items: Item[];
  addItem: (partialItem: Omit<Item, "id" | "user_id">) => void;
  item?: Item;
  editItem: (partialItem: Omit<Item, "id" | "user_id">) => void;
  deleteItem: () => void;
}

const ItemContext = createContext(null as ItemContextType | null);

interface ItemProviderProps {
  children: ReactNode;
}

export function ItemProvider({ children }: ItemProviderProps) {
  const { user } = useAuth();

  const items = use(get("/api/items")) as Item[];

  const navigate = useNavigate();

  const { id } = useParams();

  const item = items.find((i) => i.id === Number(id));

  const editItem = (partialItem: Omit<Item, "id" | "user_id">) => {
    if (user == null) {
      alert("Please log in");
      return;
    }

    fetch(`/api/items/${id}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...partialItem,
      }),
    }).then((response) => {
      if (response.status === 204) {
        invalidateCache("/api/items");
        navigate(`/items/${id}`);
      }
    });
  };

  const deleteItem = () => {
    if (user == null) {
      alert("Please log in");
      return;
    }

    fetch(`/api/items/${id}`, {
      method: "delete",
    }).then((response) => {
      if (response.status === 204) {
        invalidateCache("/api/items");
        navigate("/items");
      }
    });
  };

  const addItem = (partialItem: Omit<Item, "id" | "user_id">) => {
    if (user == null) {
      alert("Please log in");
      return;
    }

    fetch("/api/items", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: user.id, ...partialItem }),
    })
      .then((response) => {
        if (response.status === 201) {
          return response.json();
        }
      })
      .then(({ insertId }) => {
        invalidateCache("/api/items");
        navigate(`/items/${insertId}`);
      });
  };

  return (
    <ItemContext.Provider
      value={{ items, addItem, item, editItem, deleteItem }}
    >
      {children}
    </ItemContext.Provider>
  );
}

export const useItems = () => {
  const value = useContext(ItemContext);

  if (value == null) {
    throw new Error("useItems has to be used within <ItemProvider />");
  }

  return value;
};
