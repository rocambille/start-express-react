import useItems from "./useItems";

function ItemDeleteForm() {
  const { deleteItem } = useItems();

  return (
    <form action={deleteItem}>
      <button type="submit">Supprimer</button>
    </form>
  );
}

export default ItemDeleteForm;
