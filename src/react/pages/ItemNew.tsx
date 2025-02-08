import { useNavigate } from "react-router";

import ItemForm from "../components/ItemForm";

import { invalidateCache } from "../utils";

function ItemNew() {
  const navigate = useNavigate();

  const newItem = {
    title: "",
  };

  const addItem = (partialItem: Omit<Item, "id" | "user_id">) => {
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
    <ItemForm defaultValue={newItem} submit={addItem}>
      <button type="submit">Ajouter</button>
    </ItemForm>
  );
}

export default ItemNew;
