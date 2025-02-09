import { Link } from "react-router";
import { useItems } from "../contexts/ItemContext";

function ItemIndex() {
  const { items } = useItems();

  return (
    <>
      <h1>Items</h1>
      <Link to="/items/new">Ajouter</Link>
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

export default ItemIndex;
