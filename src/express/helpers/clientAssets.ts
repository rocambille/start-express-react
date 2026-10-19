/*
  Purpose:
  Serve the built client assets (dist/client) in production.

  Design notes:
  - index: false — otherwise "/" serves the raw index.html template
    (empty SSR outlet, publicly cacheable) instead of falling through to
    server-side rendering
  - extensions: [] — no implicit ".html" lookups: pages are rendered by
    the SSR catch-all, never read from disk
*/

import express, { type RequestHandler } from "express";

export const clientAssets = (directory: string): RequestHandler =>
  express.static(directory, { extensions: [], index: false });
