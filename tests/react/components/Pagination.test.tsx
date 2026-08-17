import { screen } from "@testing-library/react";
import Pagination from "../../../src/react/components/Pagination";
import { renderWithStub, setupMocks } from "../test-utils";

describe("<Pagination />", () => {
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
      Component: () => <Pagination total={10} pageSize={1} currentPage={1} />,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByRole("navigation");
  });

  it("should display Previous and Next when needed", async () => {
    await renderWithStub({
      path: "/",
      Component: () => <Pagination total={100} pageSize={10} currentPage={5} />,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByText("Previous");
    await screen.findByText("Next");
  });

  it("should not display Previous on first page", async () => {
    await renderWithStub({
      path: "/",
      Component: () => <Pagination total={100} pageSize={10} currentPage={1} />,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByText("Next");
    expect(screen.queryByText("Previous")).toBeNull();
  });

  it("should not display Next on last page", async () => {
    await renderWithStub({
      path: "/",
      Component: () => (
        <Pagination total={100} pageSize={10} currentPage={10} />
      ),
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByText("Previous");
    expect(screen.queryByText("Next")).toBeNull();
  });

  it("should not display Previous nor Next when only one page", async () => {
    await renderWithStub({
      path: "/",
      Component: () => <Pagination total={10} pageSize={10} currentPage={1} />,
      initialEntries: ["/"],
      me: null,
    });

    expect(screen.queryByText("Previous")).toBeNull();
    expect(screen.queryByText("Next")).toBeNull();
  });

  it("should display all page numbers when needed", async () => {
    await renderWithStub({
      path: "/",
      Component: () => <Pagination total={100} pageSize={10} currentPage={5} />,
      initialEntries: ["/"],
      me: null,
    });

    await screen.findByText("1");
    await screen.findByText("2");
    await screen.findByText("3");
    await screen.findByText("4");
    await screen.findByText("5");
    await screen.findByText("6");
    await screen.findByText("7");
    await screen.findByText("8");
    await screen.findByText("9");
    await screen.findByText("10");
  });

  it("should mark current page with aria-current", async () => {
    await renderWithStub({
      path: "/",
      Component: () => <Pagination total={100} pageSize={10} currentPage={5} />,
      initialEntries: ["/"],
      me: null,
    });

    expect(screen.getByText("5").getAttribute("aria-current")).toBe("page");
  });
});
