import { Link } from "react-router";

import { useAuth } from "../components/AuthContext";
import { useItems } from "../components/ItemContext";
import ItemDeleteForm from "../components/ItemDeleteForm";

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
