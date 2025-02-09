import { Link } from "react-router";

import ItemDeleteForm from "../components/ItemDeleteForm";
import { useItems } from "../contexts/ItemContext";

function ItemDetail() {
  const { item } = useItems();

  return (
    <>
      <h1>{item.title}</h1>
      <Link to={`/items/${item.id}/edit`}>Modifier</Link>
      <ItemDeleteForm />
    </>
  );
}

export default ItemDetail;
