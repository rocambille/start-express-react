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

import { useItems } from "./hooks";
import ItemForm from "./ItemForm";

function ItemCreate() {
  const { addItem } = useItems();

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
