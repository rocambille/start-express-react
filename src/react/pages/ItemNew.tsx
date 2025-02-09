import ItemForm from "../components/ItemForm";

import { useItems } from "../contexts/ItemContext";

function ItemNew() {
  const { addItem } = useItems();

  const newItem = {
    title: "",
  };

  return (
    <ItemForm defaultValue={newItem} submit={addItem}>
      <button type="submit">Ajouter</button>
    </ItemForm>
  );
}

export default ItemNew;
