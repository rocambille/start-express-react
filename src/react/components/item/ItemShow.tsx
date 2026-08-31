/*
  Purpose:
  Display a single item and expose owner-only actions.

  Design notes:
  - Performs UI-level authorization checks
  - Delegates mutations (edit/delete) to dedicated components or pages
*/

import { use } from "react";
import { Link, useParams } from "react-router";
import { getOrFetch } from "../../helpers/cache";
import { useMe } from "../auth/MeContext";
import ItemDeleteForm from "./ItemDeleteForm";

function ItemShow() {
  const { user } = useMe();
  const { id } = useParams();

  const item = use(getOrFetch<Item>(`/api/items/${id}`));

  return (
    <>
      {/* **************************************************************** */}
      {/* Read-only view, accessible to everyone                           */}
      {/* **************************************************************** */}

      <h1>{item.title}</h1>

      {/* **************************************************************** */}
      {/* Owner-only actions                                               */}
      {/* **************************************************************** */}

      {user?.id === item.user_id && (
        <>
          {/*
            Edit action:
            - Pure navigation
            - No side effects here
          */}
          <Link
            to={`/items/${item.id}/edit`}
            data-testid={`items-edit-${item.id}`}
          >
            Edit
          </Link>

          {/*
            Delete action:
            - Encapsulated in its own component
            - All side effects handled by hooks
          */}
          <ItemDeleteForm />
        </>
      )}
    </>
  );
}

export default ItemShow;
