import { Link } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { useItems } from "./hooks";
import ItemDeleteForm from "./ItemDeleteForm";

function ItemShow() {
  const auth = useAuth();
  const { item } = useItems();

  if (item == null) {
    throw 404;
  }

  return (
    <>
      <h1>{item.title}</h1>
      {auth.user?.id === item.user_id && (
        <>
          <Link to={`/items/${item.id}/edit`}>Modifier</Link>
          <ItemDeleteForm />
        </>
      )}
    </>
  );
}

export default ItemShow;
