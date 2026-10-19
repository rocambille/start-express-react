/*
  Purpose:
  Provide reusable multipart file upload middleware factory for Express modules.

  Related docs:
  - https://github.com/expressjs/multer
*/

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

export interface UploaderOptions {
  subfolder: string;
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
}

const MIME_TO_EXTENSION = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

/*
  Root folder of all uploaded files.
  Never served publicly: a module serving them puts its own access check
  in front (e.g. authentication).
*/
export const UPLOADS_DIR = path.join(
  import.meta.dirname,
  "../../../data/uploads",
);

const DEFAULT_OPTIONS: Required<Omit<UploaderOptions, "subfolder">> = {
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: Array.from(MIME_TO_EXTENSION.keys()),
};

export const createUploader = (options: UploaderOptions): multer.Multer => {
  const { subfolder, allowedMimeTypes, maxSizeBytes } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const destDir = path.join(UPLOADS_DIR, subfolder);

  fs.mkdirSync(destDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destDir),
    filename: (_req, file, cb) => {
      const ext =
        MIME_TO_EXTENSION.get(file.mimetype) ??
        path.extname(file.originalname).toLowerCase();

      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeBytes },
    fileFilter: (_req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const error: Error & { status?: number } = new Error(
          `Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(", ")}`,
        );

        // Attach status code for Express error handler
        error.status = 400;

        cb(error);
      }
    },
  });
};

export const deleteUploadedFile = (relativeUrl?: string | null): void => {
  if (!relativeUrl?.startsWith("/uploads/")) return;

  const filePath = path.join(import.meta.dirname, "../../../data", relativeUrl);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
