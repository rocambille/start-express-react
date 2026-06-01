/*
  Purpose:
  Minimal form component responsible for triggering item deletion.

  Design notes:
  - Use a native <form> to keep semantics explicit

  Related docs:
  - https://react.dev/reference/react-dom/components/form
*/

import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";

import { useMutate } from "../../helpers/mutate";

function ItemDeleteForm() {
  const mutate = useMutate();
  const navigate = useNavigate();
  const { id } = useParams();

  const deleteItem = useCallback(async () => {
    await mutate(`/api/items/${id}`, "delete", null, [
      "/api/items",
      `/api/items/${id}`,
    ]);

    navigate("/items");
  }, [id, mutate, navigate]);

  return (
    <form action={deleteItem}>
      <button type="submit">Delete</button>
    </form>
  );
}

export default ItemDeleteForm;
