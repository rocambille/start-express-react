import { use } from "react";
import { Link, useParams } from "react-router";

import DeleteForm from "../components/DeleteForm";
import { get, withSuspense } from "../utils";

function ItemDetail() {
  const { id } = useParams();

  const item = use(get(`/api/items/${id}`)) as Item;

  return (
    <>
      <h1>{item.title}</h1>
      <Link to={`/items/${item.id}/edit`}>Modifier</Link>
      <DeleteForm basePath="/items" id={item.id} />
    </>
  );
}

export default withSuspense(ItemDetail);
