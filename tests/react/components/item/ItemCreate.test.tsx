import { screen } from "@testing-library/react";
import * as ReactRouter from "react-router";

vi.mock("react-router", { spy: true });

import ItemCreate from "../../../../src/react/components/item/ItemCreate";
import { fooUser } from "../../../fixtures/users";
import {
  expectContractCall,
  renderWithStub,
  requestValue,
  responseValue,
  setupMocks,
} from "../../test-utils";

describe("<ItemCreate />", () => {
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
});
