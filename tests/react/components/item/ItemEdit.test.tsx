import { screen } from "@testing-library/react";
import * as ReactRouter from "react-router";

import ItemEdit from "../../../../src/react/components/item/ItemEdit";

import {
  allItems,
  expectContractCall,
  fooUser,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../../test-utils";

describe("<ItemEdit />", () => {
  beforeEach(() => {
    setupMocks();
    vi.spyOn(ReactRouter, "useNavigate").mockImplementation(() => () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    await renderWithStub(
      "/items/:id/edit",
      ItemEdit,
      [`/items/${allItems[0].id}/edit`],
      { me: fooUser },
    );

    await screen.findByRole("button");
  });
  it("should throw 404 when params contain invalid id", async () => {
    await expect(() =>
      renderWithStub("/items/:id/edit", ItemEdit, [`/items/${NaN}/edit`], {
        me: fooUser,
      }),
    ).rejects.toThrow(/404/);
  });
  it("should submit form and edit an item", async () => {
    const { user } = await renderWithStub(
      "/items/:id/edit",
      ItemEdit,
      [`/items/${allItems[0].id}/edit`],
      { me: fooUser },
    );

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(
      screen.getByLabelText(/title/i),
      requestValue("items", "edit", "success", "title"),
    );
    await user.click(screen.getByRole("button"));

    expectContractCall("items", "edit", "success");
  });
});
