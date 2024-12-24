import { useNavigate } from "react-router";

import ItemForm from "../components/ItemForm";

import { invalidateCache } from "../utils";

function ItemNew() {
  const navigate = useNavigate();

  const newItem = {
    title: "",
  };

  return (
    <ItemForm
      defaultValue={newItem}
      submit={(partialItem) => {
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
      }}
    >
      <button type="submit">Ajouter</button>
    </ItemForm>
  );
}

export default ItemNew;
