import { act, fireEvent, screen } from "@testing-library/react";

import AccountPage from "../../../../src/react/components/auth/AccountPage";
import { fooUser } from "../../../fixtures/users";
import {
  expectContractCall,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../../test-utils";

describe("<AccountPage />", () => {
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
      Component: AccountPage,
      initialEntries: ["/"],
      me: fooUser,
    });

    await screen.findByRole("heading", { level: 1, name: /account/i });
  });

  it("should submit account details form", async () => {
    const { user } = await renderWithStub({
      path: "/",
      Component: AccountPage,
      initialEntries: ["/"],
      me: fooUser,
    });

    await user.clear(screen.getByRole("textbox", { name: /email/i }));
    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      String(requestValue("users", "edit_me", "as_me", "email")),
    );
    await user.clear(screen.getByRole("textbox", { name: /name/i }));
    await user.type(
      screen.getByRole("textbox", { name: /name/i }),
      String(requestValue("users", "edit_me", "as_me", "name")),
    );
    await user.click(screen.getByRole("button", { name: /save/i }));

    expectContractCall("users", "edit_me", "as_me");
  });

  it("should display inline errors when submitted data is invalid", async () => {
    const { user } = await renderWithStub({
      path: "/",
      Component: AccountPage,
      initialEntries: ["/"],
      me: fooUser,
    });

    await user.clear(screen.getByRole("textbox", { name: /email/i }));
    await user.clear(screen.getByRole("textbox", { name: /name/i }));
    await act(async () => {
      await fireEvent.submit(screen.getByRole("form"));
    });

    await screen.findByText("Nom requis");
  });

  it("should submit logout form", async () => {
    const { user } = await renderWithStub({
      path: "/",
      Component: AccountPage,
      initialEntries: ["/"],
      me: fooUser,
    });

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expectContractCall("auth", "logout", "anyone");
  });

  it("should submit delete form", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    const { user } = await renderWithStub({
      path: "/",
      Component: AccountPage,
      initialEntries: ["/"],
      me: fooUser,
    });

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expectContractCall("users", "delete_me", "as_me");
  });

  it("should not submit delete form when user cancels", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);

    const { user } = await renderWithStub({
      path: "/",
      Component: AccountPage,
      initialEntries: ["/"],
      me: fooUser,
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockClear();

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
