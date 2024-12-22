import { useEffect, useState } from "react";
import { Link } from "react-router";

function ItemIndex() {
  const [items, setItems] = useState([] as Item[]);

  useEffect(() => {
    fetch("/api/items")
      .then((response) => response.json())
      .then((data: Item[]) => {
        setItems(data);
      });
  }, []);

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
