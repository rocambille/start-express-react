import { use } from "react";
import { Link } from "react-router";
import { fetchData } from "../utils";

function ItemIndex() {
  const items = use(fetchData("/api/items")) as Item[];

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
