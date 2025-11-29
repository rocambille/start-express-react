import { use, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { cache, invalidateCache } from "../utils";

export const useItems = () => {
  const navigate = useNavigate();

  const auth = useAuth();

  // browse

  const items = use<Item[]>(cache("/api/items"));

  // read

  const { id } = useParams();

  const item: Item | undefined = useMemo(() => {
    if (id != null) {
      return items.find((item) => item.id === +id);
    }
  }, [id, items]);

  // edit

  const editItem = useCallback(
    (partialItem: Omit<Item, "id" | "user_id">) => {
      if (!auth.check()) return alert("Please log in");

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
    },
    [auth.check, id, navigate],
  );

  // add

  const addItem = useCallback(
    (partialItem: Omit<Item, "id" | "user_id">) => {
      if (!auth.check()) return alert("Please log in");

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
    },
    [auth.check, navigate],
  );

  // delete

  const deleteItem = useCallback(() => {
    if (!auth.check()) return alert("Please log in");

    fetch(`/api/items/${id}`, {
      method: "delete",
    }).then((response) => {
      if (response.status === 204) {
        invalidateCache("/api/items");
        navigate("/items");
      }
    });
  }, [auth.check, id, navigate]);

  // pack them all

  return { items, item, editItem, addItem, deleteItem };
};
