import { screen } from "@testing-library/react";

import LogoutForm from "../../../../src/react/components/auth/LogoutForm";
import {
  expectContractCall,
  fooUser,
  renderWithStub,
  setupMocks,
} from "../../test-utils";

describe("<LogoutForm />", () => {
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
      Component: LogoutForm,
      initialEntries: ["/"],
      me: fooUser,
    });
    await screen.findByRole("button");
  });
  it("should submit form logout", async () => {
    const { user } = await renderWithStub({
      path: "/",
      Component: LogoutForm,
      initialEntries: ["/"],
      me: fooUser,
    });
    await screen.findByRole("button");

    await user.click(screen.getByRole("button"));

    expectContractCall("auth", "logout", "anyone");
  });
});
