import { type PropsWithChildren, createContext, use, useContext } from "react";
import { useNavigate, useParams } from "react-router";

import { useAuth } from "./AuthContext";
import { get, invalidateCache } from "./utils";

type ItemContextType = {
  items: Item[];
  addItem: (partialItem: Omit<Item, "id" | "user_id">) => void;
  item?: Item;
  editItem: (partialItem: Omit<Item, "id" | "user_id">) => void;
  deleteItem: () => void;
};

const ItemContext = createContext(null as ItemContextType | null);

export function ItemProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();

  const { user } = useAuth();

  const items = use(get("/api/items")) as Item[];

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
      body: JSON.stringify(partialItem),
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
      body: JSON.stringify(partialItem),
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
