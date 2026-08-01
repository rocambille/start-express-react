import { fireEvent, screen } from "@testing-library/react";

import ItemForm from "../../../../src/react/components/item/ItemForm";
import { fooUser } from "../../../fixtures/users";
import { renderWithStub, setupMocks } from "../../test-utils";

describe("<ItemForm />", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    await renderWithStub({
      path: "/items/new",
      Component: () => (
        <ItemForm defaultValue={{ title: "" }} action={() => {}}>
          <button type="submit">submit</button>
        </ItemForm>
      ),
      initialEntries: ["/items/new"],
      me: fooUser,
    });

    await screen.findByRole("form", { name: /item form/i });
  });
  it("should display inline errors when submitting invalid data", async () => {
    await renderWithStub({
      path: "/items/new",
      Component: () => (
        <ItemForm defaultValue={{ title: "" }} action={() => {}}>
          <button type="submit">submit</button>
        </ItemForm>
      ),
      initialEntries: ["/items/new"],
      me: fooUser,
    });

    await fireEvent.submit(screen.getByRole("form", { name: /item form/i }));

    await screen.findByText("Title is required");
  });
});
