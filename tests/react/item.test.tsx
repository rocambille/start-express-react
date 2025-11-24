import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as ReactRouter from "react-router";

import ItemCreate from "../../src/react/components/item/ItemCreate";
import ItemDeleteForm from "../../src/react/components/item/ItemDeleteForm";
import ItemEdit from "../../src/react/components/item/ItemEdit";
import ItemList from "../../src/react/components/item/ItemList";
import ItemShow from "../../src/react/components/item/ItemShow";
import useItems from "../../src/react/components/item/useItems";

import {
  mockAuth,
  mockedInsertId,
  mockedItems,
  mockFetch,
  renderAsync,
  stubRoute,
} from "./utils";

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("React item components", () => {
  describe("useItems", () => {
    it("should return items", async () => {
      mockAuth(null);

      expect.assertions(1);

      const Stub = stubRoute("/items", () => {
        const { items } = useItems();

        expect(items).toEqual(mockedItems);

        return "hello, world!";
      });

      await renderAsync(<Stub initialEntries={["/items"]} />);

      await waitFor(() => screen.getByText("hello, world!"));
    });
    it("should return non null item when params contain valid id", async () => {
      mockAuth(null);

      expect.assertions(1);

      const Stub = stubRoute("/items/:id", () => {
        const { item } = useItems();

        expect(item).toEqual(mockedItems[0]);

        return "hello, world!";
      });

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}`]} />,
      );

      await waitFor(() => screen.getByText("hello, world!"));
    });
    it("should return undefined item when params contain invalid id", async () => {
      mockAuth(null);

      expect.assertions(1);

      const Stub = stubRoute("/items/:id", () => {
        const { item } = useItems();

        expect(item).toBeUndefined();

        return "hello, world!";
      });

      await renderAsync(<Stub initialEntries={["/items/0"]} />);

      await waitFor(() => screen.getByText("hello, world!"));
    });
    it("should return undefined item when params don't contain id", async () => {
      mockAuth(null);

      expect.assertions(1);

      const Stub = stubRoute("/items", () => {
        const { item } = useItems();

        expect(item).toBeUndefined();

        return "hello, world!";
      });

      await renderAsync(<Stub initialEntries={["/items"]} />);

      await waitFor(() => screen.getByText("hello, world!"));
    });
  });
  describe("<ItemCreate />", () => {
    it("should mount successfully", async () => {
      mockAuth(null);

      const Stub = stubRoute("/items/new", ItemCreate);

      await renderAsync(<Stub initialEntries={["/items/new"]} />);

      await waitFor(() => screen.getByRole("button"));
    });
    it("should submit form creating an item", async () => {
      mockAuth({ id: 1, email: "foo@mail.com" });

      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );

      const Stub = stubRoute("/items/new", ItemCreate);

      await renderAsync(<Stub initialEntries={["/items/new"]} />);

      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/title/i), "New item");
      await user.click(screen.getByRole("button"));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/items",
        expect.objectContaining({
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: "New item" }),
        }),
      );

      expect(mockedNavigate).toHaveBeenCalledWith(`/items/${mockedInsertId}`);
    });
  });
  describe("<ItemDeleteForm />", () => {
    it("should mount successfully", async () => {
      mockAuth(null);

      const Stub = stubRoute("/items/:id", ItemDeleteForm);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}`]} />,
      );

      await waitFor(() => screen.getByRole("button"));
    });
    it("should submit form editing an item", async () => {
      mockAuth({ id: 1, email: "foo@mail.com" });

      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );

      const Stub = stubRoute("/items/:id", ItemDeleteForm);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}`]} />,
      );

      const user = userEvent.setup();

      await user.click(screen.getByRole("button"));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/items/${mockedItems[0].id}`,
        expect.objectContaining({
          method: "delete",
        }),
      );

      expect(mockedNavigate).toHaveBeenCalledWith("/items");
    });
  });
  describe("<ItemEdit />", () => {
    it("should mount successfully", async () => {
      mockAuth(null);

      const Stub = stubRoute("/items/:id/edit", ItemEdit);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}/edit`]} />,
      );

      await waitFor(() => screen.getByRole("button"));
    });
    it("should throw 404 when params contain invalid id", async () => {
      mockAuth(null);

      const Stub = stubRoute("/items/:id/edit", ItemEdit);

      expect(() => render(<Stub initialEntries={["/items/0/edit"]} />)).toThrow(
        /\b404\b/,
      );
    });
    it("should submit form editing an item", async () => {
      mockAuth({ id: 1, email: "foo@mail.com" });

      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );

      const Stub = stubRoute("/items/:id/edit", ItemEdit);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}/edit`]} />,
      );

      const user = userEvent.setup();

      await user.clear(screen.getByLabelText(/title/i));
      await user.type(screen.getByLabelText(/title/i), "Updated item");
      await user.click(screen.getByRole("button"));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/items/${mockedItems[0].id}`,
        expect.objectContaining({
          method: "put",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: "Updated item" }),
        }),
      );

      expect(mockedNavigate).toHaveBeenCalledWith(
        `/items/${mockedItems[0].id}`,
      );
    });
  });
  describe("<ItemList />", () => {
    it("should mount successfully", async () => {
      mockAuth(null);

      const Stub = stubRoute("/items", ItemList);

      await renderAsync(<Stub initialEntries={["/items"]} />);

      await waitFor(() =>
        screen.getByRole("heading", { level: 1, name: /items/i }),
      );
    });
    it("should not display link to create item when anonymous", async () => {
      mockAuth(null);

      const Stub = stubRoute("/items", ItemList);

      await renderAsync(<Stub initialEntries={["/items"]} />);

      await waitFor(() => expect(screen.queryByTestId("items-new")).toBeNull());
    });
    it("should display link to create item when authentified", async () => {
      mockAuth({ id: 1, email: "foo@mail.com" });

      const Stub = stubRoute("/items", ItemList);

      await renderAsync(<Stub initialEntries={["/items"]} />);

      await waitFor(() => screen.getByTestId("items-new"));
    });
  });
  describe("<ItemShow />", () => {
    it("should mount successfully", async () => {
      mockAuth(null);

      const Stub = stubRoute("/items/:id", ItemShow);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}`]} />,
      );

      await waitFor(() =>
        screen.getByRole("heading", { level: 1, name: mockedItems[0].title }),
      );
    });
    it("should throw 404 when params contain invalid id", async () => {
      mockAuth(null);

      const Stub = stubRoute("/items/:id", ItemShow);

      expect(() => render(<Stub initialEntries={["/items/0"]} />)).toThrow(
        /\b404\b/,
      );
    });
    it("should not display link to edit item when anonymous", async () => {
      mockAuth(null);

      const Stub = stubRoute("/items/:id", ItemShow);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}`]} />,
      );

      await waitFor(() =>
        expect(
          screen.queryByTestId(`items-edit-/${mockedItems[0].id}`),
        ).toBeNull(),
      );
    });
    it("should display link to edit item when authentified", async () => {
      mockAuth({ id: 1, email: "foo@mail.com" });

      const Stub = stubRoute("/items/:id", ItemShow);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}`]} />,
      );

      await waitFor(() =>
        screen.getByTestId(`items-edit-${mockedItems[0].id}`),
      );
    });
  });
});
