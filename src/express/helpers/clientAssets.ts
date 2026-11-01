/*
  Purpose:
  Serve the built client assets (dist/client) in production.

  Design notes:
  - index: false — otherwise "/" serves the raw index.html template
    (empty SSR outlet, publicly cacheable) instead of falling through to
    server-side rendering
  - extensions: [] — no implicit ".html" lookups: pages are rendered by
    the SSR catch-all, never read from disk
  - explicit ".html" URLs fall through too, for the same reason: the path
    is decoded first, as the static middleware will decode it
*/

import express, { type RequestHandler } from "express";

const isHtmlFile = (urlPath: string) => {
  try {
    return decodeURIComponent(urlPath).toLowerCase().endsWith(".html");
  } catch {
    // Malformed URL: not a file, the static middleware will reject it
    return false;
  }
};

export const clientAssets = (directory: string): RequestHandler => {
  const serveFiles = express.static(directory, {
    extensions: [],
    index: false,
  });

  return (req, res, next) => {
    if (isHtmlFile(req.path)) {
      next();
      return;
    }

    serveFiles(req, res, next);
  };
};
