import { useEffect, useState } from "react";

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
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </>
  );
}

export default ItemIndex;
