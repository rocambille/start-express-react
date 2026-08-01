/*
  Purpose:
  Display the list of items and expose navigation to item-related pages.

  Responsibilities:
  - Fetch items via a dedicated domain hook
  - Render a list UI
  - Conditionally expose the "create item" entry point based on authentication

  Design notes:
  - No direct data fetching logic in the component
  - Authentication concerns are read-only (check, not mutate)
  - UI stays declarative and predictable
*/

import { use } from "react";
import { Link } from "react-router";
import { getOrFetch } from "../../helpers/cache";
import { useAuth } from "../auth/AuthContext";

function ItemList() {
  /*
    Authentication state:
    - Used only to decide what actions are visible
    - No redirects or side effects here
  */
  const auth = useAuth();

  /*
    Items collection:
    - Retrieved through the shared cache layer
    - Suspends while loading (via `use`)
    - Forgotten after mutations
  */
  const items = use(getOrFetch<Item[]>("/api/items"));

  return (
    <>
      <h1>Items</h1>

      {/* Entry point for authenticated users */}
      {auth.check() && (
        <Link to="/items/new" data-testid="items-new">
          Add
        </Link>
      )}

      {/* Item list */}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/items/${item.id}`}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default ItemList;
