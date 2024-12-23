import type { ReactNode } from "react";

interface ItemFormProps {
  children: ReactNode;
  defaultValue: Omit<Item, "id" | "user_id">;
  submit: (partialItem: Omit<Item, "id" | "user_id">) => void;
}

function ItemForm({ children, defaultValue, submit }: ItemFormProps) {
  return (
    <form
      action={(formData) => {
        const title = formData.get("title") as string;

        submit({ title });
      }}
    >
      <input type="text" name="title" defaultValue={defaultValue.title} />
      {children}
    </form>
  );
}

export default ItemForm;
