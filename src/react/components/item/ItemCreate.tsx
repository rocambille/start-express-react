import ItemForm from "./ItemForm";
import useItems from "./useItems";

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
