import { Link } from "react-router";

import { useAuth } from "../components/AuthContext";
import { useItems } from "../components/ItemContext";

function ItemList() {
  const { user } = useAuth();
  const { items } = useItems();

  return (
    <>
      <h1>Items</h1>
      {user && <Link to="/items/new">Ajouter</Link>}
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
