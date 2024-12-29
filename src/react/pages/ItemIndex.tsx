import { use } from "react";
import { Link } from "react-router";
import { get, withSuspense } from "../utils";

function ItemIndex() {
  const items = use(get("/api/items")) as Item[];

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

export default withSuspense(ItemIndex);
