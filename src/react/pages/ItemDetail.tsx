import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import DeleteForm from "../components/DeleteForm";

function ItemDetail() {
  const { id } = useParams();

  const [item, setItem] = useState(null as Item | null);

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((response) => response.json())
      .then((data: Item) => {
        setItem(data);
      });
  }, [id]);

  return (
    item && (
      <>
        <h1>{item.title}</h1>
        <Link to={`/items/${item.id}/edit`}>Modifier</Link>
        <DeleteForm basePath="/items" id={item.id} />
      </>
    )
  );
}

export default ItemDetail;
