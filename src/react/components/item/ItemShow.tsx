/*
  Purpose:
  Display a single item and expose owner-only actions.

  Design notes:
  - Performs UI-level authorization checks
  - Delegates mutations (edit/delete) to dedicated components or pages
*/

import { use } from "react";
import { Link, useParams } from "react-router";
import { NotFoundError } from "../../../errors/HttpError";
import { cache } from "../../helpers/cache";
import { useAuth } from "../auth/AuthContext";
import ItemDeleteForm from "./ItemDeleteForm";

function ItemShow() {
  const auth = useAuth();
  const { id } = useParams();

  const item = use<Item | null>(cache(`/api/items/${id}`));

  /*
    Safety guard:

    If the item is missing at this stage, it means:
    - The route does not exist
    - OR the user does not have access
    - OR the data is stale

    Throwing allows the router error boundary to handle the 404.
  */
  if (item == null) {
    throw new NotFoundError();
  }

  return (
    <>
      {/* **************************************************************** */}
      {/* Read-only view, accessible to everyone                           */}
      {/* **************************************************************** */}

      <h1>{item.title}</h1>

      {/* **************************************************************** */}
      {/* Owner-only actions                                               */}
      {/* **************************************************************** */}

      {auth.me?.id === item.user_id && (
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
