import type { ReactNode } from "react";

interface ItemFormProps {
  children: ReactNode;
  defaultValue: Omit<Item, "id" | "user_id">;
  onSubmit: (partialItem: Omit<Item, "id" | "user_id">) => void;
}

function ItemForm({ children, defaultValue, onSubmit }: ItemFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const title = formData.get("title") as string;

        onSubmit({
          title,
        });
      }}
    >
      <input type="text" name="title" defaultValue={defaultValue.title} />
      {children}
    </form>
  );
}

export default ItemForm;
