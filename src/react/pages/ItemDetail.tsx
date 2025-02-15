import { Link } from "react-router";

import ItemDeleteForm from "../components/ItemDeleteForm";
import { useAuth } from "../contexts/AuthContext";
import { useItems } from "../contexts/ItemContext";

function ItemDetail() {
  const { user } = useAuth();
  const { item } = useItems();

  if (item == null) {
    throw new Error();
  }

  return (
    <>
      <h1>{item.title}</h1>
      {user?.id === item.user_id && (
        <>
          <Link to={`/items/${item.id}/edit`}>Modifier</Link>
          <ItemDeleteForm />
        </>
      )}
    </>
  );
}

export default ItemDetail;
