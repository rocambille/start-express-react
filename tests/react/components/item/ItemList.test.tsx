import { screen } from "@testing-library/react";

import ItemList from "../../../../src/react/components/item/ItemList";

import {
  expectContractCall,
  fooUser,
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
      me: fooUser,
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
      me: fooUser,
    });

    await screen.findByTestId("items-new");
  });
});
