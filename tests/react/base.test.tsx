import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Home from "../../src/react/components/Home";
import Layout from "../../src/react/components/Layout";

import { mockFetch, stubRoute } from "./utils";

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React base components", () => {
  describe("<Home />", () => {
    it("should mount successfully", async () => {
      const Stub = stubRoute("/", Home);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() =>
        screen.getByRole("heading", { level: 1, name: /starter/i }),
      );
    });
    it("should count the clicks", async () => {
      const Stub = stubRoute("/", Home);

      render(<Stub initialEntries={["/"]} />);

      const count = screen.getByTestId("count-value");

      expect(count.textContent).toBe("0");

      const user = userEvent.setup();

      await user.click(screen.getByRole("button", { name: /count/i }));

      await waitFor(() => {
        expect(count.textContent).toBe("1");
      });
    });
  });
  describe("<Layout />", () => {
    it("should mount successfully", async () => {
      const Stub = stubRoute("/", () => <Layout />);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByRole("navigation"));
    });
    it("should render its children", async () => {
      const Stub = stubRoute("/", () => <Layout>hello, world!</Layout>);

      render(<Stub initialEntries={["/"]} />);

      await waitFor(() => screen.getByText("hello, world!"));
    });
  });
});
