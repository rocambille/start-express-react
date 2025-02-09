import ItemForm from "../components/ItemForm";

import { useItems } from "../contexts/ItemContext";

function ItemEdit() {
  const { item, editItem } = useItems();

  return (
    <ItemForm defaultValue={item} submit={editItem}>
      <button type="submit">Modifier</button>
    </ItemForm>
  );
}

export default ItemEdit;
