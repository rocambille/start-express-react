import { useNavigate } from "react-router";

type DeleteFormProps = {
  id: number;
  basePath: string;
};

function DeleteForm({ id, basePath }: DeleteFormProps) {
  const navigate = useNavigate();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        fetch(`/api${basePath}/${id}`, {
          method: "delete",
        }).then((response) => {
          if (response.status === 204) {
            navigate(basePath);
          }
        });
      }}
    >
      <button type="submit">Supprimer</button>
    </form>
  );
}

export default DeleteForm;
