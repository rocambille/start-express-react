import { screen } from "@testing-library/react";
import Home from "../../../src/react/components/Home";
import { renderWithStub, setupMocks } from "../test-utils";

describe("<Home />", () => {
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
      Component: () => <Home />,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("heading", { level: 1 });
  });

  it("should count", async () => {
    const { user } = await renderWithStub({
      path: "/",
      Component: () => <Home />,
      initialEntries: ["/"],
      me: null,
    });

    await user.click(screen.getByRole("button"));
  });
});
