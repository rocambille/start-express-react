import { createContext, use, useContext } from "react";
import { Outlet, useNavigate, useParams } from "react-router";

import { get, invalidateCache } from "../utils";

interface ItemContextType {
  items: Item[];
  item: Item;
  editItem: (partialItem: Omit<Item, "id" | "user_id">) => void;
  deleteItem: () => void;
  addItem: (partialItem: Omit<Item, "id" | "user_id">) => void;
}

const ItemContext = createContext(null as ItemContextType | null);

export function ItemProvider() {
  const items = use(get("/api/items")) as Item[];

  const value = { items } as ItemContextType;

  const navigate = useNavigate();

  const { id } = useParams();

  if (id != null) {
    value.item = items.find((i) => i.id === +id) as Item;

    value.editItem = (partialItem: Omit<Item, "id" | "user_id">) => {
      fetch(`/api/items/${id}`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: value.item?.user_id, ...partialItem }),
      }).then((response) => {
        if (response.status === 204) {
          invalidateCache("/api/items");
          navigate(`/items/${id}`);
        }
      });
    };

    value.deleteItem = () => {
      fetch(`/api/items/${id}`, {
        method: "delete",
      }).then((response) => {
        if (response.status === 204) {
          invalidateCache("/api/items");
          navigate("/items");
        }
      });
    };
  }

  value.addItem = (partialItem: Omit<Item, "id" | "user_id">) => {
    fetch("/api/items", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: 1, ...partialItem }),
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
    <ItemContext.Provider value={value}>
      <Outlet />
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
