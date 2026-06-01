import { screen } from "@testing-library/react";

import ItemShow from "../../../../src/react/components/item/ItemShow";
import { allItems } from "../../../fixtures/items";
import { fooUser } from "../../../fixtures/users";
import {
  expectContractCall,
  renderWithStub,
  setupMocks,
} from "../../test-utils";

describe("<ItemShow />", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    await renderWithStub({
      path: "/items/:id",
      Component: ItemShow,
      initialEntries: [`/items/${allItems[0].id}`],
      me: fooUser,
    });

    await screen.findByRole("heading", { level: 1, name: allItems[0].title });

    expectContractCall("items", "read", "success");
  });
  it("should throw 404 when params contain invalid id", async () => {
    await expect(() =>
      renderWithStub({
        path: "/items/:id",
        Component: ItemShow,
        initialEntries: [`/items/${NaN}`],
        me: fooUser,
      }),
    ).rejects.toThrow(/404/i);

    expectContractCall("items", "read", "not_found");
  });
  it("should not display link to edit item when anonymous", async () => {
    await renderWithStub({
      path: "/items/:id",
      Component: ItemShow,
      initialEntries: [`/items/${allItems[0].id}`],
      me: null,
    });

    await screen.findByRole("heading", { level: 1, name: allItems[0].title });

    expect(screen.queryByTestId(`items-edit-/${allItems[0].id}`)).toBeNull();
  });
  it("should display link to edit item when authentified", async () => {
    await renderWithStub({
      path: "/items/:id",
      Component: ItemShow,
      initialEntries: [`/items/${allItems[0].id}`],
      me: fooUser,
    });

    await screen.findByTestId(`items-edit-${allItems[0].id}`);
  });
});
