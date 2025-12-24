/*
  Purpose:
  Centralize all item-related client logic in a single domain hook.

  Responsibilities:
  - Fetch and cache the item collection
  - Derive a single item from the route parameters
  - Expose mutation helpers (add / edit / delete)
  - Handle navigation and cache invalidation after mutations

  Design notes:
  - Components remain declarative and dumb
  - Network effects are explicit and localized
  - Authentication is checked, never assumed
  - Cache is the single source of truth for lists
*/

import { use, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { cache, csrfToken, invalidateCache } from "../utils";

/* ************************************************************************ */
/* Hooks                                                                    */
/* ************************************************************************ */

export const useItems = () => {
  /*
    Routing helpers:
    - `navigate` handles post-mutation redirects
  */
  const navigate = useNavigate();

  /*
    Authentication context:
    - Used only as a gate before mutations
  */
  const auth = useAuth();

  /* ********************************************************************** */
  /* Browse                                                                 */
  /* ********************************************************************** */

  /*
    Items collection:
    - Retrieved through the shared cache layer
    - Suspends while loading (via `use`)
    - Invalidated explicitly after mutations
  */
  const items = use<Item[]>(cache("/api/items"));

  /* ********************************************************************** */
  /* Read                                                                   */
  /* ********************************************************************** */

  const { id } = useParams();

  /*
    Selected item:
    - Derived from route params
    - No additional fetch required
    - Keeps list and detail views consistent
  */
  const item: Item | undefined = useMemo(() => {
    if (id != null) {
      return items.find((item) => item.id === +id);
    }
  }, [id, items]);

  /* ********************************************************************** */
  /* Edit                                                                   */
  /* ********************************************************************** */

  const editItem = useCallback(
    async (partialItem: Omit<Item, "id" | "user_id">) => {
      if (!auth.check()) return alert("Please log in");

      fetch(`/api/items/${id}`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": await csrfToken(),
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

  /* ********************************************************************** */
  /* Add                                                                    */
  /* ********************************************************************** */

  const addItem = useCallback(
    async (partialItem: Omit<Item, "id" | "user_id">) => {
      if (!auth.check()) return alert("Please log in");

      fetch("/api/items", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": await csrfToken(),
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

  /* ********************************************************************** */
  /* Delete                                                                 */
  /* ********************************************************************** */

  const deleteItem = useCallback(async () => {
    if (!auth.check()) return alert("Please log in");

    fetch(`/api/items/${id}`, {
      method: "delete",
      headers: {
        "X-CSRF-Token": await csrfToken(),
      },
    }).then((response) => {
      if (response.status === 204) {
        invalidateCache("/api/items");
        navigate("/items");
      }
    });
  }, [auth.check, id, navigate]);

  /* ********************************************************************** */
  /* Public API                                                             */
  /* ********************************************************************** */

  /*
    Expose a compact, intention-revealing API:
    - Data (items, item)
    - Mutations (edit, add, delete)
  */
  return {
    items,
    item,
    editItem,
    addItem,
    deleteItem,
  };
};
