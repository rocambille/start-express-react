import { screen } from "@testing-library/react";
import * as ReactRouter from "react-router";

import VerifyPage from "../../../../src/react/components/auth/VerifyPage";
import {
  expectContractCall,
  renderWithStub,
  requestValue,
  setupMocks,
} from "../../test-utils";

describe("<VerifyPage />", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should mount successfully", async () => {
    const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});
    vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
      () => mockedNavigate,
    );

    await renderWithStub({
      path: "/verify",
      Component: VerifyPage,
      initialEntries: [
        `/verify?token=${requestValue("auth", "verify", "success", "token")}`,
      ],
      me: null,
    });

    await screen.findByText(/in progress/i);
  });
  it("should verify token and redirect to dashboard when valid", async () => {
    const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});
    vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
      () => mockedNavigate,
    );

    await renderWithStub({
      path: "/verify",
      Component: VerifyPage,
      initialEntries: [
        `/verify?token=${requestValue("auth", "verify", "success", "token")}`,
      ],
      me: null,
    });

    expectContractCall("auth", "verify", "success");

    expect(mockedNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
  it("should display error when token is invalid", async () => {
    const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});
    vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
      () => mockedNavigate,
    );

    await renderWithStub({
      path: "/verify",
      Component: VerifyPage,
      initialEntries: [
        `/verify?token=${requestValue("auth", "verify", "unauthorized", "token")}`,
      ],
      me: null,
    });

    await screen.findByText(/invalid/i);

    expectContractCall("auth", "verify", "unauthorized");
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
  it("should display error when token is missing", async () => {
    const mockedNavigate = vi.fn().mockImplementation((_to: string) => {});
    vi.spyOn(ReactRouter, "useNavigate").mockImplementation(
      () => mockedNavigate,
    );

    await renderWithStub({
      path: "/verify",
      Component: VerifyPage,
      initialEntries: ["/verify"],
      me: null,
    });

    await screen.findByText(/invalid/i);

    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      "/api/auth/verify",
      expect.objectContaining({
        method: "post",
      }),
    );
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
});
