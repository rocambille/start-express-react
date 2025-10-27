import { use } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "./auth/AuthContext";

const cacheData = new Map();

export const cache = (url: string) => {
  if (!cacheData.has(url)) {
    // Promises should be cached for React `use` to work

    cacheData.set(
      url,
      fetch(url).then((response) => response.json()),
    );
  }

  return cacheData.get(url);
};

export const invalidateCache = (basePath: string) => {
  cacheData.forEach((_value, key: string) => {
    if (key.startsWith(basePath)) {
      cacheData.delete(key);
    }
  });
};

export const useAPI = <T extends { id: number }>(collectionName: string) => {
  const navigate = useNavigate();

  const auth = useAuth();

  const collection = use(cache(`/api/${collectionName}`)) as T[];

  const { id } = useParams();

  const item = collection.find((i) => i.id === Number(id));

  const editItem = (partialItem: Omit<T, "id" | "user_id">) => {
    if (!auth.check()) {
      alert("Please log in");
      return;
    }

    fetch(`/api/${collectionName}/${id}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(partialItem),
    }).then((response) => {
      if (response.status === 204) {
        invalidateCache(`/api/${collectionName}`);
        navigate(`/${collectionName}/${id}`);
      }
    });
  };

  const addItem = (partialItem: Omit<T, "id" | "user_id">) => {
    if (!auth.check()) {
      alert("Please log in");
      return;
    }

    fetch(`/api/${collectionName}`, {
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
        invalidateCache(`/api/${collectionName}`);
        navigate(`/${collectionName}/${insertId}`);
      });
  };

  const deleteItem = () => {
    if (!auth.check()) {
      alert("Please log in");
      return;
    }

    fetch(`/api/${collectionName}/${id}`, {
      method: "delete",
    }).then((response) => {
      if (response.status === 204) {
        invalidateCache(`/api/${collectionName}`);
        navigate(`/${collectionName}`);
      }
    });
  };

  return [collection, item, editItem, addItem, deleteItem];
};
