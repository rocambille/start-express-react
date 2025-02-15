import { type ReactNode, useId } from "react";

interface ItemFormProps {
  children: ReactNode;
  defaultValue: Omit<Item, "id" | "user_id">;
  submit: (partialItem: Omit<Item, "id" | "user_id">) => void;
}

function ItemForm({ children, defaultValue, submit }: ItemFormProps) {
  const titleId = useId();

  return (
    <form
      action={(formData) => {
        const title = formData.get("title") as string;

        submit({ title });
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
