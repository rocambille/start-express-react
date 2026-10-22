import { screen } from "@testing-library/react";
import Layout from "../../../../src/react/components/Layout";
import { standardUser } from "../../../fixtures/users";
import { renderWithStub, setupMocks } from "../../test-utils";

/*
  Authentication behavior of the layout: kept with the auth tests, so that
  make:purge removes it along with the auth module.
*/
describe("<Layout /> with authentication", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should render magic link form when not authenticated", async () => {
    await renderWithStub({
      path: "/",
      Component: () => <Layout />,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByLabelText(/email/i);
  });

  it("should render account link when authenticated", async () => {
    await renderWithStub({
      path: "/",
      Component: () => <Layout />,
      initialEntries: ["/"],
      me: standardUser,
    });

    await screen.findByText(/account/i);
  });
});
