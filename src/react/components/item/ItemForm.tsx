/*
  Purpose:
  Shared form component for creating and editing items.

  Design notes:
  - Uses a native <form> to keep semantics explicit
  - Uses uncontrolled inputs for simplicity (stateless aside from DOM state)
  - Reusable across create/edit use cases
  - Validation errors are displayed inline via FormError

  Related docs:
  - https://react.dev/reference/react/useId
  - https://react.dev/reference/react-dom/components/form
  - https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
*/

import { type PropsWithChildren, useId, useState } from "react";
import { z } from "zod";
import type { $ZodIssue as ZodIssue } from "zod/v4/core";
import { FormError, hasError } from "../FormError";

// 1. Define the shape using the shared ambient Item type
type ItemFormValues = Pick<Item, "title">;

// 2. Annotate the Zod schema with z.ZodType<ItemFormValues>
const ItemFormSchema: z.ZodType<ItemFormValues> = z.object({
  title: z.string().min(1, "Title is required"),
});

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
  const [errors, setErrors] = useState<ZodIssue[]>([]);

  return (
    <form
      aria-label="item form"
      action={(formData) => {
        /*
          Form submission flow:

          1. Perform minimal synchronous validation
          2. Delegate side effects to the caller
        */

        /*
          Client-side validation can be done here for better UX.
          The API remains the source of truth for data integrity.
        */
        const parsed = ItemFormSchema.safeParse(Object.fromEntries(formData));

        if (!parsed.success) {
          setErrors(parsed.error.issues);
          return;
        }

        setErrors([]);
        action(parsed.data);
      }}
    >
      <p>
        <label htmlFor={titleId}>title</label>
        <input
          id={titleId}
          type="text"
          name="title"
          defaultValue={defaultValue.title}
          aria-invalid={hasError(errors, "title") || undefined}
          aria-describedby={`${titleId}-error`}
        />
        <FormError issues={errors} name="title" id={`${titleId}-error`} />
      </p>

      {/* Action buttons (submit, cancel…) are injected by the caller */}
      {children}
    </form>
  );
}

export default ItemForm;
