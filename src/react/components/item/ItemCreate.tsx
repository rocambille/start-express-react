import { useItems } from "./ItemContext";
import ItemForm from "./ItemForm";

function ItemCreate() {
  const { addItem } = useItems();

  const newItem = {
    title: "",
  };

  return (
    <ItemForm defaultValue={newItem} action={addItem}>
      <button type="submit">Ajouter</button>
    </ItemForm>
  );
}

export default ItemCreate;
