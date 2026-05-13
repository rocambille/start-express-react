import { screen } from "@testing-library/react";
import * as ReactRouter from "react-router";

import ItemDeleteForm from "../../../../src/react/components/item/ItemDeleteForm";

import {
  allItems,
  expectContractCall,
  fooUser,
  renderWithStub,
  setupMocks,
} from "../../test-utils";

describe("<ItemDeleteForm />", () => {
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
      "/items/:id",
      ItemDeleteForm,
      [`/items/${allItems[0].id}`],
      { me: fooUser },
    );

    await screen.findByRole("button");
  });
  it("should submit form and delete an item", async () => {
    const { user } = await renderWithStub(
      "/items/:id",
      ItemDeleteForm,
      [`/items/${allItems[0].id}`],
      { me: fooUser },
    );

    await user.click(screen.getByRole("button"));

    expectContractCall("items", "delete", "success");
  });
});
