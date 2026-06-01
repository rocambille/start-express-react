import { screen } from "@testing-library/react";
import * as ReactRouter from "react-router";

import ItemCreate from "../../../../src/react/components/item/ItemCreate";

import {
  expectContractCall,
  fooUser,
  renderWithStub,
  requestValue,
  responseValue,
  setupMocks,
} from "../../test-utils";

describe("<ItemCreate />", () => {
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
      path: "/items/new",
      Component: ItemCreate,
      initialEntries: ["/items/new"],
      me: fooUser,
    });

    await screen.findByRole("button");
  });
  it("should submit form and create an item", async () => {
    const { user } = await renderWithStub({
      path: "/items/new",
      Component: ItemCreate,
      initialEntries: ["/items/new"],
      me: fooUser,
    });

    await user.type(
      screen.getByLabelText(/title/i),
      String(requestValue("items", "create", "success", "title")),
    );
    await user.click(screen.getByRole("button"));

    expectContractCall("items", "create", "success");

    const navigate = ReactRouter.useNavigate();
    expect(navigate).toHaveBeenCalledWith(
      `/items/${responseValue("items", "create", "success", "insertId")}`,
    );
  });
  it("should not redirect if server returns an error", async () => {
    setupMocks({
      force500: [
        {
          path: "/api/items",
          method: "post",
        },
      ],
    });

    const { user } = await renderWithStub({
      path: "/items/new",
      Component: ItemCreate,
      initialEntries: ["/items/new"],
      me: fooUser,
    });

    await user.type(
      screen.getByLabelText(/title/i),
      String(requestValue("items", "create", "success", "title")),
    );
    await user.click(screen.getByRole("button"));

    expectContractCall("items", "create", "success");

    const navigate = ReactRouter.useNavigate();
    expect(navigate).not.toHaveBeenCalled();
  });
});
