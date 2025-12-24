/*
  Purpose:
  Shared form component for creating and editing items.

  Design notes:
  - Uses a native <form> to keep semantics explicit
  - Uses uncontrolled inputs for simplicity (stateless aside from DOM state)
  - Delegates all side effects to the useItems hook
  - Reusable across create/edit use cases

  Related docs:
  - https://react.dev/reference/react/useId
  - https://react.dev/reference/react-dom/components/form
  - https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
*/

import { type PropsWithChildren, useId } from "react";

/*
  Props:

  - defaultValue:
    Initial form values, provided by the caller.
    The form does NOT assume where the data comes from.

  - action:
    Callback invoked on submit with validated, minimal data.
    Side effects (API calls, navigation, cache invalidation)
    are handled outside of this component.
*/
interface ItemFormProps extends PropsWithChildren {
  defaultValue: Omit<Item, "id" | "user_id">;
  action: (partialItem: Omit<Item, "id" | "user_id">) => void;
}

function ItemForm({ children, defaultValue, action }: ItemFormProps) {
  /*
    useId ensures:
    - Stable, unique ids across renders
    - No collision when multiple forms are rendered
  */
  const titleId = useId();

  return (
    <form
      action={(formData) => {
        /*
          Form submission flow:

          1. Read raw values from FormData
          2. Perform minimal synchronous validation
          3. Delegate side effects to the caller
        */

        const title = formData.get("title")?.toString() ?? "";

        /*
          Client-side validation can be done here for better UX.
          The API remains the source of truth for data integrity.
        */

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

      {/* Action buttons (submit, cancel…) are injected by the caller */}
      {children}
    </form>
  );
}

export default ItemForm;
