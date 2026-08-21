/*
  Purpose:
  Shared inline form error display component.

  Design notes:
  - Leverages Pico CSS v2's native `aria-invalid` + `<small>` support
  - Zero custom CSS: Pico automatically styles `<small>` after an invalid input
  - Each form manages its own errors via useState<ZodIssue[]>

  Usage:
    const [errors, setErrors] = useState<ZodIssue[]>([]);

    <input
      aria-invalid={hasError(errors, "title") || undefined}
      aria-describedby={`${titleId}-error`}
    />
    <FormError issues={errors} name="title" id={`${titleId}-error`} />

  Related docs:
  - https://picocss.com/docs/forms
  - https://zod.dev/
*/

import type { $ZodIssue as ZodIssue } from "zod/v4/core";

/* ************************************************************************ */
/* hasError                                                                 */
/* ************************************************************************ */

/*
  hasError(issues, name):
  - Returns true if the issues array contains an error for the given field name
  - Returns false otherwise
  - Used to compute `aria-invalid` on inputs
*/
export function hasError(issues: ZodIssue[], name: string): boolean {
  return issues.some((issue) => issue.path.includes(name));
}

/* ************************************************************************ */
/* FormError                                                                */
/* ************************************************************************ */

/*
  FormError({ issues, name, id }):
  - Renders the first error message for a given field name
  - Returns null if the field has no errors
  - The `id` prop allows linking via `aria-describedby` for accessibility
*/
export function FormError({
  issues,
  name,
  id,
}: {
  issues: ZodIssue[];
  name: string;
  id?: string;
}) {
  const error = issues.find((issue) => issue.path.includes(name));

  if (!error) {
    return null;
  }

  return <small id={id}>{error.message}</small>;
}
