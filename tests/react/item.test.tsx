import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as ReactRouter from "react-router";

import { useItems } from "../../src/react/components/item/hooks";
import ItemCreate from "../../src/react/components/item/ItemCreate";
import ItemDeleteForm from "../../src/react/components/item/ItemDeleteForm";
import ItemEdit from "../../src/react/components/item/ItemEdit";
import ItemList from "../../src/react/components/item/ItemList";
import ItemShow from "../../src/react/components/item/ItemShow";

import {
  mockedInsertId,
  mockedItems,
  mockFetch,
  mockUseAuth,
  mockUseItems,
  renderAsync,
  renderHookAsync,
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
      mockUseAuth(null);

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(() => () => {});

      const { result } = await renderHookAsync(() => useItems());

      expect(result.current.items).toEqual(mockedItems);
    });
    it("should return valid item when params contain valid id", async () => {
      mockUseAuth(null);

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(() => () => {});
      vi.spyOn(ReactRouter, "useParams").mockImplementation(() => ({
        id: mockedItems[0].id.toString(),
      }));

      const { result } = await renderHookAsync(() => useItems());

      expect(result.current.item).toEqual(mockedItems[0]);
    });
    it("should return undefined item when params contain invalid id", async () => {
      mockUseAuth(null);

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(() => () => {});
      vi.spyOn(ReactRouter, "useParams").mockImplementation(() => ({
        id: mockedInsertId.toString(),
      }));

      const { result } = await renderHookAsync(() => useItems());

      expect(result.current.item).toBeUndefined();
    });
    it("should return undefined item when params don't contain id", async () => {
      mockUseAuth(null);

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(() => () => {});
      vi.spyOn(ReactRouter, "useParams").mockImplementation(() => ({}));

      const { result } = await renderHookAsync(() => useItems());

      expect(result.current.item).toBeUndefined();
    });
    it("should return editItem function", async () => {
      mockUseAuth({ id: 1, email: "foo@mail.com" });

      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );
      vi.spyOn(ReactRouter, "useParams").mockImplementation(() => ({
        id: mockedItems[0].id.toString(),
      }));

      const { result } = await renderHookAsync(() => useItems());

      expect(typeof result.current.editItem).toBe("function");

      await act(async () => {
        result.current.editItem({ title: "Updated item" });
      });

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
    it("should return addItem function", async () => {
      mockUseAuth({ id: 1, email: "foo@mail.com" });

      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );
      vi.spyOn(ReactRouter, "useParams").mockImplementation(() => ({}));

      const { result } = await renderHookAsync(() => useItems());

      expect(typeof result.current.addItem).toBe("function");

      await act(async () => {
        result.current.addItem({ title: "New item" });
      });

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
    it("should return deleteItem function", async () => {
      mockUseAuth({ id: 1, email: "foo@mail.com" });

      const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});

      vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
        () => mockedNavigate,
      );
      vi.spyOn(ReactRouter, "useParams").mockImplementation(() => ({
        id: mockedItems[0].id.toString(),
      }));

      const { result } = await renderHookAsync(() => useItems());

      expect(typeof result.current.deleteItem).toBe("function");

      await act(async () => {
        result.current.deleteItem();
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/items/${mockedItems[0].id}`,
        expect.objectContaining({
          method: "delete",
        }),
      );

      expect(mockedNavigate).toHaveBeenCalledWith("/items");
    });
  });
  describe("<ItemCreate />", () => {
    it("should mount successfully", async () => {
      mockUseItems();

      const Stub = stubRoute("/items/new", ItemCreate);

      await renderAsync(<Stub initialEntries={["/items/new"]} />);

      await waitFor(() => screen.getByRole("button"));
    });
    it("should submit form creating an item", async () => {
      const [{ addItem }] = mockUseItems();

      const Stub = stubRoute("/items/new", ItemCreate);

      await renderAsync(<Stub initialEntries={["/items/new"]} />);

      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/title/i), "New item");
      await user.click(screen.getByRole("button"));

      expect(addItem).toHaveBeenCalledWith({ title: "New item" });
    });
  });
  describe("<ItemDeleteForm />", () => {
    it("should mount successfully", async () => {
      mockUseItems({ id: mockedItems[0].id.toString() });

      const Stub = stubRoute("/items/:id", ItemDeleteForm);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}`]} />,
      );

      await waitFor(() => screen.getByRole("button"));
    });
    it("should submit form editing an item", async () => {
      const [{ deleteItem }] = mockUseItems({
        id: mockedItems[0].id.toString(),
      });

      const Stub = stubRoute("/items/:id", ItemDeleteForm);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}`]} />,
      );

      const user = userEvent.setup();

      await user.click(screen.getByRole("button"));

      expect(deleteItem).toHaveBeenCalled();
    });
  });
  describe("<ItemEdit />", () => {
    it("should mount successfully", async () => {
      mockUseItems({ id: mockedItems[0].id.toString() });

      const Stub = stubRoute("/items/:id/edit", ItemEdit);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}/edit`]} />,
      );

      await waitFor(() => screen.getByRole("button"));
    });
    it("should throw 404 when params contain invalid id", async () => {
      mockUseItems({ id: "0" });

      const Stub = stubRoute("/items/:id/edit", ItemEdit);

      expect(() => render(<Stub initialEntries={["/items/0/edit"]} />)).toThrow(
        /\b404\b/,
      );
    });
    it("should submit form editing an item", async () => {
      const [{ editItem }] = mockUseItems({ id: mockedItems[0].id.toString() });

      const Stub = stubRoute("/items/:id/edit", ItemEdit);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}/edit`]} />,
      );

      const user = userEvent.setup();

      await user.clear(screen.getByLabelText(/title/i));
      await user.type(screen.getByLabelText(/title/i), "Updated item");
      await user.click(screen.getByRole("button"));

      expect(editItem).toHaveBeenCalledWith({ title: "Updated item" });
    });
  });
  describe("<ItemList />", () => {
    it("should mount successfully", async () => {
      mockUseAuth(null);
      mockUseItems();

      const Stub = stubRoute("/items", ItemList);

      await renderAsync(<Stub initialEntries={["/items"]} />);

      await waitFor(() =>
        screen.getByRole("heading", { level: 1, name: /items/i }),
      );
    });
    it("should not display link to create item when anonymous", async () => {
      mockUseAuth(null);
      mockUseItems();

      const Stub = stubRoute("/items", ItemList);

      await renderAsync(<Stub initialEntries={["/items"]} />);

      await waitFor(() => expect(screen.queryByTestId("items-new")).toBeNull());
    });
    it("should display link to create item when authentified", async () => {
      mockUseAuth({ id: 1, email: "foo@mail.com" });
      mockUseItems();

      const Stub = stubRoute("/items", ItemList);

      await renderAsync(<Stub initialEntries={["/items"]} />);

      await waitFor(() => screen.getByTestId("items-new"));
    });
  });
  describe("<ItemShow />", () => {
    it("should mount successfully", async () => {
      mockUseAuth(null);
      mockUseItems({ id: mockedItems[0].id.toString() });

      const Stub = stubRoute("/items/:id", ItemShow);

      await renderAsync(
        <Stub initialEntries={[`/items/${mockedItems[0].id}`]} />,
      );

      await waitFor(() =>
        screen.getByRole("heading", { level: 1, name: mockedItems[0].title }),
      );
    });
    it("should throw 404 when params contain invalid id", async () => {
      mockUseAuth(null);
      mockUseItems({ id: "0" });

      const Stub = stubRoute("/items/:id", ItemShow);

      expect(() => render(<Stub initialEntries={["/items/0"]} />)).toThrow(
        /\b404\b/,
      );
    });
    it("should not display link to edit item when anonymous", async () => {
      mockUseAuth(null);
      mockUseItems({ id: mockedItems[0].id.toString() });

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
      mockUseAuth({ id: 1, email: "foo@mail.com" });
      mockUseItems({ id: mockedItems[0].id.toString() });

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
