import { type PropsWithChildren, useId } from "react";

type ItemFormProps = PropsWithChildren<{
  defaultValue: Omit<Item, "id" | "user_id">;
  action: (partialItem: Omit<Item, "id" | "user_id">) => void;
}>;

function ItemForm({ children, defaultValue, action }: ItemFormProps) {
  const titleId = useId();

  return (
    <form
      action={(formData) => {
        const title = formData.get("title") as string;

        action({ title });
      }}
    >
      <p>
        <label htmlFor={titleId}>title</label>
        <input
          id={titleId}
          type="text"
          name="title"
          defaultValue={defaultValue.title}
        />
      </p>

      {children}
    </form>
  );
}

export default ItemForm;
