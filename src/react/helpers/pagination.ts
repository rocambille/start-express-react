/*
  Purpose:
  Provide helpers for HTTP Range-based pagination in React components.
*/

/*
  parseContentRangeTotal(header):
  - Extracts the total count from a Content-Range response header
  - "items 0-9/42" → 42
  - Returns 0 if the header is absent or malformed
*/
export const parseContentRangeTotal = (header: string | null): number => {
  const match = /\/(\d+)$/.exec(header ?? "");
  return match ? Number(match[1]) : 0;
};
