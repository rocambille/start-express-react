import ItemForm from "./ItemForm";
import useItems from "./useItems";

function ItemEdit() {
  const { item, editItem } = useItems();

  if (item == null) {
    throw new Error("404");
  }

  return (
    <ItemForm defaultValue={item} action={editItem}>
      <button type="submit">Modifier</button>
    </ItemForm>
  );
}

export default ItemEdit;
