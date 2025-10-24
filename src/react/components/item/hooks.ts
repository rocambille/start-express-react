import { use } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { cache, invalidateCache } from "../utils";

export const useItems = () => {
  const navigate = useNavigate();

  const auth = useAuth();

  // browse

  const items = use(cache("/api/items")) as Item[];

  // read

  const { id } = useParams();

  const item = items.find((i) => i.id === Number(id));

  // edit

  const editItem = (partialItem: Omit<Item, "id" | "user_id">) => {
    if (!auth.check()) {
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

  // add

  const addItem = (partialItem: Omit<Item, "id" | "user_id">) => {
    if (!auth.check()) {
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

  // delete

  const deleteItem = () => {
    if (!auth.check()) {
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

  // pack them all

  return { items, item, editItem, addItem, deleteItem };
};
