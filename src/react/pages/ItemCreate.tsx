import { useItems } from "../components/ItemContext";
import ItemForm from "../components/ItemForm";

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
