import { useNavigate } from "react-router";
import { invalidateCache } from "../utils";

type DeleteFormProps = {
  id: number;
  basePath: string;
};

function DeleteForm({ id, basePath }: DeleteFormProps) {
  const navigate = useNavigate();

  const deleteItem = () => {
    fetch(`/api${basePath}/${id}`, {
      method: "delete",
    }).then((response) => {
      if (response.status === 204) {
        invalidateCache(`/api${basePath}`);
        navigate(basePath);
      }
    });
  };

  return (
    <form action={deleteItem}>
      <button type="submit">Supprimer</button>
    </form>
  );
}

export default DeleteForm;
