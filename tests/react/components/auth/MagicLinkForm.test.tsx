import { fireEvent, screen } from "@testing-library/react";

import MagicLinkForm from "../../../../src/react/components/auth/MagicLinkForm";
import {
  expectContractCall,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../../test-utils";

describe("<MagicLinkForm />", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    await renderWithStub({
      path: "/",
      Component: MagicLinkForm,
      initialEntries: ["/"],
      me: null,
    });
    await screen.findByRole("form");
  });
  it("should submit email and show confirmation", async () => {
    const { user } = await renderWithStub({
      path: "/",
      Component: MagicLinkForm,
      initialEntries: ["/"],
      me: null,
    });

    await user.type(
      screen.getByLabelText(/^email$/i),
      String(requestValue("auth", "magic_link", "success", "email")),
    );
    await user.click(screen.getByRole("button"));

    expectContractCall("auth", "magic_link", "success");
  });
  it("should display inline errors when email is invalid", async () => {
    await renderWithStub({
      path: "/",
      Component: MagicLinkForm,
      initialEntries: ["/"],
      me: null,
    });

    await fireEvent.submit(screen.getByRole("form"));

    await screen.findByText(/invalid/i);
  });
});
