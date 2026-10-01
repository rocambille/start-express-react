/*
  Purpose:
  Provide the "edit item" page.

  Responsibilities:
  - Retrieves the current item from the shared items cache
  - Wires the form submission to the editItem action

  Design notes:
  - Relies on routing context to identify the item
  - Does not manage persistence directly
  - Delegates all data mutations to the mutate helper
  - Focuses only on UI composition
*/

import { use, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { getOrFetch, useRefresh } from "../../helpers/cache";
import { mutate } from "../../helpers/mutate";
import ItemForm from "./ItemForm";

function ItemEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  useRefresh(`/api/items/${id}`);

  const editItem = useCallback(
    async (partialItem: Omit<Item, "id" | "user_id">) => {
      await mutate(`/api/items/${id}`, "put", partialItem, [
        "/api/items",
        `/api/items/${id}`,
      ]);

      navigate(`/items/${id}`);
    },
    [id, navigate],
  );

  const item = use(getOrFetch<Item>(`/api/items/${id}`));

  return (
    /*
      ItemForm:
      - Is reused for both creation and edition
      - Receives the existing item as initial state
      - Delegates submission to editItem
    */
    <ItemForm defaultValue={item} action={editItem}>
      {/* Submit button is injected via composition */}
      <button type="submit">Edit</button>
    </ItemForm>
  );
}

export default ItemEdit;
