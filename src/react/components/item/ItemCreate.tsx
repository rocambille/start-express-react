/*
  Purpose:
  Provide the "create item" page.

  Responsibilities:
  - Prepares an empty item shape
  - Wires the form submission to the addItem action

  Design notes:
  - Does not manage persistence directly
  - Delegates all data mutations to domain hooks
  - Focuses only on UI composition
*/

import { useCallback } from "react";
import { useNavigate } from "react-router";

import { useMutate } from "../../helpers/mutate";
import ItemForm from "./ItemForm";

function ItemCreate() {
  const mutate = useMutate();
  const navigate = useNavigate();

  const addItem = useCallback(
    async (partialItem: Omit<Item, "id" | "user_id">) => {
      const response = await mutate("/api/items", "post", partialItem, [
        "/api/items",
      ]);

      const { insertId } = await response.json();

      navigate(`/items/${insertId}`);
    },
    [mutate, navigate],
  );

  /*
    Default value passed to the form.

    Note:
    - This mirrors the editable fields only
    - The user_id is injected server-side
  */
  const newItem = {
    title: "",
  };

  return (
    /*
      ItemForm:
      - Is reused for both creation and edition
      - Receives an empty item as initial state
      - Delegates submission to addItem
    */
    <ItemForm defaultValue={newItem} action={addItem}>
      {/* Submit button is injected via composition */}
      <button type="submit">Add</button>
    </ItemForm>
  );
}

export default ItemCreate;
