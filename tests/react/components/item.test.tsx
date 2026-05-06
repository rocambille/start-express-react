import { fireEvent, screen } from "@testing-library/react";
import * as ReactRouter from "react-router";

import ItemCreate from "../../../src/react/components/item/ItemCreate";
import ItemDeleteForm from "../../../src/react/components/item/ItemDeleteForm";
import ItemEdit from "../../../src/react/components/item/ItemEdit";
import ItemForm from "../../../src/react/components/item/ItemForm";
import ItemList from "../../../src/react/components/item/ItemList";
import ItemShow from "../../../src/react/components/item/ItemShow";

import {
  allItems,
  expectContractCall,
  fooUser,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../test-utils";

describe("React item components", () => {
  beforeEach(() => {
    setupMocks();
    vi.spyOn(ReactRouter, "useNavigate").mockImplementation(() => () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("<ItemCreate />", () => {
    it("should mount successfully", async () => {
      await renderWithStub("/items/new", ItemCreate, ["/items/new"], {
        me: fooUser,
      });

      await screen.findByRole("button");
    });
    it("should submit form and create an item", async () => {
      const { user } = await renderWithStub(
        "/items/new",
        ItemCreate,
        ["/items/new"],
        { me: fooUser },
      );

      await user.type(
        screen.getByLabelText(/title/i),
        requestValue("items", "create", "success", "title"),
      );
      await user.click(screen.getByRole("button"));

      expectContractCall("items", "create", "success");
    });
  });

  describe("<ItemDeleteForm />", () => {
    it("should mount successfully", async () => {
      await renderWithStub(
        "/items/:id",
        ItemDeleteForm,
        [`/items/${allItems[0].id}`],
        { me: fooUser },
      );

      await screen.findByRole("button");
    });
    it("should submit form and delete an item", async () => {
      const { user } = await renderWithStub(
        "/items/:id",
        ItemDeleteForm,
        [`/items/${allItems[0].id}`],
        { me: fooUser },
      );

      await user.click(screen.getByRole("button"));

      expectContractCall("items", "delete", "success");
    });
  });

  describe("<ItemEdit />", () => {
    it("should mount successfully", async () => {
      await renderWithStub(
        "/items/:id/edit",
        ItemEdit,
        [`/items/${allItems[0].id}/edit`],
        { me: fooUser },
      );

      await screen.findByRole("button");
    });
    it("should throw 404 when params contain invalid id", async () => {
      await expect(() =>
        renderWithStub("/items/:id/edit", ItemEdit, [`/items/${NaN}/edit`], {
          me: fooUser,
        }),
      ).rejects.toThrow(/404/);
    });
    it("should submit form and edit an item", async () => {
      const { user } = await renderWithStub(
        "/items/:id/edit",
        ItemEdit,
        [`/items/${allItems[0].id}/edit`],
        { me: fooUser },
      );

      await user.clear(screen.getByLabelText(/title/i));
      await user.type(
        screen.getByLabelText(/title/i),
        requestValue("items", "edit", "success", "title"),
      );
      await user.click(screen.getByRole("button"));

      expectContractCall("items", "edit", "success");
    });
  });

  describe("<ItemForm />", () => {
    it("should mount successfully", async () => {
      await renderWithStub(
        "/items/new",
        () => (
          <ItemForm defaultValue={{ title: "" }} action={() => {}}>
            <button type="submit">submit</button>
          </ItemForm>
        ),
        ["/items/new"],
        { me: fooUser },
      );

      await screen.findByRole("form", { name: /item form/i });
    });
    it("should raise validation errors when submitting", async () => {
      vi.spyOn(globalThis, "alert").mockImplementation(() => {});

      await renderWithStub(
        "/items/new",
        () => (
          <ItemForm defaultValue={{ title: "" }} action={() => {}}>
            <button type="submit">submit</button>
          </ItemForm>
        ),
        ["/items/new"],
        { me: fooUser },
      );

      await fireEvent.submit(screen.getByRole("form", { name: /item form/i }));

      expect(alert).toHaveBeenCalled();
    });
  });

  describe("<ItemList />", () => {
    it("should mount successfully", async () => {
      await renderWithStub("/items", ItemList, ["/items"], { me: fooUser });

      await screen.findByRole("heading", { level: 1, name: /items/i });

      expectContractCall("items", "browse", "success");
    });
    it("should not display link to create item when anonymous", async () => {
      await renderWithStub("/items", ItemList, ["/items"], { me: null });

      await screen.findByRole("heading", { level: 1, name: /items/i });

      expect(screen.queryByTestId("items-new")).toBeNull();
    });
    it("should display link to create item when authentified", async () => {
      await renderWithStub("/items", ItemList, ["/items"], { me: fooUser });

      await screen.findByTestId("items-new");
    });
  });

  describe("<ItemShow />", () => {
    it("should mount successfully", async () => {
      await renderWithStub(
        "/items/:id",
        ItemShow,
        [`/items/${allItems[0].id}`],
        { me: fooUser },
      );

      await screen.findByRole("heading", { level: 1, name: allItems[0].title });

      expectContractCall("items", "read", "success");
    });
    it("should throw 404 when params contain invalid id", async () => {
      await expect(() =>
        renderWithStub("/items/:id", ItemShow, [`/items/${NaN}`], {
          me: fooUser,
        }),
      ).rejects.toThrow(/404/);

      expectContractCall("items", "read", "not_found");
    });
    it("should not display link to edit item when anonymous", async () => {
      await renderWithStub(
        "/items/:id",
        ItemShow,
        [`/items/${allItems[0].id}`],
        { me: null },
      );

      await screen.findByRole("heading", { level: 1, name: allItems[0].title });

      expect(screen.queryByTestId(`items-edit-/${allItems[0].id}`)).toBeNull();
    });
    it("should display link to edit item when authentified", async () => {
      await renderWithStub(
        "/items/:id",
        ItemShow,
        [`/items/${allItems[0].id}`],
        { me: fooUser },
      );

      await screen.findByTestId(`items-edit-${allItems[0].id}`);
    });
  });
});
