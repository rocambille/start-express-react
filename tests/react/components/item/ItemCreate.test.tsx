import { screen } from "@testing-library/react";
import * as ReactRouter from "react-router";

import ItemCreate from "../../../../src/react/components/item/ItemCreate";

import {
  expectContractCall,
  fooUser,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../../test-utils";

describe("<ItemCreate />", () => {
  beforeEach(() => {
    setupMocks();
    vi.spyOn(ReactRouter, "useNavigate").mockImplementation(() => () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    await renderWithStub("/items/new", ItemCreate, ["/items/new"], {
      me: fooUser,
    });

    await screen.findByRole("button");
  });
  it("should submit form and create an item", async () => {
    const { user } = await renderWithStub(
      "/items/new",
      ItemCreate,
      ["/items/new"],
      { me: fooUser },
    );

    await user.type(
      screen.getByLabelText(/title/i),
      requestValue("items", "create", "success", "title"),
    );
    await user.click(screen.getByRole("button"));

    expectContractCall("items", "create", "success");
  });
});
