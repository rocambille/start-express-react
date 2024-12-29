import { use } from "react";
import { useNavigate, useParams } from "react-router";

import ItemForm from "../components/ItemForm";

import { get, invalidateCache, withSuspense } from "../utils";

function ItemEdit() {
  const navigate = useNavigate();

  const { id } = useParams();

  const item = use(get(`/api/items/${id}`)) as Item;

  return (
    <ItemForm
      defaultValue={item}
      submit={(partialItem) => {
        fetch(`/api/items/${item.id}`, {
          method: "put",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: item.user_id, ...partialItem }),
        }).then((response) => {
          if (response.status === 204) {
            invalidateCache("/api/items");
            navigate(`/items/${item.id}`);
          }
        });
      }}
    >
      <button type="submit">Modifier</button>
    </ItemForm>
  );
}

export default withSuspense(ItemEdit);
