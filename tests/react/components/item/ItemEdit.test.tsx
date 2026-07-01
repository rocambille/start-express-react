import { screen } from "@testing-library/react";
import * as ReactRouter from "react-router";

vi.mock("react-router", { spy: true });

import ItemEdit from "../../../../src/react/components/item/ItemEdit";
import { allItems } from "../../../fixtures/items";
import { fooUser } from "../../../fixtures/users";
import {
  expectContractCall,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../../test-utils";

describe("<ItemEdit />", () => {
  beforeEach(() => {
    setupMocks();

    const mockedNavigate = vi.fn();
    vi.mocked(ReactRouter.useNavigate).mockImplementation(() => mockedNavigate);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    await renderWithStub({
      path: "/items/:id/edit",
      Component: ItemEdit,
      initialEntries: [`/items/${allItems[0].id}/edit`],
      me: fooUser,
    });

    await screen.findByRole("button");
  });
  it("should throw 404 when params contain invalid id", async () => {
    await expect(() =>
      renderWithStub({
        path: "/items/:id/edit",
        Component: ItemEdit,
        initialEntries: [`/items/${NaN}/edit`],
        me: fooUser,
      }),
    ).rejects.toThrow(/404/i);
  });
  it("should submit form and edit an item", async () => {
    const { user } = await renderWithStub({
      path: "/items/:id/edit",
      Component: ItemEdit,
      initialEntries: [`/items/${allItems[0].id}/edit`],
      me: fooUser,
    });

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(
      screen.getByLabelText(/title/i),
      String(requestValue("items", "edit", "success", "title")),
    );
    await user.click(screen.getByRole("button"));

    expectContractCall("items", "edit", "success");

    const navigate = ReactRouter.useNavigate();
    expect(navigate).toHaveBeenCalledWith(`/items/${allItems[0].id}`);
  });
});
