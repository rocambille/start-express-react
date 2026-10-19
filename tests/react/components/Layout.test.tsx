import { screen } from "@testing-library/react";
import Layout from "../../../src/react/components/Layout";
import { renderWithStub, setupMocks } from "../test-utils";

/*
  Authentication-specific behavior of the layout is tested with the auth
  tests, so that make:purge removes it along with the auth module.
*/
describe("<Layout />", () => {
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
      Component: () => <Layout />,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("navigation");
  });
});
