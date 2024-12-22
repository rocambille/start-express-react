import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import ItemForm from "../components/ItemForm";

function ItemEdit() {
  const navigate = useNavigate();

  const { id } = useParams();
  const [item, setItem] = useState(null as Item | null);

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((response) => response.json())
      .then((data: Item) => {
        setItem(data);
      });
  }, [id]);

  return (
    item && (
      <ItemForm
        defaultValue={item}
        onSubmit={(partialItem) => {
          fetch(`/api/items/${item.id}`, {
            method: "put",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: item.user_id, ...partialItem }),
          }).then((response) => {
            if (response.status === 204) {
              navigate(`/items/${item.id}`);
            }
          });
        }}
      >
        <button type="submit">Modifier</button>
      </ItemForm>
    )
  );
}

export default ItemEdit;
