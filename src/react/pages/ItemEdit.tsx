import { useItems } from "../components/ItemContext";
import ItemForm from "../components/ItemForm";

function ItemEdit() {
  const { item, editItem } = useItems();

  if (item == null) {
    throw new Error();
  }

  return (
    <ItemForm defaultValue={item} action={editItem}>
      <button type="submit">Modifier</button>
    </ItemForm>
  );
}

export default ItemEdit;
