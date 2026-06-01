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

    const mockedNavigate = vi.fn();
    vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
      () => mockedNavigate,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    await renderWithStub({
      path: "/items/:id",
      Component: ItemDeleteForm,
      initialEntries: [`/items/${allItems[0].id}`],
      me: fooUser,
    });

    await screen.findByRole("button");
  });
  it("should submit form and delete an item", async () => {
    const { user } = await renderWithStub({
      path: "/items/:id",
      Component: ItemDeleteForm,
      initialEntries: [`/items/${allItems[0].id}`],
      me: fooUser,
    });

    await user.click(screen.getByRole("button"));

    expectContractCall("items", "delete", "success");

    const navigate = ReactRouter.useNavigate();
    expect(navigate).toHaveBeenCalledWith("/items");
  });
  it("should not redirect when server returns an error", async () => {
    setupMocks({
      force500: [
        {
          path: `/api/items/${allItems[0].id}`,
          method: "delete",
        },
      ],
    });

    const { user } = await renderWithStub({
      path: "/items/:id",
      Component: ItemDeleteForm,
      initialEntries: [`/items/${allItems[0].id}`],
      me: fooUser,
    });

    await user.click(screen.getByRole("button"));

    expectContractCall("items", "delete", "success");

    const navigate = ReactRouter.useNavigate();
    expect(navigate).not.toHaveBeenCalled();
  });
});
