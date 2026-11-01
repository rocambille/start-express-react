import { screen } from "@testing-library/react";

import ItemList from "../../../../src/react/components/item/ItemList";
import { standardUser } from "../../../fixtures/users";
import {
  expectContractCall,
  renderWithStub,
  setupMocks,
} from "../../test-utils";

describe("<ItemList />", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    await renderWithStub({
      path: "/items",
      Component: ItemList,
      initialEntries: ["/items"],
      me: standardUser,
    });

    await screen.findByRole("heading", { level: 1, name: /items/i });

    expectContractCall("items", "browse", "success");
  });
  it("should not display link to create item when anonymous", async () => {
    await renderWithStub({
      path: "/items",
      Component: ItemList,
      initialEntries: ["/items"],
      me: null,
    });

    await screen.findByRole("heading", { level: 1, name: /items/i });

    expect(screen.queryByTestId("items-new")).toBeNull();
  });
  it("should display link to create item when authentified", async () => {
    await renderWithStub({
      path: "/items",
      Component: ItemList,
      initialEntries: ["/items"],
      me: standardUser,
    });

    await screen.findByTestId("items-new");
  });
  it("should display an empty list without error", async () => {
    // What the API answers when there is no item (see itemActions.browse)
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("[]", {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Content-Range": "items */0",
            },
          }),
      ),
    );

    await renderWithStub({
      path: "/items",
      Component: ItemList,
      initialEntries: ["/items"],
      me: standardUser,
    });

    await screen.findByRole("heading", { level: 1, name: /items/i });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    screen.getByTestId("items-new");
  });
});
