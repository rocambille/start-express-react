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
    await renderWithStub("/", MagicLinkForm, ["/"], { me: null });
    await screen.findByRole("form");
  });
  it("should submit email and show confirmation", async () => {
    const { user } = await renderWithStub("/", MagicLinkForm, ["/"], {
      me: null,
    });

    await user.type(
      screen.getByLabelText(/^email$/i),
      requestValue("auth", "magic_link", "success", "email"),
    );
    await user.click(screen.getByRole("button"));

    expectContractCall("auth", "magic_link", "success");
  });
  it("should fail when email is invalid", async () => {
    vi.spyOn(globalThis, "alert").mockImplementationOnce(() => {});

    await renderWithStub("/", MagicLinkForm, ["/"], {
      me: null,
    });

    await fireEvent.submit(screen.getByRole("form"));

    expect(alert).toHaveBeenCalled();
  });
});
