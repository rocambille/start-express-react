import { Link } from "react-router";

import { useAuth } from "../auth/AuthContext";
import useItems from "./useItems";

function ItemList() {
  const auth = useAuth();
  const { items } = useItems();

  return (
    <>
      <h1>Items</h1>
      {auth.check() && (
        <Link to="/items/new" data-testid="items-new">
          Ajouter
        </Link>
      )}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/items/${item.id}`}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default ItemList;
