/*
  Purpose:
  Unit tests for the deleteUploadedFile helper in upload.ts.

  Strategy:
  - Spy on node:fs to control existsSync / unlinkSync behaviour
  - Test all branches: early return, file missing, file present
*/

import fs from "node:fs";
import { deleteUploadedFile } from "../../../src/express/helpers/upload";

describe("deleteUploadedFile", () => {
  let existsSyncSpy: ReturnType<typeof vi.spyOn>;
  let unlinkSyncSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);
    unlinkSyncSpy = vi.spyOn(fs, "unlinkSync").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when relativeUrl is undefined", () => {
    deleteUploadedFile(undefined);

    expect(existsSyncSpy).not.toHaveBeenCalled();
    expect(unlinkSyncSpy).not.toHaveBeenCalled();
  });

  it("does nothing when relativeUrl is null", () => {
    deleteUploadedFile(null);

    expect(existsSyncSpy).not.toHaveBeenCalled();
    expect(unlinkSyncSpy).not.toHaveBeenCalled();
  });

  it("does nothing when relativeUrl does not start with /uploads/", () => {
    deleteUploadedFile("/other/path/file.png");

    expect(existsSyncSpy).not.toHaveBeenCalled();
    expect(unlinkSyncSpy).not.toHaveBeenCalled();
  });

  it("does not call unlinkSync when the file does not exist", () => {
    existsSyncSpy.mockReturnValue(false);

    deleteUploadedFile("/uploads/avatars/some-uuid.webp");

    expect(existsSyncSpy).toHaveBeenCalledOnce();
    expect(unlinkSyncSpy).not.toHaveBeenCalled();
  });

  it("calls unlinkSync when the file exists", () => {
    existsSyncSpy.mockReturnValue(true);

    deleteUploadedFile("/uploads/avatars/some-uuid.webp");

    expect(existsSyncSpy).toHaveBeenCalledOnce();
    expect(unlinkSyncSpy).toHaveBeenCalledOnce();
    expect(unlinkSyncSpy).toHaveBeenCalledWith(
      expect.stringContaining("/uploads/avatars/some-uuid.webp"),
    );
  });
});
