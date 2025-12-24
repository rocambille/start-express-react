/*
  Purpose:
  Minimal form component responsible for triggering item deletion.

  Design notes:
  - Use a native <form> to keep semantics explicit
  - Delegates all side effects to the useItems hook

  Related docs:
  - https://react.dev/reference/react-dom/components/form
*/

import { useItems } from "./hooks";

function ItemDeleteForm() {
  const { deleteItem } = useItems();

  return (
    <form action={deleteItem}>
      <button type="submit">Delete</button>
    </form>
  );
}

export default ItemDeleteForm;
