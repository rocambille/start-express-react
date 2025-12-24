/*
  Purpose:
  Provide the "edit item" page.

  Responsibilities:
  - Retrieves the current item from the shared items cache
  - Wires the form submission to the editItem action

  Design notes:
  - Relies on routing context to identify the item
  - Does not manage persistence directly
  - Delegates all data mutations to domain hooks
  - Focuses only on UI composition
*/

import { useItems } from "./hooks";
import ItemForm from "./ItemForm";

function ItemEdit() {
  const { item, editItem } = useItems();

  /*
    Safety guard:

    If the item is missing at this stage, it means:
    - The route does not exist
    - OR the user does not have access
    - OR the data is stale

    Throwing allows the router error boundary to handle the 404.
  */
  if (item == null) {
    throw new Error("404");
  }

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
