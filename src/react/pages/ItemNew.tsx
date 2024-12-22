import { useNavigate } from "react-router";

import ItemForm from "../components/ItemForm";

function ItemNew() {
  const navigate = useNavigate();

  const newItem = {
    title: "",
  };

  return (
    <ItemForm
      defaultValue={newItem}
      onSubmit={(partialItem) => {
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
            navigate(`/items/${insertId}`);
          });
      }}
    >
      <button type="submit">Ajouter</button>
    </ItemForm>
  );
}

export default ItemNew;
